# backend/core/validator.py
# Validation Agent — Intent Drift + ConfidenceScore
#
# ConfidenceScore = 0.40 * PolicyConsensus + 0.35 * ArmorIQProof + 0.25 * IntentAlignment
#
#   PolicyConsensus  = (allowed_experts / total_experts_consulted) — from Gatekeeper
#   ArmorIQProof     = 1.0 if cryptographically verified, 0.5 if local mode, 0.0 if failed
#   IntentAlignment  = cosine_similarity(intent_anchor_embedding, step_rationale_embedding)
#
# Embeddings: OpenAI text-embedding-3-small when available.
# Fallback: Jaccard similarity on tokenised words (deterministic, no API key needed).

import os
from typing import Optional

import httpx
import numpy as np

W1 = 0.40  # PolicyConsensus weight
W2 = 0.35  # ArmorIQProof weight
W3 = 0.25  # IntentAlignment weight

STOPWORDS = {
    "a", "an", "the", "is", "it", "in", "of", "to", "for", "at", "by", "on",
    "as", "or", "and", "get", "my", "i", "me", "we", "our", "with", "that",
    "this", "from", "be", "will", "can", "do", "its", "per", "via", "up", "let",
    "all", "not", "are", "was", "has", "have", "then", "current", "please", "just",
    "show", "give", "what", "how", "check",
}

READ_ONLY_TOOLS = {"get_quote", "get_account", "get_positions", "get_orders", "get_bars"}


async def _get_embedding(text: str, api_key: str) -> Optional[list]:
    if not api_key:
        return None
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.post(
                "https://api.openai.com/v1/embeddings",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"model": "text-embedding-3-small", "input": text},
            )
        if not res.is_success:
            return None
        data = res.json()
        return data["data"][0]["embedding"]
    except Exception:
        return None


def _cosine_similarity(a: list, b: list) -> Optional[float]:
    if not a or not b or len(a) != len(b):
        return None
    va = np.array(a, dtype=float)
    vb = np.array(b, dtype=float)
    denom = np.linalg.norm(va) * np.linalg.norm(vb)
    return float(np.dot(va, vb) / denom) if denom != 0 else 0.0


def _tokenise(text: str) -> set:
    import re
    words = re.sub(r"[^a-z0-9\s]", "", text.lower()).split()
    return {w for w in words if len(w) > 2 and w not in STOPWORDS}


def _jaccard_similarity(a: str, b: str) -> float:
    set_a = _tokenise(a)
    set_b = _tokenise(b)
    if not set_a or not set_b:
        return 0.80
    intersection = len(set_a & set_b)
    union = len(set_a | set_b)
    raw = intersection / union if union else 1.0
    return min(1.0, raw + (0.25 if intersection > 0 else 0))


class Validator:
    def __init__(self) -> None:
        self.api_key       = os.environ.get("OPENAI_API_KEY", "")
        self.threshold     = 0.70
        self.intent_anchor = None   # embedding vector or None
        self.intent_text   = None   # raw text
        self.use_embeddings = False
        self.drift_log: list = []

    async def initialize(self, policy: dict) -> "Validator":
        self.threshold = policy.get("confidenceThreshold", 0.70)
        return self

    async def set_intent_anchor(self, intent_text: str) -> None:
        self.intent_text   = intent_text
        self.intent_anchor = await _get_embedding(intent_text, self.api_key)
        self.use_embeddings = self.intent_anchor is not None
        self.drift_log = []

    async def compute_alignment(self, step_rationale: str, tool: str = "") -> float:
        if not self.intent_text:
            return 0.85

        if tool in READ_ONLY_TOOLS:
            if self.use_embeddings:
                step_emb = await _get_embedding(step_rationale, self.api_key)
                cosine = _cosine_similarity(self.intent_anchor, step_emb)
                base = cosine if cosine is not None else _jaccard_similarity(self.intent_text, step_rationale)
            else:
                base = _jaccard_similarity(self.intent_text, step_rationale)
            return max(0.85, base)

        if self.use_embeddings:
            step_emb = await _get_embedding(step_rationale, self.api_key)
            cosine = _cosine_similarity(self.intent_anchor, step_emb)
            if cosine is not None:
                return max(0.0, min(1.0, cosine))

        return _jaccard_similarity(self.intent_text, step_rationale)

    async def score(self, step: dict, gatekeeper_result: dict, armoriq_result: dict) -> dict:
        policy_cons  = gatekeeper_result.get("consensus", 1.0)
        verified     = armoriq_result.get("verified", False)
        source       = armoriq_result.get("source", "")
        armoriq_proof = 1.0 if (verified and source == "armoriq") else (0.5 if verified else 0.0)

        rationale = step.get("rationale") or step.get("tool", "")
        alignment = await self.compute_alignment(rationale, step.get("tool", ""))

        raw_score   = W1 * policy_cons + W2 * armoriq_proof + W3 * alignment
        final_score = max(0.0, min(1.0, raw_score))

        entry = {
            "step_id":   step.get("step_id"),
            "tool":      step.get("tool"),
            "score":     round(final_score, 3),
            "breakdown": {
                "policy_cons":   round(policy_cons, 3),
                "armoriq_proof": round(armoriq_proof, 3),
                "alignment":     round(alignment, 3),
            },
            "embedding_mode":  "openai" if self.use_embeddings else "jaccard-fallback",
            "below_threshold": final_score < self.threshold,
        }
        self.drift_log.append(entry)
        return entry

    def get_drift_log(self) -> list:
        return self.drift_log

    def get_threshold(self) -> float:
        return self.threshold
