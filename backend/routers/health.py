# backend/routers/health.py

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok", "service": "claw-shield-finance"}
