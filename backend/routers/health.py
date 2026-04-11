# backend/routers/health.py

import httpx
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok", "service": "claw-shield-finance"}


@router.get("/api/status")
async def system_status():
    """Live status of all connected services — polled by the React dashboard."""
    status = {
        "backend":  {"ok": True,  "label": "FastAPI Backend"},
        "openclaw": {"ok": False, "label": "OpenClaw Gateway"},
        "alpaca":   {"ok": False, "label": "Alpaca Paper API"},
    }

    # Check OpenClaw gateway on :18789
    try:
        async with httpx.AsyncClient(timeout=2) as client:
            r = await client.get("http://127.0.0.1:18789/")
            status["openclaw"]["ok"] = r.status_code < 500
    except Exception:
        pass

    # Check Alpaca paper API reachability
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get("https://paper-api.alpaca.markets/v2/clock")
            status["alpaca"]["ok"] = r.status_code in (200, 401, 403)
    except Exception:
        pass

    return status
