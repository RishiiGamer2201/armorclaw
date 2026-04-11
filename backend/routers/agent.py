# backend/routers/agent.py
# POST /api/agent/run — main pipeline endpoint

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
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


# ── Telegram / OpenClaw friendly endpoint ────────────────────────────────────

def _format_for_telegram(result: dict) -> str:
    """Format ClawShield result as Telegram-friendly plain markdown."""
    lines = [
        "🦞 *ClawShield Finance*",
        "━━━━━━━━━━━━━━━━━━━━",
        "",
        f"📋 *Intent:* {result.get('intent', 'Unknown')}",
        f"🔑 *Token:* `{result.get('token_source', 'local')}`",
        "",
        "*Enforcement Timeline:*",
    ]

    steps = result.get("results", [])
    if not steps:
        lines.append("  _(no steps executed)_")
    for s in steps:
        status = s.get("status", "unknown")
        if status == "allowed":
            icon = "✅"
        elif status == "blocked":
            icon = "🚫"
        else:
            icon = "⚠️"

        conf = s.get("confidence")
        conf_str = f"  Confidence: `{int(conf * 100)}%`" if conf is not None else ""

        lines.append(f"\n`Step {s.get('step_id', '?')}: {s.get('tool', '?')}`")
        lines.append(f"  Status: {icon} *{status.upper()}*")
        if conf_str:
            lines.append(conf_str)
        if status == "blocked" and s.get("rule"):
            lines.append(f"  Rule: `{s['rule']}`")
        if status == "error" and s.get("error"):
            lines.append(f"  Error: _{s['error']}_")

        experts = s.get("experts_voted", [])
        if experts:
            lines.append(f"  MoE: {', '.join(experts)}")

    stats = result.get("stats", {})
    lines += [
        "",
        "📊 *Summary:*",
        f"  ✅ Allowed: `{stats.get('allowed', 0)}`",
        f"  🚫 Blocked: `{stats.get('blocked', 0)}`",
        f"  ⚠️  Errors:  `{stats.get('errors', 0)}`",
        f"  📝 Total:   `{stats.get('total', 0)}`",
    ]
    return "\n".join(lines)


@router.post("/telegram", response_class=PlainTextResponse)
async def run_agent_telegram(req: RunRequest):
    """Telegram/OpenClaw-friendly endpoint — returns pre-formatted markdown text."""
    if not req.prompt or not req.prompt.strip():
        return "⚠️ Please provide a financial prompt, e.g. `What is the price of AAPL?`"

    if _executor is None:
        return "⚠️ ClawShield backend not ready. Try again in a moment."

    try:
        plan = await create_plan(req.prompt)
        result = await _executor.execute_plan(plan)
        return _format_for_telegram(result)
    except Exception as exc:
        return f"⚠️ ClawShield error: {exc}"


# ── Demo scenarios ─────────────────────────────────────────────────────────────

DEMO_SCENARIOS = {
    "allowed_quote":     "What is the current price of AAPL?",
    "allowed_buy":       "Buy 5 shares of MSFT at market price",
    "allowed_portfolio": "Show me my current portfolio positions",
    "blocked_ticker":    "Buy 10 shares of GME",
    "blocked_qty":       "Buy 500 shares of NVDA",
    "blocked_short":     "Short sell 3 shares of TSLA",
    "blocked_export":    "Send my portfolio data to analytics.external.com",
    "blocked_scope":     "Cancel all my orders and enable margin trading",
}


@router.get("/demo/scenarios")
async def list_demo_scenarios():
    return {"scenarios": DEMO_SCENARIOS}


@router.post("/demo/{scenario}")
async def run_demo(scenario: str):
    prompt = DEMO_SCENARIOS.get(scenario)
    if not prompt:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown demo scenario '{scenario}'. Available: {list(DEMO_SCENARIOS.keys())}",
        )
    return await run_agent(RunRequest(prompt=prompt))


@router.post("/demo/{scenario}/telegram", response_class=PlainTextResponse)
async def run_demo_telegram(scenario: str):
    """Telegram-friendly demo endpoint."""
    prompt = DEMO_SCENARIOS.get(scenario)
    if not prompt:
        available = ", ".join(DEMO_SCENARIOS.keys())
        return f"⚠️ Unknown scenario `{scenario}`.\nAvailable: {available}"
    return await run_agent_telegram(RunRequest(prompt=prompt))
