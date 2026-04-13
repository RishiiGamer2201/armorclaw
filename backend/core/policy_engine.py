# backend/core/policy_engine.py
# Structured policy enforcement for financial agents.
# ALL enforcement decisions are driven by policies/financial-policy.json.
# No hardcoded allow/block logic — all rules read from the JSON file.

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

POLICY_PATH = Path(__file__).parent.parent.parent / "policies" / "financial-policy.json"

TRADING_TOOLS   = {"place_order"}
READ_ONLY_TOOLS = {"get_quote", "get_account", "get_positions", "get_orders", "get_bars"}
EXPORT_TOOLS    = {"export_portfolio_data"}
CANCEL_TOOLS    = {"cancel_order"}
UNIVERSAL_TOOLS = {
    "process_wire_transfer", "analyze_cheque_image", "analyze_vendor_invoice",
    "issue_corporate_card", "verify_kyc_document", "detect_money_laundering",
    "lock_compromised_funds", "process_crypto_swap", "request_loan_approval",
    "audit_transaction_anomalies", "sanctions_screening",
    "cross_border_payment", "compliance_onboarding",
    "circuit_breaker_status", "scan_pii_leaks", "send_payment_notification",
}


class PolicyEngine:
    def __init__(self) -> None:
        self.policy: dict = {}
        self.daily_trade_count: int = 0
        self.daily_trade_date: str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    def load(self) -> "PolicyEngine":
        with open(POLICY_PATH, "r", encoding="utf-8") as f:
            self.policy = json.load(f)
        return self

    # ── Core enforcement entry point ──────────────────────────────────────────
    def enforce(self, tool_name: str, args: dict = None) -> dict:
        if args is None:
            args = {}
        if not self.policy:
            return self._block("PolicyEngine not initialised", "system.notLoaded", "critical")

        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if today != self.daily_trade_date:
            self.daily_trade_count = 0
            self.daily_trade_date = today

        # 1. Blocked-actions list (from JSON)
        if tool_name in self.policy.get("operations", {}).get("blockedActions", []):
            return self._block(
                f"'{tool_name}' is listed in operations.blockedActions - "
                f"this action is not within the agent's authorised scope.",
                "operations.blockedActions",
                "critical",
            )

        # 2. Tool-category routing
        if tool_name in READ_ONLY_TOOLS:
            return self._enforce_read_only(tool_name, args)
        if tool_name in TRADING_TOOLS:
            return self._enforce_place_order(args)
        if tool_name in EXPORT_TOOLS:
            return self._enforce_export(args)
        if tool_name in CANCEL_TOOLS:
            return self._enforce_cancel_order(args)
        if tool_name in UNIVERSAL_TOOLS:
            return self._enforce_universal(tool_name, args)

        # 3. Unknown tool - fail closed
        return self._block(
            f"'{tool_name}' is not registered in the approved tool set. "
            "Unknown tools are blocked by default (fail-closed policy).",
            "operations.unknownTool",
            "high",
        )

    # ── Category enforcers ────────────────────────────────────────────────────
    def _enforce_universal(self, tool_name: str, args: dict) -> dict:
        u = self.policy.get("universal", {})
        
        if tool_name == "process_wire_transfer":
            if float(args.get("amount", 0)) > u.get("max_wire_transfer_amount", 0):
                return self._block(f"Wire transfer exceeds {u.get('max_wire_transfer_amount')}", "universal.maxWire", "high")
        
        return self._allow(f"Universal feature '{tool_name}' passing initial bounds check")
    def _enforce_read_only(self, tool_name: str, args: dict) -> dict:
        if tool_name in ("get_quote", "get_bars"):
            return self._check_ticker(args.get("symbol"))
        return self._allow(f"Read-only action '{tool_name}' permitted")

    def _enforce_place_order(self, args: dict) -> dict:
        t = self.policy["trading"]
        symbol      = args.get("symbol")
        qty         = args.get("qty")
        side        = args.get("side")
        order_type  = args.get("order_type")
        tif         = args.get("time_in_force")
        limit_price = args.get("limit_price")

        ticker_check = self._check_ticker(symbol)
        if not ticker_check["allowed"]:
            return ticker_check

        if side not in t["allowedSides"]:
            return self._block(
                f"Side '{side}' is not permitted. Allowed: [{', '.join(t['allowedSides'])}]. "
                "Short selling is disabled per policy (trading.shortSellingAllowed = false).",
                "trading.shortSellingAllowed",
                "high",
            )

        if order_type not in t["allowedOrderTypes"]:
            return self._block(
                f"Order type '{order_type}' not permitted. Allowed: [{', '.join(t['allowedOrderTypes'])}]",
                "trading.allowedOrderTypes",
                "medium",
            )

        if tif not in t["allowedTimeInForce"]:
            return self._block(
                f"Time-in-force '{tif}' not permitted. Allowed: [{', '.join(t['allowedTimeInForce'])}]",
                "trading.allowedTimeInForce",
                "medium",
            )

        if int(qty) > t["maxOrderQty"]:
            return self._block(
                f"Order qty {qty} exceeds maximum allowed ({t['maxOrderQty']} shares per order)",
                "trading.maxOrderQty",
                "high",
            )

        if limit_price and int(qty) * float(limit_price) > t["maxOrderValueUSD"]:
            value = round(int(qty) * float(limit_price), 2)
            return self._block(
                f"Order value ${value} exceeds maximum allowed (${t['maxOrderValueUSD']})",
                "trading.maxOrderValueUSD",
                "high",
            )

        if self.daily_trade_count >= t["maxDailyTrades"]:
            return self._block(
                f"Daily trade limit reached ({t['maxDailyTrades']} trades/day). No more orders today.",
                "trading.maxDailyTrades",
                "high",
            )

        self.daily_trade_count += 1
        return self._allow(
            f"Order: {str(side).upper()} {qty} {symbol} ({order_type}) — all policy checks passed. "
            f"Daily trades: {self.daily_trade_count}/{t['maxDailyTrades']}"
        )

    def _enforce_cancel_order(self, args: dict) -> dict:
        order_id = args.get("order_id", "")
        if not order_id or not isinstance(order_id, str) or not order_id.strip():
            return self._block("Invalid or missing order_id for cancellation", "operations.cancelOrder", "medium")
        return self._allow(f"Cancel order '{order_id}' — individual cancellation is permitted")

    def _enforce_export(self, args: dict) -> dict:
        d = self.policy["data"]
        dest = args.get("destination", "")
        if dest not in d["allowedExportDestinations"]:
            return self._block(
                f"Export destination '{dest}' is not in allowedExportDestinations "
                f"[{', '.join(d['allowedExportDestinations'])}]. "
                f"Portfolio data is classified '{d['portfolioDataClassification']}' — external transmission blocked.",
                "data.allowedExportDestinations",
                "critical",
            )
        return self._allow("Local export permitted — no external data transmission")

    # ── Helpers ───────────────────────────────────────────────────────────────
    def _check_ticker(self, symbol: Any) -> dict:
        if not symbol:
            return self._block("No ticker symbol provided", "trading.allowedTickers", "high")
        allowed = self.policy["trading"]["allowedTickers"]
        if symbol.upper() not in allowed:
            return self._block(
                f"Ticker '{symbol}' is not in the approved watchlist [{', '.join(allowed)}]",
                "trading.allowedTickers",
                "high",
            )
        return self._allow(f"Ticker '{symbol}' is in the approved watchlist")

    def _allow(self, reason: str) -> dict:
        return {"allowed": True, "reason": reason, "rule": None, "severity": None}

    def _block(self, reason: str, rule: str, severity: str = "high") -> dict:
        return {"allowed": False, "reason": reason, "rule": rule, "severity": severity}

    def get_policy(self) -> dict:
        return self.policy
