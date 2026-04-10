# backend/core/intent_validator.py
# ArmorIQ IAP (Intent Authorization Protocol) integration.
# Issues cryptographic intent tokens and verifies each step against the approved plan.

import os
import random
import string
import time
from typing import Optional

import httpx

ARMORIQ_BASE = "https://api.armoriq.ai"


class IntentValidator:
    def __init__(self) -> None:
        self.api_key  = os.environ.get("ARMORIQ_API_KEY", "")
        self.user_id  = os.environ.get("ARMORIQ_USER_ID", "user-hackathon-001")
        self.agent_id = os.environ.get("ARMORIQ_AGENT_ID", "clawshield-finance-001")
        self.available = False

    async def initialize(self) -> "IntentValidator":
        try:
            async with httpx.AsyncClient(timeout=3) as client:
                res = await client.get(
                    f"{ARMORIQ_BASE}/health",
                    headers=self._headers(),
                )
            self.available = res.is_success
        except Exception:
            self.available = False
            print(
                "[WARN] ArmorIQ IAP unreachable -- running in LOCAL ENFORCEMENT ONLY mode.\n"
                "   PolicyEngine will still enforce all constraints deterministically.\n"
                "   Actions requiring dual enforcement will be BLOCKED per fail-closed policy.\n"
            )
        return self

    # ── Register plan → intent token ──────────────────────────────────────────
    async def register_plan(self, plan: dict) -> dict:
        if not self.available:
            return self._local_token(plan)

        try:
            async with httpx.AsyncClient(timeout=5) as client:
                res = await client.post(
                    f"{ARMORIQ_BASE}/v1/intent/register",
                    headers=self._headers(),
                    json={
                        "userId":    self.user_id,
                        "agentId":   self.agent_id,
                        "intent":    plan.get("intent"),
                        "riskLevel": plan.get("risk_level"),
                        "steps": [
                            {"stepId": s.get("step_id"), "tool": s.get("tool"), "args": s.get("args")}
                            for s in plan.get("steps", [])
                        ],
                        "metadata": {"mode": "paper_trading"},
                    },
                )

            if not res.is_success:
                raise RuntimeError(f"ArmorIQ register failed: {res.status_code} — {res.text}")

            data = res.json()
            return {
                "token_id":    data.get("tokenId"),
                "merkle_root": data.get("merkleRoot"),
                "expires_at":  data.get("expiresAt"),
                "source":      "armoriq",
            }
        except Exception as err:
            print(f"ArmorIQ registration error: {err}")
            return {
                "token_id": None,
                "source":   "armoriq_error",
                "error":    str(err),
                "rejected": True,
            }

    # ── Verify a single step ──────────────────────────────────────────────────
    async def verify_step(self, token_id: Optional[str], step: dict) -> dict:
        if not self.available or not token_id:
            return self._local_step_verify(step)

        try:
            async with httpx.AsyncClient(timeout=5) as client:
                res = await client.post(
                    f"{ARMORIQ_BASE}/v1/intent/verify-step",
                    headers=self._headers(),
                    json={
                        "tokenId": token_id,
                        "stepId":  step.get("step_id"),
                        "tool":    step.get("tool"),
                        "args":    step.get("args"),
                    },
                )

            if not res.is_success:
                return {
                    "verified": False,
                    "reason":   f"ArmorIQ step verification failed: {res.status_code}",
                    "source":   "armoriq",
                }

            data = res.json()
            return {
                "verified":     data.get("verified"),
                "reason":       data.get("reason", "ArmorIQ cryptographic proof valid"),
                "merkle_proof": data.get("merkleProof"),
                "source":       "armoriq",
            }
        except Exception as err:
            return {
                "verified": False,
                "reason":   f"ArmorIQ unreachable during step verification: {err}",
                "source":   "armoriq_error",
            }

    # ── Local fallback ────────────────────────────────────────────────────────
    def _local_token(self, plan: dict) -> dict:
        suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=6))
        token_id = f"local-{int(time.time())}-{suffix}"
        return {
            "token_id":    token_id,
            "merkle_root": self._simple_hash(str(plan)),
            "expires_at":  None,
            "source":      "local",
            "warning":     "ArmorIQ unavailable — local token only. Dual enforcement not active.",
        }

    def _local_step_verify(self, step: dict) -> dict:
        valid_tools = [
            "get_quote", "get_account", "get_positions", "get_orders",
            "place_order", "cancel_order", "export_portfolio_data",
        ]
        tool = step.get("tool", "")
        if tool not in valid_tools:
            return {
                "verified": False,
                "reason":   f"Unknown tool '{tool}' — not in allowed tool registry",
                "source":   "local",
            }
        return {
            "verified": True,
            "reason":   "Local structural verification passed (ArmorIQ offline)",
            "source":   "local",
            "warning":  "Cryptographic proof not available in local mode",
        }

    def _simple_hash(self, s: str) -> str:
        h = 0
        for c in s:
            h = (31 * h + ord(c)) & 0xFFFFFFFF
        return f"local-hash-{h:08x}"

    def _headers(self) -> dict:
        return {
            "Content-Type":    "application/json",
            "X-ArmorIQ-Key":   self.api_key,
            "X-ArmorIQ-Agent": self.agent_id,
        }

    def is_available(self) -> bool:
        return self.available
