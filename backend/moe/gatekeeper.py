# backend/moe/gatekeeper.py
# MoE (Mixture-of-Experts) Gatekeeper
# Routes each tool call to relevant Expert Agents, runs them concurrently,
# aggregates votes into PolicyConsensus, surfaces any hard veto.

import asyncio
import inspect

from backend.moe.experts.compliance_expert import ComplianceExpert
from backend.moe.experts.risk_expert       import RiskExpert
from backend.moe.experts.fraud_expert      import FraudExpert
from backend.moe.experts.data_expert       import DataExpert
from backend.moe.experts.temporal_expert   import TemporalExpert

# Tool → which expert domains to consult
TOOL_DOMAIN_MAP: dict[str, list[str]] = {
    "place_order":            ["compliance", "risk", "fraud", "temporal"],
    "cancel_order":           ["compliance", "temporal"],
    "get_quote":              ["compliance", "fraud"],
    "get_bars":               ["compliance"],
    "get_account":            ["fraud"],
    "get_positions":          ["fraud"],
    "get_orders":             ["fraud"],
    "export_portfolio_data":  ["data", "fraud"],
    # Blocked tools — fraud/compliance still check for injection patterns
    "cancel_all_orders":      ["compliance", "fraud"],
    "enable_margin":          ["compliance", "fraud"],
    "liquidate_all":          ["compliance", "risk", "fraud"],
    "transfer_funds":         ["compliance", "data", "fraud"],
    "external_request":       ["data", "fraud"],
    "get_account_activities": ["data", "fraud"],
    "modify_account_settings":["compliance", "fraud"],
}

DEFAULT_DOMAINS = ["fraud"]


class Gatekeeper:
    def __init__(self, policy: dict) -> None:
        self.policy  = policy
        self.experts = {
            "compliance": ComplianceExpert(policy),
            "risk":       RiskExpert(policy),
            "fraud":      FraudExpert(policy),
            "data":       DataExpert(policy),
            "temporal":   TemporalExpert(policy),
        }

    async def evaluate(self, tool: str, args: dict, session_context: dict = None) -> dict:
        domains          = TOOL_DOMAIN_MAP.get(tool, DEFAULT_DOMAINS)
        selected_experts = [self.experts[d] for d in domains if d in self.experts]

        # Run all selected experts concurrently
        async def call_expert(expert):
            result = expert.enforce(tool, args or {}, session_context or {})
            if inspect.isawaitable(result):
                result = await result
            return {**result, "expert": expert.name, "domain": expert.domain}

        results = await asyncio.gather(*[call_expert(e) for e in selected_experts])

        voters    = [r for r in results if not r.get("abstained")]
        allowed   = sum(1 for r in voters if r.get("allowed"))
        total     = len(voters) or 1
        consensus = allowed / total

        vetoed = next((r for r in results if r.get("hardVeto")), None)

        return {
            "consensus":          consensus,
            "breakdown":          list(results),
            "hard_veto":          bool(vetoed),
            "veto_reason":        vetoed["reason"] if vetoed else None,
            "veto_rule":          vetoed.get("rule") if vetoed else None,
            "veto_expert":        vetoed["expert"] if vetoed else None,
            "experts_consulted":  [e.name for e in selected_experts],
        }
