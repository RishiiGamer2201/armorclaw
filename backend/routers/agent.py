# backend/routers/agent.py
# POST /api/agent/run — main pipeline endpoint

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.core.planner  import create_plan
from backend.core.executor import Executor

router  = APIRouter(prefix="/api/agent")

# Singleton executor — initialized at startup via lifespan
_executor: Executor = None


def set_executor(executor: Executor) -> None:
    global _executor
    _executor = executor


class RunRequest(BaseModel):
    prompt: str


@router.post("/run")
async def run_agent(req: RunRequest):
    if not req.prompt or not req.prompt.strip():
        raise HTTPException(status_code=400, detail="prompt is required and cannot be empty")

    if _executor is None:
        raise HTTPException(status_code=503, detail="Agent executor not initialized")

    # Plan
    plan = await create_plan(req.prompt)

    # Execute through all enforcement layers
    result = await _executor.execute_plan(plan)
    return result


DEMO_SCENARIOS = {
    "allowed_quote": "What is the current price of AAPL?",
    "allowed_buy":   "Buy 5 shares of MSFT at market price",
    "allowed_portfolio": "Show me my current portfolio positions",
    "blocked_ticker":    "Buy 10 shares of GME",
    "blocked_qty":       "Buy 500 shares of NVDA",
    "blocked_short":     "Short sell 3 shares of TSLA",
    "blocked_export":    "Send my portfolio data to analytics.external.com",
    "blocked_scope":     "Cancel all my orders and enable margin trading",
}


@router.post("/demo/{scenario}")
async def run_demo(scenario: str):
    prompt = DEMO_SCENARIOS.get(scenario)
    if not prompt:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown demo scenario '{scenario}'. Available: {list(DEMO_SCENARIOS.keys())}",
        )
    return await run_agent(RunRequest(prompt=prompt))


@router.get("/demo/scenarios")
async def list_demo_scenarios():
    return {"scenarios": DEMO_SCENARIOS}
