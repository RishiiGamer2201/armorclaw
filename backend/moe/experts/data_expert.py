# backend/moe/experts/data_expert.py
# Data Expert — enforces data classification and exfiltration prevention policies.


class DataExpert:
    name   = "DataExpert"
    domain = "data"

    def __init__(self, policy: dict) -> None:
        self.policy = policy

    def enforce(self, tool: str, args: dict, context: dict = None) -> dict:
        d = self.policy.get("data", {})

        if tool == "export_portfolio_data":
            dest = args.get("destination", "")
            allowed_dests = d.get("allowedExportDestinations", ["local"])

            if dest not in allowed_dests:
                blocked_hosts = d.get("blockedExternalHosts", ["*"])
                classification = d.get("portfolioDataClassification", "confidential")
                return self._veto(
                    f"Destination '{dest}' is not in allowed exports: {allowed_dests}. "
                    f"Data classified as '{classification}'. Blocked hosts: {blocked_hosts}.",
                    "data.allowedExportDestinations",
                )

        if tool == "external_request":
            return self._veto(
                "External HTTP requests are not permitted — all data must stay within allowed endpoints",
                "data.blockedExternalHosts",
            )

        if tool in ("transfer_funds", "get_account_activities"):
            classification = d.get("portfolioDataClassification", "confidential")
            if classification in ("confidential", "PCI", "PAYMENT"):
                return self._veto(
                    f"Tool '{tool}' accesses {classification} data and is blocked by data policy",
                    "data.portfolioDataClassification",
                )

        return self._allow("Data policy check passed")

    def _allow(self, reason: str) -> dict:
        return {"allowed": True, "reason": reason, "hardVeto": False, "abstained": False, "confidence": 1.0}

    def _veto(self, reason: str, rule: str) -> dict:
        return {"allowed": False, "reason": reason, "rule": rule, "hardVeto": True, "abstained": False, "confidence": 0.0}
