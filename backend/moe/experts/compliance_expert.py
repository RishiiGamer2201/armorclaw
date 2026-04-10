# backend/moe/experts/compliance_expert.py
# Compliance Expert — checks against policy trading allowlists and blocked operations.


class ComplianceExpert:
    name   = "ComplianceExpert"
    domain = "compliance"

    def __init__(self, policy: dict) -> None:
        self.policy = policy

    def enforce(self, tool: str, args: dict, context: dict = None) -> dict:
        t   = self.policy.get("trading", {})
        ops = self.policy.get("operations", {})

        # Blocked operations list
        if tool in ops.get("blockedActions", []):
            return self._veto(
                f"'{tool}' is in the blocked operations list",
                "operations.blockedActions",
            )

        # Trading-specific checks for place_order
        if tool == "place_order":
            symbol = args.get("symbol", "")
            if symbol.upper() not in t.get("allowedTickers", []):
                return self._veto(
                    f"Ticker '{symbol}' is not in the approved watchlist",
                    "trading.allowedTickers",
                )
            side = args.get("side", "")
            if side not in t.get("allowedSides", []):
                return self._veto(
                    f"Side '{side}' violates short-selling policy",
                    "trading.shortSellingAllowed",
                )
            qty = int(args.get("qty", 0))
            if qty > t.get("maxOrderQty", 10):
                return self._veto(
                    f"Quantity {qty} exceeds max order qty ({t.get('maxOrderQty', 10)})",
                    "trading.maxOrderQty",
                )

        return self._allow("Compliance check passed")

    def _allow(self, reason: str) -> dict:
        return {"allowed": True, "reason": reason, "hardVeto": False, "abstained": False, "confidence": 1.0}

    def _veto(self, reason: str, rule: str) -> dict:
        return {"allowed": False, "reason": reason, "rule": rule, "hardVeto": True, "abstained": False, "confidence": 0.0}
