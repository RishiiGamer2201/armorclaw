# backend/core/executor.py
# Orchestration layer: Plan → ArmorIQ Token → MoE Gatekeeper → Validator → Execute
#
# Three enforcement layers per step (ALL must pass):
#   1. PolicyEngine  — deterministic JSON-driven rules
#   2. MoE Gatekeeper — parallel expert panel votes → PolicyConsensus
#   3. ArmorIQ IAP   — cryptographic Merkle proof verification
#   4. Validator      — ConfidenceScore = 0.40*PolicyCons + 0.35*ArmorIQProof + 0.25*IntentAlignment
# Block if: score < threshold (0.70) OR any expert hard-vetoed

from backend.core.policy_engine    import PolicyEngine
from backend.core.intent_validator import IntentValidator
from backend.core.validator        import Validator
from backend.moe.gatekeeper        import Gatekeeper
from backend.tools.financial_tools import execute_tool
from backend.core import logger as audit


class Executor:
    def __init__(self) -> None:
        self.policy_engine    = PolicyEngine()
        self.intent_validator = IntentValidator()
        self.gatekeeper: Gatekeeper = None  # initialised after policy load
        self.validator        = Validator()
        self.initialized      = False

    async def initialize(self) -> "Executor":
        self.policy_engine.load()
        await self.intent_validator.initialize()
        policy = self.policy_engine.get_policy()
        self.gatekeeper = Gatekeeper(policy)
        await self.validator.initialize(policy)
        self.initialized = True
        return self

    async def execute_plan(self, plan: dict) -> dict:
        if not self.initialized:
            raise RuntimeError("Executor not initialized — call initialize() first")

        # ── Register plan → ArmorIQ intent token ──────────────────────────────
        token = await self.intent_validator.register_plan(plan)
        if token.get("rejected"):
            return {"success": False, "error": token.get("error"), "results": []}

        await audit.log_plan_created(plan, token.get("token_id"), token.get("source"))

        # ── Set intent anchor for drift detection ──────────────────────────────
        await self.validator.set_intent_anchor(plan.get("intent", ""))

        token_id  = token.get("token_id")
        threshold = self.validator.get_threshold()
        results   = []
        allowed_count = blocked_count = error_count = 0

        for step in plan.get("steps", []):
            step_result = {
                "step_id":     step.get("step_id"),
                "tool":        step.get("tool"),
                "rationale":   step.get("rationale", ""),
            }

            # ── Layer 1: Policy Engine (deterministic, fail-closed) ────────────
            policy_result = self.policy_engine.enforce(step["tool"], step.get("args", {}))

            if not policy_result["allowed"]:
                await audit.log_step_blocked(
                    step, policy_result["reason"], policy_result["rule"],
                    policy_result["severity"], "policy", 0.0,
                )
                blocked_count += 1
                results.append({
                    **step_result,
                    "status":     "blocked",
                    "blocked_by": "policy",
                    "confidence": 0.0,
                    "reason":     policy_result["reason"],
                    "rule":       policy_result["rule"],
                    "severity":   policy_result["severity"],
                    "score_breakdown": {"policy_cons": 0.0, "armoriq_proof": 0.5, "alignment": 0.5},
                    "expert_breakdown": [],
                })
                continue

            # ── Layer 2: MoE Gatekeeper (parallel expert panel) ────────────────
            mk_result = await self.gatekeeper.evaluate(step["tool"], step.get("args", {}), {"plan": plan})

            # ── Layer 3: ArmorIQ (cryptographic proof) ─────────────────────────
            armoriq_result = await self.intent_validator.verify_step(token_id, step)

            # ── Layer 4: Validator (ConfidenceScore) ───────────────────────────
            score_entry = await self.validator.score(step, mk_result, armoriq_result)
            score       = score_entry["score"]

            # ── Block: hard veto OR low confidence ────────────────────────────
            if mk_result["hard_veto"] or score < threshold:
                if mk_result["hard_veto"]:
                    reason = f"Expert veto by {mk_result['veto_expert']}: {mk_result['veto_reason']}"
                    rule   = mk_result["veto_rule"] or "gatekeeper.hardVeto"
                    blocked_by = "gatekeeper"
                elif not armoriq_result["verified"]:
                    reason = f"ArmorIQ verification failed + low confidence ({score*100:.0f}% < {threshold*100:.0f}%)"
                    rule   = armoriq_result.get("reason", "armoriq.verificationFailed")
                    blocked_by = "validator"
                else:
                    reason = f"ConfidenceScore {score*100:.0f}% below threshold {threshold*100:.0f}%"
                    rule   = "validator.confidenceThreshold"
                    blocked_by = "validator"

                await audit.log_step_blocked(
                    step, reason, rule, "high", blocked_by, score, mk_result.get("breakdown"),
                )
                blocked_count += 1
                results.append({
                    **step_result,
                    "status":          "blocked",
                    "blocked_by":      blocked_by,
                    "confidence":      score,
                    "reason":          reason,
                    "rule":            rule,
                    "score_breakdown": score_entry["breakdown"],
                    "expert_breakdown": mk_result.get("breakdown", []),
                })
                continue

            # ── All layers passed → execute ────────────────────────────────────
            await audit.log_step_allowed(step, policy_result, armoriq_result, score, mk_result.get("breakdown"))

            try:
                result = await execute_tool(step["tool"], step.get("args", {}))
                await audit.log_step_executed(step, result, score)
                allowed_count += 1
                results.append({
                    **step_result,
                    "status":          "executed",
                    "result":          result,
                    "confidence":      score,
                    "score_breakdown": score_entry["breakdown"],
                    "expert_breakdown": mk_result.get("breakdown", []),
                })
            except Exception as err:
                await audit.log_step_error(step, str(err))
                error_count += 1
                results.append({
                    **step_result,
                    "status":    "error",
                    "error":     str(err),
                    "confidence": score,
                    "score_breakdown": score_entry["breakdown"],
                    "expert_breakdown": mk_result.get("breakdown", []),
                })

        await audit.log_summary(plan, allowed_count, blocked_count, error_count)

        drift_log = self.validator.get_drift_log()
        avg_confidence = (
            sum(e["score"] for e in drift_log) / len(drift_log) if drift_log else 0.0
        )

        return {
            "success":         True,
            "intent":          plan.get("intent"),
            "risk_level":      plan.get("risk_level"),
            "token_id":        token_id,
            "token_source":    token.get("source"),
            "threshold":       threshold,
            "avg_confidence":  round(avg_confidence, 3),
            "results":         results,
            "stats":           {
                "allowed": allowed_count,
                "blocked": blocked_count,
                "errors":  error_count,
                "total":   len(plan.get("steps", [])),
            },
            "drift_log":       drift_log,
            "run_id":          audit.RUN_ID,
        }
