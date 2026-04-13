# backend/core/intent_validator.py
# ArmorIQ IAP (Intent Authorization Protocol) — Full Cryptographic Implementation
#
# When ArmorIQ API is reachable: uses remote verification (armoriq_proof = 1.0)
# When ArmorIQ API is unreachable: uses LOCAL Merkle-tree IAP (armoriq_proof = 0.9)
# On verification failure: armoriq_proof = 0.0 → BLOCK
#
# The local IAP implements:
#   - SHA256 Merkle Tree over plan steps
#   - HMAC-SHA256 signed intent tokens
#   - Per-step Merkle proof verification
#   - Token expiry enforcement (600s default)
#   - Intent drift detection (step not in original plan)
#   - Tamper detection (args modified after registration)

import hashlib
import hmac
import json
import math
import os
import time
import uuid
from typing import Optional

import httpx

ARMORIQ_BASE = "https://api.armoriq.ai"
TOKEN_VALIDITY_SECONDS = 600  # 10 minutes
SERVER_SECRET = os.environ.get("IAP_SECRET", "clawshield-iap-secret-2026")


# ══════════════════════════════════════════════════════════════════════════════
# MERKLE TREE IMPLEMENTATION
# ══════════════════════════════════════════════════════════════════════════════

def _sha256(data: str) -> str:
    """Compute SHA256 hex digest of a string."""
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def _step_leaf_hash(step: dict) -> str:
    """Compute the leaf hash for a single plan step.
    Leaf = SHA256(step_id || tool || canonical_json(args))
    """
    canonical = json.dumps(step.get("args", {}), sort_keys=True, separators=(",", ":"))
    payload = f"{step.get('step_id', 0)}|{step.get('tool', '')}|{canonical}"
    return _sha256(payload)


def _build_merkle_tree(leaves: list[str]) -> dict:
    """Build a complete Merkle tree from leaf hashes.
    Returns {root, layers, leaf_count} where layers[0] = leaves, layers[-1] = [root].
    """
    if not leaves:
        return {"root": _sha256("empty"), "layers": [[_sha256("empty")]], "leaf_count": 0}

    # Pad to power of 2
    n = len(leaves)
    padded = list(leaves)
    next_pow2 = 1 << (n - 1).bit_length() if n > 1 else 1
    while len(padded) < next_pow2:
        padded.append(padded[-1])  # duplicate last leaf

    layers = [padded]
    current = padded

    while len(current) > 1:
        next_layer = []
        for i in range(0, len(current), 2):
            combined = current[i] + current[i + 1]
            next_layer.append(_sha256(combined))
        layers.append(next_layer)
        current = next_layer

    return {"root": current[0], "layers": layers, "leaf_count": n}


def _get_merkle_proof(tree: dict, leaf_index: int) -> list[dict]:
    """Get the Merkle proof (sibling path) for a leaf at the given index.
    Returns a list of {hash, position} where position is 'left' or 'right'.
    """
    proof = []
    idx = leaf_index
    for layer in tree["layers"][:-1]:  # all layers except root
        sibling_idx = idx ^ 1  # flip last bit to get sibling
        if sibling_idx < len(layer):
            proof.append({
                "hash": layer[sibling_idx],
                "position": "right" if sibling_idx > idx else "left",
            })
        idx //= 2
    return proof


def _verify_merkle_proof(leaf_hash: str, proof: list[dict], root: str) -> bool:
    """Verify a Merkle proof by walking up the tree."""
    current = leaf_hash
    for node in proof:
        if node["position"] == "left":
            current = _sha256(node["hash"] + current)
        else:
            current = _sha256(current + node["hash"])
    return current == root


# ══════════════════════════════════════════════════════════════════════════════
# INTENT TOKEN
# ══════════════════════════════════════════════════════════════════════════════

def _sign_token(payload: dict) -> str:
    """HMAC-SHA256 sign a token payload."""
    data = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hmac.new(SERVER_SECRET.encode(), data.encode(), hashlib.sha256).hexdigest()


