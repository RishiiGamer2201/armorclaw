# backend/routers/audit.py
# GET /api/audit/logs — reads today's JSONL audit log

import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Query

router  = APIRouter(prefix="/api/audit")
LOG_DIR = Path(__file__).parent.parent.parent / "logs"


@router.get("/logs")
async def get_logs(
    date:  str = Query(default=None, description="YYYY-MM-DD (defaults to today)"),
    limit: int = Query(default=100, ge=1, le=500),
    event: str = Query(default=None, description="Filter by event type e.g. STEP_BLOCKED"),
):
    if date is None:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    log_file = LOG_DIR / f"clawshield-finance-{date}.log"
    if not log_file.exists():
        return {"date": date, "entries": [], "total": 0}

    entries = []
    with open(log_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
                if event and record.get("event") != event:
                    continue
                entries.append(record)
            except json.JSONDecodeError:
                continue

    # Most recent first, capped at limit
    entries.reverse()
    entries = entries[:limit]

    return {"date": date, "entries": entries, "total": len(entries)}


@router.get("/dates")
async def list_log_dates():
    """List all dates that have audit log files."""
    if not LOG_DIR.exists():
        return {"dates": []}
    dates = sorted(
        [f.stem.replace("clawshield-finance-", "") for f in LOG_DIR.glob("clawshield-finance-*.log")],
        reverse=True,
    )
    return {"dates": dates}
