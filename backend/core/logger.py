# backend/core/logger.py
# Writes structured ArmorIQ-format audit records to disk (JSONL).

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

import aiofiles

LOG_DIR = Path(__file__).parent.parent.parent / "logs"
RUN_ID = str(uuid.uuid4())


def _log_file() -> Path:
    date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return LOG_DIR / f"clawshield-finance-{date}.log"


async def _write(record: dict) -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    async with aiofiles.open(_log_file(), mode="a", encoding="utf-8") as f:
        await f.write(json.dumps(record) + "\n")


async def log_plan_created(plan: dict, token_id: str, armoriq_source: str) -> None:
    await _write({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "runId": RUN_ID,
        "event": "PLAN_CREATED",
        "agentId": "claw-shield-finance-agent",
        "intent": plan.get("intent"),
        "riskLevel": plan.get("risk_level"),
        "tokenId": token_id,
        "armoriqSource": armoriq_source,
        "steps": [{"stepId": s.get("step_id"), "tool": s.get("tool")} for s in plan.get("steps", [])],
    })


async def log_step_allowed(step: dict, policy_result: dict, armoriq_result: dict, confidence: float, breakdown: list) -> None:
    await _write({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "runId": RUN_ID,
        "event": "STEP_ALLOWED",
        "agentId": "claw-shield-finance-agent",
        "tool": step.get("tool"),
        "args": step.get("args"),
        "mcp": "alpaca-mcp",
        "action": "allowed",
        "reason": policy_result.get("reason"),
        "confidenceScore": confidence,
        "armoriq": {"verified": armoriq_result.get("verified"), "source": armoriq_result.get("source")},
        "expertVotes": [
            {"expert": e.get("expert"), "allowed": e.get("allowed"), "confidence": e.get("confidence")}
            for e in (breakdown or []) if not e.get("abstained")
        ],
        "proofPath": f"/steps/{step.get('step_id', 1) - 1}/action",
    })


async def log_step_blocked(step: dict, reason: str, rule: str, severity: str,
                           blocked_by: str, confidence: float, breakdown: list = None) -> None:
    await _write({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "runId": RUN_ID,
        "event": "STEP_BLOCKED",
        "agentId": "claw-shield-finance-agent",
        "tool": step.get("tool"),
        "args": step.get("args"),
        "mcp": "alpaca-mcp",
        "action": "blocked",
        "blockedBy": blocked_by,
        "rule": rule,
        "severity": severity,
        "reason": reason,
        "confidenceScore": confidence,
        "expertVotes": [
            {"expert": e.get("expert"), "allowed": e.get("allowed"), "confidence": e.get("confidence")}
            for e in (breakdown or []) if not e.get("abstained")
        ],
        "proofPath": f"/steps/{step.get('step_id', 1) - 1}/action",
    })


async def log_step_executed(step: dict, result: dict, confidence: float) -> None:
    await _write({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "runId": RUN_ID,
        "event": "STEP_EXECUTED",
        "agentId": "claw-shield-finance-agent",
        "tool": step.get("tool"),
        "args": step.get("args"),
        "result": result,
        "confidenceScore": confidence,
    })


async def log_step_error(step: dict, error: str) -> None:
    await _write({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "runId": RUN_ID,
        "event": "STEP_ERROR",
        "agentId": "claw-shield-finance-agent",
        "tool": step.get("tool"),
        "args": step.get("args"),
        "reason": error,
    })


async def log_summary(plan: dict, allowed: int, blocked: int, errors: int) -> None:
    await _write({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "runId": RUN_ID,
        "event": "EXECUTION_SUMMARY",
        "agentId": "claw-shield-finance-agent",
        "intent": plan.get("intent"),
        "total": len(plan.get("steps", [])),
        "allowed": allowed,
        "blocked": blocked,
        "errors": errors,
    })
