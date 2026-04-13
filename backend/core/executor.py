# backend/core/executor.py
# Orchestration layer: Plan → ArmorIQ Token → MoE Gatekeeper → Validator → Execute
#
# Four enforcement layers per step (ALL must pass):
#   1. PolicyEngine  — deterministic JSON-driven rules
#   2. MoE Gatekeeper — parallel expert panel votes → PolicyConsensus
#   3. ArmorIQ IAP   — cryptographic Merkle proof verification
#   4. Validator      — ConfidenceScore = 0.40*PolicyCons + 0.35*ArmorIQProof + 0.25*IntentAlignment
# Block if: score < threshold (0.60) OR any expert hard-vetoed
#
# Optional 5th layer: Delegation enforcement (when running as sub-agent)

import time
from backend.core.policy_engine    import PolicyEngine
from backend.core.intent_validator import IntentValidator
from backend.core.validator        import Validator
from backend.core.delegation       import DelegationManager
from backend.moe.gatekeeper        import Gatekeeper
from backend.tools.financial_tools import execute_tool
from backend.tools.universal_finance import (
    is_circuit_broken, record_trade, check_defcon_escalation, get_defcon_status,
)
from backend.core import logger as audit

TRADING_TOOLS = {"place_order", "cancel_order"}


class Executor:
    def __init__(self) -> None:
        self.policy_engine    = PolicyEngine()
        self.intent_validator = IntentValidator()
        self.gatekeeper: Gatekeeper = None
        self.validator        = Validator()
        self.delegation_mgr   = DelegationManager()
        self.initialized      = False

    async def initialize(self) -> "Executor":
        self.policy_engine.load()
        await self.intent_validator.initialize()
        policy = self.policy_engine.get_policy()
        self.gatekeeper = Gatekeeper(policy)
        await self.validator.initialize(policy)
        self.initialized = True
        return self

    async def execute_plan(self, plan: dict, delegation_id: str = None) -> dict:
        if not self.initialized:
            raise RuntimeError("Executor not initialized — call initialize() first")

        # ── Register plan → intent token (Merkle tree) ────────────────────────
        token = await self.intent_validator.register_plan(plan)
        if token.get("rejected"):
            return {"success": False, "error": token.get("error"), "results": []}

        await audit.log_plan_created(plan, token.get("token_id"), token.get("source"))

        # ── Set intent anchor for drift detection ─────────────────────────────
        await self.validator.set_intent_anchor(plan.get("intent", ""))

        token_id  = token.get("token_id")
        threshold = self.validator.get_threshold()
        results   = []
        allowed_count = blocked_count = error_count = 0

        # Get token info for response (Merkle visualization data)
        token_info = self.intent_validator.get_token_info(token_id)

        for step in plan.get("steps", []):
            t0 = time.perf_counter()
            step_result = {
                "step_id":   step.get("step_id"),
                "tool":      step.get("tool"),
                "rationale": step.get("rationale", ""),
            }
            enforcement_timeline = []

            # ── Layer 0 (optional): Delegation Scope ──────────────────────────
            if delegation_id:
                t_start = time.perf_counter()
                del_result = self.delegation_mgr.enforce_delegation(
                    delegation_id, step["tool"], step.get("args", {}),
                )
                t_elapsed = round((time.perf_counter() - t_start) * 1000, 1)
                enforcement_timeline.append({
                    "layer": "Delegation",
                    "allowed": del_result["allowed"],
                    "reason": del_result["reason"],
                    "rule": del_result.get("rule"),
                    "time_ms": t_elapsed,
                })
                if not del_result["allowed"]:
                    await audit.log_step_blocked(
                        step, del_result["reason"], del_result["rule"],
                        del_result["severity"], "delegation", 0.0,
                    )
                    blocked_count += 1
                    results.append({
                        **step_result,
                        "status": "blocked", "blocked_by": "delegation",
                        "confidence": 0.0, "reason": del_result["reason"],
                        "rule": del_result["rule"], "severity": del_result["severity"],
                        "enforcement_timeline": enforcement_timeline,
                        "score_breakdown": {}, "expert_breakdown": [],
                    })
                    continue

            # ── Circuit Breaker: Block trades if velocity limit exceeded ─────
            if step["tool"] in TRADING_TOOLS and is_circuit_broken():
                enforcement_timeline.append({
                    "layer": "CircuitBreaker",
                    "allowed": False,
                    "reason": "CIRCUIT BREAKER TRIPPED: Trading velocity exceeded safe limits. All trades frozen.",
                    "time_ms": 0.0,
                })
                await audit.log_step_blocked(step, "Circuit breaker: trading velocity exceeded", "circuitBreaker.velocityLimit", "critical", "circuit_breaker", 0.0)
                blocked_count += 1
                results.append({**step_result, "status": "blocked", "blocked_by": "circuit_breaker", "confidence": 0.0, "reason": "CIRCUIT BREAKER: Trading frozen due to velocity breach", "rule": "circuitBreaker.velocityLimit", "enforcement_timeline": enforcement_timeline, "score_breakdown": {}, "expert_breakdown": []})
                continue

            # ── Layer 1: Policy Engine (deterministic) ────────────────────────
            t_start = time.perf_counter()
            policy_result = self.policy_engine.enforce(step["tool"], step.get("args", {}))
            t_elapsed = round((time.perf_counter() - t_start) * 1000, 1)
            enforcement_timeline.append({
                "layer": "PolicyEngine",
                "allowed": policy_result["allowed"],
                "reason": policy_result["reason"],
                "rule": policy_result.get("rule"),
                "time_ms": t_elapsed,
            })

            if not policy_result["allowed"]:
                await audit.log_step_blocked(
                    step, policy_result["reason"], policy_result["rule"],
                    policy_result["severity"], "policy", 0.0,
                )
                blocked_count += 1
                results.append({
                    **step_result,
                    "status": "blocked", "blocked_by": "policy",
                    "confidence": 0.0, "reason": policy_result["reason"],
                    "rule": policy_result["rule"], "severity": policy_result["severity"],
                    "enforcement_timeline": enforcement_timeline,
                    "score_breakdown": {"policy_cons": 0.0, "armoriq_proof": 0.0, "alignment": 0.5},
                    "expert_breakdown": [],
                })
                continue

            # ── Layer 2: MoE Gatekeeper (parallel expert panel) ───────────────
            t_start = time.perf_counter()
            mk_result = await self.gatekeeper.evaluate(step["tool"], step.get("args", {}), {"plan": plan})
            t_elapsed = round((time.perf_counter() - t_start) * 1000, 1)
            enforcement_timeline.append({
                "layer": "MoE Gatekeeper",
                "allowed": not mk_result["hard_veto"],
                "consensus": mk_result["consensus"],
                "experts": mk_result.get("experts_consulted", []),
                "reason": mk_result.get("veto_reason") if mk_result["hard_veto"] else f"Consensus {mk_result['consensus']:.0%}",
                "time_ms": t_elapsed,
            })

            # ── Layer 3: Merkle Proof (cryptographic) ─────────────────────────
            t_start = time.perf_counter()
            armoriq_result = await self.intent_validator.verify_step(token_id, step)
            t_elapsed = round((time.perf_counter() - t_start) * 1000, 1)
            enforcement_timeline.append({
                "layer": "Merkle Proof",
                "allowed": armoriq_result["verified"],
                "reason": armoriq_result["reason"],
                "source": armoriq_result.get("source"),
                "merkle_proof": armoriq_result.get("merkle_proof"),
                "time_ms": t_elapsed,
            })

            # ── Layer 4: Validator (ConfidenceScore) ──────────────────────────
            t_start = time.perf_counter()
            score_entry = await self.validator.score(step, mk_result, armoriq_result)
            score = score_entry["score"]
            t_elapsed = round((time.perf_counter() - t_start) * 1000, 1)
            enforcement_timeline.append({
                "layer": "ConfidenceScore",
                "allowed": not (mk_result["hard_veto"] or score < threshold),
                "score": score,
                "threshold": threshold,
                "breakdown": score_entry["breakdown"],
                "time_ms": t_elapsed,
            })

            total_time = round((time.perf_counter() - t0) * 1000, 1)

            # ── Block: hard veto OR low confidence ────────────────────────────
            if mk_result["hard_veto"] or score < threshold:
                if mk_result["hard_veto"]:
                    reason = f"Expert veto by {mk_result['veto_expert']}: {mk_result['veto_reason']}"
                    rule = mk_result["veto_rule"] or "gatekeeper.hardVeto"
                    blocked_by = "gatekeeper"
                    # DEFCON escalation on fraud detection
                    if "fraud" in str(mk_result.get("veto_expert", "")).lower():
                        new_level = check_defcon_escalation()
                        reason += f" [DEFCON {new_level}]"
                elif not armoriq_result["verified"]:
                    reason = f"Merkle verification failed + low confidence ({score*100:.0f}% < {threshold*100:.0f}%)"
                    rule = armoriq_result.get("reason", "iap.verificationFailed")
                    blocked_by = "iap"
                else:
                    reason = f"ConfidenceScore {score*100:.0f}% below threshold {threshold*100:.0f}%"
                    rule = "validator.confidenceThreshold"
                    blocked_by = "validator"

                await audit.log_step_blocked(
                    step, reason, rule, "high", blocked_by, score, mk_result.get("breakdown"),
                )
                blocked_count += 1
                results.append({
                    **step_result,
                    "status": "blocked", "blocked_by": blocked_by,
                    "confidence": score, "reason": reason, "rule": rule,
                    "enforcement_timeline": enforcement_timeline,
                    "total_enforcement_ms": total_time,
                    "score_breakdown": score_entry["breakdown"],
                    "expert_breakdown": mk_result.get("breakdown", []),
                })
                continue

            # ── All layers passed → execute ───────────────────────────────────
            await audit.log_step_allowed(step, policy_result, armoriq_result, score, mk_result.get("breakdown"))

            try:
                result = await execute_tool(step["tool"], step.get("args", {}))
                await audit.log_step_executed(step, result, score)
                # Record trade for circuit breaker velocity tracking
                if step["tool"] in TRADING_TOOLS:
                    tripped = record_trade()
                    if tripped:
                        enforcement_timeline.append({"layer": "CircuitBreaker", "allowed": False, "reason": "TRIPPED after this trade — future trades frozen", "time_ms": 0.0})
                # Tool Poisoning Detection: check if tool tried to sneak in hidden actions
                poisoning_detected = False
                if isinstance(result, dict) and "_hidden_action" in result:
                    ha = result["_hidden_action"]
                    enforcement_timeline.append({
                        "layer": "PoisonDetector",
                        "allowed": False,
                        "reason": f"TOOL POISONING INTERCEPTED: '{step['tool']}' attempted hidden '{ha.get('attempted_tool')}' -- {ha.get('attack_vector', '')}",
                        "time_ms": 0.0,
                    })
                    poisoning_detected = True
                    await audit.log_step_blocked(
                        {"tool": ha.get("attempted_tool"), "args": ha.get("attempted_args", {})},
                        f"Tool poisoning: {step['tool']} attempted hidden {ha.get('attempted_tool')}",
                        "poisonDetector.hiddenAction", "critical", "poison_detector", 0.0,
                    )

                allowed_count += 1
                results.append({
                    **step_result,
                    "status": "executed", "result": result,
                    "confidence": score,
                    "enforcement_timeline": enforcement_timeline,
                    "total_enforcement_ms": total_time,
                    "score_breakdown": score_entry["breakdown"],
                    "expert_breakdown": mk_result.get("breakdown", []),
                    "poisoning_detected": poisoning_detected,
                })
            except Exception as err:
                await audit.log_step_error(step, str(err))
                error_count += 1
                results.append({
                    **step_result,
                    "status": "error", "error": str(err),
                    "confidence": score,
                    "enforcement_timeline": enforcement_timeline,
                    "total_enforcement_ms": total_time,
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
            "token_info":      token_info,
            "merkle_root":     token.get("merkle_root"),
            "crypto":          token.get("crypto"),
            "threshold":       threshold,
            "avg_confidence":  round(avg_confidence, 3),
            "delegation_id":   delegation_id,
            "results":         results,
            "stats": {
                "allowed": allowed_count,
                "blocked": blocked_count,
                "errors":  error_count,
                "total":   len(plan.get("steps", [])),
            },
            "drift_log":       drift_log,
            "defcon":          get_defcon_status(),
            "run_id":          audit.RUN_ID,
        }
