# backend/moe/experts/fraud_expert.py
# Fraud Expert — detects prompt injection, unusual patterns, and suspicious arguments.

import re


INJECTION_PATTERNS = [
    r"ignore.{0,20}(previous|above|prior|system|instruction)",
    r"(system prompt|jailbreak|```|</s>|<\|im_end\|>|<\|endofprompt\|>)",
    r"(override|bypass|disable|circumvent).{0,20}(policy|enforcement|guard|filter)",
    r"(drop|delete|truncate|alter)\s+(table|database|collection)",
    r"eval\s*\(",
    r"\$\{.*?\}",
    r"<script",
]


class FraudExpert:
    name   = "FraudExpert"
    domain = "fraud"

    def __init__(self, policy: dict) -> None:
        self.policy = policy

    def enforce(self, tool: str, args: dict, context: dict = None) -> dict:
        args_str = str(args).lower()

        for pattern in INJECTION_PATTERNS:
            if re.search(pattern, args_str, re.I):
                return self._veto(
                    f"Prompt injection / adversarial pattern detected in tool arguments: {pattern}",
                    "fraud.injectionDetected",
                )

        # Unusual destination checks
        if tool == "export_portfolio_data":
            dest = str(args.get("destination", ""))
            if dest and dest not in ("local", "localhost", "127.0.0.1"):
                # This will also be caught by policy engine; fraud expert adds a vote
                return self._block(
                    f"Suspicious external export destination: '{dest}'",
                    "fraud.externalExfil",
                )

        # Flags unrealistically large orders as potentially adversarial
        if tool == "place_order":
            try:
                qty = int(args.get("qty", 0))
                if qty > 1000:
                    return self._block(
                        f"Unrealistically large order qty {qty} — possible adversarial input",
                        "fraud.anomalousQty",
                    )
            except (ValueError, TypeError):
                return self._veto("Non-numeric qty — possible injection", "fraud.malformedArgs")

        return self._allow("No fraud signals detected")

    def _allow(self, reason: str) -> dict:
        return {"allowed": True, "reason": reason, "hardVeto": False, "abstained": False, "confidence": 1.0}

    def _block(self, reason: str, rule: str) -> dict:
        return {"allowed": False, "reason": reason, "rule": rule, "hardVeto": False, "abstained": False, "confidence": 0.2}

    def _veto(self, reason: str, rule: str) -> dict:
        return {"allowed": False, "reason": reason, "rule": rule, "hardVeto": True, "abstained": False, "confidence": 0.0}