def _create_intent_token(plan: dict, merkle_root: str, tree: dict) -> dict:
    """Create a cryptographically signed intent token."""
    now = time.time()
    token_id = f"iap-{uuid.uuid4().hex[:12]}"
    intent_hash = _sha256(plan.get("intent", ""))

    payload = {
        "token_id": token_id,
        "merkle_root": merkle_root,
        "intent_hash": intent_hash,
        "user_id": os.environ.get("ARMORIQ_USER_ID", "hackathon-user"),
        "agent_id": os.environ.get("ARMORIQ_AGENT_ID", "clawshield-finance-001"),
        "steps_count": len(plan.get("steps", [])),
        "risk_level": plan.get("risk_level", "medium"),
        "created_at": now,
        "expires_at": now + TOKEN_VALIDITY_SECONDS,
    }
    signature = _sign_token(payload)

    return {
        **payload,
        "signature": signature,
        "tree": tree,
        "source": "local_iap",
    }


# ══════════════════════════════════════════════════════════════════════════════
# INTENT VALIDATOR CLASS
# ══════════════════════════════════════════════════════════════════════════════

class IntentValidator:
    def __init__(self) -> None:
        self.api_key = os.environ.get("ARMORIQ_API_KEY", "")
        self.user_id = os.environ.get("ARMORIQ_USER_ID", "user-hackathon-001")
        self.agent_id = os.environ.get("ARMORIQ_AGENT_ID", "clawshield-finance-001")
        self.available = False
        # In-memory token store (token_id → full token data)
        self._tokens: dict[str, dict] = {}

    async def initialize(self) -> "IntentValidator":
        """Check if ArmorIQ API is reachable."""
        try:
            async with httpx.AsyncClient(timeout=3) as client:
                res = await client.get(f"{ARMORIQ_BASE}/health", headers=self._headers())
            self.available = res.is_success
            if self.available:
                print("[OK] ArmorIQ IAP connected — using REMOTE cryptographic verification")
        except Exception:
            self.available = False
            print(
                "[INFO] ArmorIQ API unreachable — activating LOCAL IAP.\n"
                "   Full Merkle-tree cryptographic enforcement is active.\n"
                "   SHA256 Merkle proofs + HMAC-signed intent tokens.\n"
                "   All policy enforcement layers remain fully operational.\n"
            )
        return self

    # ── Register Plan → Intent Token ──────────────────────────────────────────
    async def register_plan(self, plan: dict) -> dict:
        # Try ArmorIQ API first
        if self.available:
            result = await self._remote_register(plan)
            if result and not result.get("rejected"):
                return result

        # Local IAP: Build Merkle tree and sign token
        steps = plan.get("steps", [])
        leaves = [_step_leaf_hash(s) for s in steps]
        tree = _build_merkle_tree(leaves)
        token = _create_intent_token(plan, tree["root"], tree)

        # Store token for later verification
        self._tokens[token["token_id"]] = {
            **token,
            "leaves": leaves,
            "steps": steps,
        }

        return {
            "token_id": token["token_id"],
            "merkle_root": tree["root"],
            "expires_at": token["expires_at"],
            "source": "local_iap",
            "signature": token["signature"],
            "crypto": {
                "algorithm": "SHA256-Merkle + HMAC-SHA256",
                "leaf_count": len(leaves),
                "tree_depth": len(tree["layers"]),
            },
        }

    # ── Verify a Single Step ──────────────────────────────────────────────────
    async def verify_step(self, token_id: Optional[str], step: dict) -> dict:
        # Try ArmorIQ API first
        if self.available and token_id:
            result = await self._remote_verify_step(token_id, step)
            if result:
                return result

        # Local IAP verification
        if not token_id or token_id not in self._tokens:
            return {
                "verified": False,
                "reason": f"Unknown token '{token_id}' — not registered in IAP",
                "source": "local_iap",
                "merkle_proof": None,
            }

        token_data = self._tokens[token_id]

        # Check token expiry
        if time.time() > token_data["expires_at"]:
            return {
                "verified": False,
                "reason": f"Intent token expired ({TOKEN_VALIDITY_SECONDS}s validity). Re-registration required.",
                "source": "local_iap",
                "merkle_proof": None,
            }

        # Verify token signature (tamper detection)
        payload = {k: token_data[k] for k in [
            "token_id", "merkle_root", "intent_hash", "user_id", "agent_id",
            "steps_count", "risk_level", "created_at", "expires_at",
        ]}
        expected_sig = _sign_token(payload)
        if token_data["signature"] != expected_sig:
            return {
                "verified": False,
                "reason": "Token signature mismatch — possible tampering detected",
                "source": "local_iap",
                "merkle_proof": None,
            }

        # Compute leaf hash for the step being verified
        step_hash = _step_leaf_hash(step)
        leaves = token_data["leaves"]
        tree = token_data["tree"]

        # Find this step's leaf in the tree
        try:
            leaf_index = leaves.index(step_hash)
        except ValueError:
            # Step hash not in the Merkle tree → INTENT DRIFT
            return {
                "verified": False,
                "reason": (
                    f"INTENT DRIFT DETECTED: Step '{step.get('tool')}' with args "
                    f"{json.dumps(step.get('args', {}), sort_keys=True)} does not match "
                    f"any step in the approved plan. Merkle leaf {step_hash[:16]}... "
                    f"not found in tree with root {tree['root'][:16]}..."
                ),
                "source": "local_iap",
                "merkle_proof": None,
                "drift": True,
            }

        # Get and verify Merkle proof
        proof = _get_merkle_proof(tree, leaf_index)
        is_valid = _verify_merkle_proof(step_hash, proof, tree["root"])

        if not is_valid:
            return {
                "verified": False,
                "reason": "Merkle proof verification failed — tree integrity compromised",
                "source": "local_iap",
                "merkle_proof": {"leaf": step_hash, "proof": proof, "root": tree["root"]},
            }

        return {
            "verified": True,
            "reason": "Cryptographic Merkle proof valid — step matches approved plan",
            "source": "local_iap",
            "merkle_proof": {
                "leaf": step_hash,
                "leaf_index": leaf_index,
                "proof": proof,
                "root": tree["root"],
                "tree_depth": len(tree["layers"]),
            },
        }

    # ── Remote ArmorIQ API calls ──────────────────────────────────────────────
    async def _remote_register(self, plan: dict) -> Optional[dict]:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                res = await client.post(
                    f"{ARMORIQ_BASE}/v1/intent/register",
                    headers=self._headers(),
                    json={
                        "userId": self.user_id,
                        "agentId": self.agent_id,
                        "intent": plan.get("intent"),
                        "riskLevel": plan.get("risk_level"),
                        "steps": [
                            {"stepId": s.get("step_id"), "tool": s.get("tool"), "args": s.get("args")}
                            for s in plan.get("steps", [])
                        ],
                        "metadata": {"mode": "paper_trading"},
                    },
                )
            if not res.is_success:
                return None
            data = res.json()
            return {
                "token_id": data.get("tokenId"),
                "merkle_root": data.get("merkleRoot"),
                "expires_at": data.get("expiresAt"),
                "source": "armoriq",
            }
        except Exception:
            return None

    async def _remote_verify_step(self, token_id: str, step: dict) -> Optional[dict]:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                res = await client.post(
                    f"{ARMORIQ_BASE}/v1/intent/verify-step",
                    headers=self._headers(),
                    json={
                        "tokenId": token_id,
                        "stepId": step.get("step_id"),
                        "tool": step.get("tool"),
                        "args": step.get("args"),
                    },
                )
            if not res.is_success:
                return None
            data = res.json()
            return {
                "verified": data.get("verified"),
                "reason": data.get("reason", "ArmorIQ cryptographic proof valid"),
                "merkle_proof": data.get("merkleProof"),
                "source": "armoriq",
            }
        except Exception:
            return None

    # ── Helpers ────────────────────────────────────────────────────────────────
    def _headers(self) -> dict:
        return {
            "Content-Type": "application/json",
            "X-ArmorIQ-Key": self.api_key,
            "X-ArmorIQ-Agent": self.agent_id,
        }

    def is_available(self) -> bool:
        return self.available

    def get_token_info(self, token_id: str) -> Optional[dict]:
        """Get token metadata for visualization."""
        t = self._tokens.get(token_id)
        if not t:
            return None
        return {
            "token_id": t["token_id"],
            "merkle_root": t["tree"]["root"],
            "signature": t["signature"][:24] + "...",
            "steps_count": t["steps_count"],
            "risk_level": t["risk_level"],
            "created_at": t["created_at"],
            "expires_at": t["expires_at"],
            "remaining_seconds": max(0, t["expires_at"] - time.time()),
            "tree_depth": len(t["tree"]["layers"]),
            "algorithm": "SHA256-Merkle + HMAC-SHA256",
        }
