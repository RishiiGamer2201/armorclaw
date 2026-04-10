# backend/moe/experts/risk_expert.py
# Risk Expert — evaluates order size, position concentration, and risk level of plans.


class RiskExpert:
    name   = "RiskExpert"
    domain = "risk"

    def __init__(self, policy: dict) -> None:
        self.policy = policy

    def enforce(self, tool: str, args: dict, context: dict = None) -> dict:
        t = self.policy.get("trading", {})

        if tool == "place_order":
            qty         = int(args.get("qty", 0))
            limit_price = args.get("limit_price")
            max_qty     = t.get("maxOrderQty", 10)
            max_val     = t.get("maxOrderValueUSD", 1500)

            if qty > max_qty:
                return self._block(
                    f"Order qty {qty} exceeds risk threshold ({max_qty} shares)",
                    "trading.maxOrderQty",
                )

            if limit_price:
                order_value = qty * float(limit_price)
                if order_value > max_val:
                    return self._block(
                        f"Order value ${order_value:.2f} exceeds max allowed (${max_val})",
                        "trading.maxOrderValueUSD",
                    )

        plan = (context or {}).get("plan", {})
        if plan.get("risk_level") == "high" and tool == "place_order":
            return self._warn(
                "High risk plan detected — proceeding with caution",
                confidence=0.75,
            )

        return self._allow("Risk checks passed")

    def _allow(self, reason: str) -> dict:
        return {"allowed": True, "reason": reason, "hardVeto": False, "abstained": False, "confidence": 1.0}

    def _warn(self, reason: str, confidence: float = 0.75) -> dict:
        return {"allowed": True, "reason": reason, "hardVeto": False, "abstained": False, "confidence": confidence}

    def _block(self, reason: str, rule: str) -> dict:
        return {"allowed": False, "reason": reason, "rule": rule, "hardVeto": True, "abstained": False, "confidence": 0.0}
