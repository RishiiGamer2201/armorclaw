# backend/moe/experts/temporal_expert.py
# Temporal Expert — validates time-based constraints (daily trade limits, time_in_force, etc.)

from datetime import datetime, timezone


class TemporalExpert:
    name   = "TemporalExpert"
    domain = "temporal"

    def __init__(self, policy: dict) -> None:
        self.policy    = policy
        self._session_trade_count = 0

    def enforce(self, tool: str, args: dict, context: dict = None) -> dict:
        t = self.policy.get("trading", {})

        if tool == "place_order":
            # time_in_force validation
            tif         = args.get("time_in_force", "day")
            allowed_tif = t.get("allowedTimeInForce", ["day", "gtc"])
            if tif not in allowed_tif:
                return self._block(
                    f"time_in_force '{tif}' not allowed. Allowed: {allowed_tif}",
                    "trading.allowedTimeInForce",
                )

            # Session trade count (soft limit check — hard limit in PolicyEngine)
            max_daily = t.get("maxDailyTrades", 5)
            if self._session_trade_count >= max_daily:
                return self._block(
                    f"Session trade limit ({max_daily}) reached",
                    "trading.maxDailyTrades",
                )

            self._session_trade_count += 1

        if tool == "cancel_order":
            # Cancellations are time-unrestricted — always pass
            return self._allow("Cancel order has no temporal constraints")

        return self._allow("Temporal checks passed")

    def _allow(self, reason: str) -> dict:
        return {"allowed": True, "reason": reason, "hardVeto": False, "abstained": False, "confidence": 1.0}

    def _block(self, reason: str, rule: str) -> dict:
        return {"allowed": False, "reason": reason, "rule": rule, "hardVeto": False, "abstained": False, "confidence": 0.3}
