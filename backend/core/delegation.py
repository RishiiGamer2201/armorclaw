# backend/core/delegation.py
# Agent Delegation with Bounded Authority
#
# Allows a parent agent to create sub-agents with restricted tool access.
# The delegation token is a subset of the parent's authority — a child can
# NEVER exceed what the parent was authorized to do.
#
# Delegation chain: User → Parent Agent (full scope) → Child Agent (restricted)
#
# Example: Parent authorized for [get_quote, place_order, get_positions]
#          Child delegated for [get_quote, get_positions] only
#          Child attempts place_order → BLOCKED by delegation scope

import time
import uuid
from typing import Optional

# ── Predefined delegation scopes ─────────────────────────────────────────────

DELEGATION_SCOPES = {
    "read_only": {
        "label": "Read-Only Research",
        "description": "Can only read market data and account info. Cannot execute trades or modify state.",
        "allowed_tools": [
            "get_quote", "get_account", "get_positions", "get_orders",
            "audit_transaction_anomalies", "detect_money_laundering",
            "financial_health_score", "expense_categorization",
        ],
        "max_risk_level": "low",
        "can_delegate": False,
    },
    "trade_limited": {
        "label": "Limited Trading",
        "description": "Can research and place small orders. Cannot cancel, export, or modify account settings.",
        "allowed_tools": [
            "get_quote", "get_account", "get_positions", "get_orders",
            "place_order",
        ],
        "max_risk_level": "medium",
        "max_order_qty": 10,
        "can_delegate": False,
    },
    "compliance_audit": {
        "label": "Compliance Auditor",
        "description": "Can run AML checks, sanctions screening, and transaction audits. Cannot trade or transfer.",
        "allowed_tools": [
            "detect_money_laundering", "sanctions_screening",
            "audit_transaction_anomalies", "get_positions", "get_orders",
        ],
        "max_risk_level": "medium",
        "can_delegate": False,
    },
    "payment_processor": {
        "label": "Payment Processor",
        "description": "Can process wire transfers and verify invoices. Cannot trade stocks or freeze accounts.",
        "allowed_tools": [
            "process_wire_transfer", "analyze_vendor_invoice",
            "issue_corporate_card", "get_account",
        ],
        "max_risk_level": "high",
        "max_wire_amount": 5000.0,
        "can_delegate": False,
    },
}


class DelegationManager:
    def __init__(self) -> None:
        # delegation_id → delegation record
        self._delegations: dict[str, dict] = {}

    def create_delegation(
        self,
        parent_token_id: str,
        scope_id: str,
        purpose: str = "",
    ) -> dict:
        """Create a bounded delegation token for a child agent."""
        scope = DELEGATION_SCOPES.get(scope_id)
        if not scope:
            return {
                "error": f"Unknown delegation scope '{scope_id}'. "
                         f"Available: {list(DELEGATION_SCOPES.keys())}",
            }

        delegation_id = f"del-{uuid.uuid4().hex[:10]}"
        now = time.time()

        record = {
            "delegation_id": delegation_id,
            "parent_token_id": parent_token_id,
            "scope_id": scope_id,
            "scope": scope,
            "purpose": purpose,
            "created_at": now,
            "expires_at": now + 300,  # 5 minute delegation window
            "actions_taken": 0,
            "actions_blocked": 0,
            "audit": [],
        }
        self._delegations[delegation_id] = record

        return {
            "delegation_id": delegation_id,
            "scope_id": scope_id,
            "label": scope["label"],
            "description": scope["description"],
            "allowed_tools": scope["allowed_tools"],
            "max_risk_level": scope["max_risk_level"],
            "expires_in": 300,
            "can_delegate": scope["can_delegate"],
        }

    def enforce_delegation(self, delegation_id: str, tool: str, args: dict) -> dict:
        """Check if a tool call is within the delegation scope.
        Returns {allowed, reason, rule} similar to PolicyEngine.
        """
        record = self._delegations.get(delegation_id)
        if not record:
            return {
                "allowed": False,
                "reason": f"Delegation '{delegation_id}' not found or revoked",
                "rule": "delegation.notFound",
                "severity": "critical",
            }

        # Check expiry
        if time.time() > record["expires_at"]:
            return {
                "allowed": False,
                "reason": "Delegation token expired. Sub-agent authority revoked.",
                "rule": "delegation.expired",
                "severity": "high",
            }

        scope = record["scope"]

        # Check tool allowlist
        if tool not in scope["allowed_tools"]:
            record["actions_blocked"] += 1
            record["audit"].append({
                "tool": tool,
                "action": "blocked",
                "reason": f"Tool '{tool}' not in delegation scope",
                "timestamp": time.time(),
            })
            return {
                "allowed": False,
                "reason": (
                    f"DELEGATION VIOLATION: Sub-agent attempted '{tool}' but delegation "
                    f"scope '{record['scope_id']}' only allows: "
                    f"[{', '.join(scope['allowed_tools'])}]"
                ),
                "rule": "delegation.scopeViolation",
                "severity": "high",
            }

        # Check scope-specific limits
        if tool == "place_order" and "max_order_qty" in scope:
            qty = int(args.get("qty", 0))
            if qty > scope["max_order_qty"]:
                record["actions_blocked"] += 1
                return {
                    "allowed": False,
                    "reason": (
                        f"DELEGATION LIMIT: Order qty {qty} exceeds delegation max "
                        f"({scope['max_order_qty']} shares for scope '{record['scope_id']}')"
                    ),
                    "rule": "delegation.qtyLimit",
                    "severity": "high",
                }

        if tool == "process_wire_transfer" and "max_wire_amount" in scope:
            amount = float(args.get("amount", 0))
            if amount > scope["max_wire_amount"]:
                record["actions_blocked"] += 1
                return {
                    "allowed": False,
                    "reason": (
                        f"DELEGATION LIMIT: Wire amount ${amount:,.2f} exceeds delegation max "
                        f"(${scope['max_wire_amount']:,.2f} for scope '{record['scope_id']}')"
                    ),
                    "rule": "delegation.wireLimit",
                    "severity": "high",
                }

        # Allowed
        record["actions_taken"] += 1
        record["audit"].append({
            "tool": tool,
            "action": "allowed",
            "timestamp": time.time(),
        })
        return {
            "allowed": True,
            "reason": f"Action '{tool}' permitted under delegation scope '{record['scope_id']}'",
            "rule": None,
            "severity": None,
        }

    def get_delegation_info(self, delegation_id: str) -> Optional[dict]:
        record = self._delegations.get(delegation_id)
        if not record:
            return None
        return {
            "delegation_id": record["delegation_id"],
            "scope_id": record["scope_id"],
            "label": record["scope"]["label"],
            "allowed_tools": record["scope"]["allowed_tools"],
            "actions_taken": record["actions_taken"],
            "actions_blocked": record["actions_blocked"],
            "remaining_seconds": max(0, record["expires_at"] - time.time()),
            "audit": record["audit"][-10:],  # last 10 actions
        }

    def list_scopes(self) -> dict:
        return {
            scope_id: {
                "label": scope["label"],
                "description": scope["description"],
                "allowed_tools": scope["allowed_tools"],
                "max_risk_level": scope["max_risk_level"],
            }
            for scope_id, scope in DELEGATION_SCOPES.items()
        }
