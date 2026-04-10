# backend/tools/financial_tools.py
# Alpaca Paper Trading API integration.
# All calls go to paper-api.alpaca.markets — NO real money ever transacted.

import os
from typing import Any

import httpx

ALPACA_BASE = "https://paper-api.alpaca.markets"
DATA_BASE   = "https://data.alpaca.markets"

# Free IEX feed — works with all Alpaca accounts (paper + live free tier).
# iex = consolidated real-time feed from IEX exchange, no subscription needed.
_QUOTE_PARAMS = {"feed": "iex", "currency": "USD"}


def _alpaca_headers() -> dict:
    return {
        "APCA-API-KEY-ID":     os.environ.get("ALPACA_API_KEY", ""),
        "APCA-API-SECRET-KEY": os.environ.get("ALPACA_SECRET_KEY", ""),
        "Content-Type":        "application/json",
    }


# ── Tool implementations ──────────────────────────────────────────────────────

async def get_quote(symbol: str) -> dict:
    url = f"{DATA_BASE}/v2/stocks/{symbol}/quotes/latest"
    async with httpx.AsyncClient() as client:
        res = await client.get(
            url,
            headers=_alpaca_headers(),
            params=_QUOTE_PARAMS,
            timeout=10,
        )
    if res.status_code == 401:
        # IEX also not authorised — fall back to latest trade price instead
        return await _get_latest_trade(symbol)
    if res.status_code != 200:
        raise RuntimeError(f"Alpaca quote error: {res.status_code} {res.text}")
    q = res.json().get("quote", {})
    return {
        "symbol":     symbol,
        "askPrice":   q.get("ap"),
        "bidPrice":   q.get("bp"),
        "askSize":    q.get("as"),
        "bidSize":    q.get("bs"),
        "timestamp":  q.get("t"),
    }


async def _get_latest_trade(symbol: str) -> dict:
    """Fallback: fetch latest trade price (broader API access than quotes)."""
    url = f"{DATA_BASE}/v2/stocks/{symbol}/trades/latest"
    async with httpx.AsyncClient() as client:
        res = await client.get(
            url,
            headers=_alpaca_headers(),
            params=_QUOTE_PARAMS,
            timeout=10,
        )
    if res.status_code != 200:
        raise RuntimeError(f"Alpaca quote error: {res.status_code} {res.text}")
    t = res.json().get("trade", {})
    price = t.get("p")  # trade price
    return {
        "symbol":     symbol,
        "askPrice":   price,
        "bidPrice":   price,
        "askSize":    t.get("s"),
        "bidSize":    t.get("s"),
        "timestamp":  t.get("t"),
    }


async def get_account() -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{ALPACA_BASE}/v2/account", headers=_alpaca_headers(), timeout=10)
    if res.status_code != 200:
        raise RuntimeError(f"Alpaca account error: {res.status_code}")
    d = res.json()
    return {
        "buyingPower":    d.get("buying_power"),
        "cash":           d.get("cash"),
        "portfolioValue": d.get("portfolio_value"),
        "currency":       d.get("currency"),
        "status":         d.get("status"),
        "tradingBlocked": d.get("trading_blocked"),
    }


async def get_positions() -> list:
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{ALPACA_BASE}/v2/positions", headers=_alpaca_headers(), timeout=10)
    if res.status_code != 200:
        raise RuntimeError(f"Alpaca positions error: {res.status_code}")
    return [
        {
            "symbol":          p.get("symbol"),
            "qty":             p.get("qty"),
            "side":            p.get("side"),
            "marketValue":     p.get("market_value"),
            "avgEntryPrice":   p.get("avg_entry_price"),
            "unrealizedPL":    p.get("unrealized_pl"),
            "unrealizedPLPct": p.get("unrealized_plpc"),
        }
        for p in res.json()
    ]


async def get_orders(status: str = "all", limit: int = 10) -> list:
    url = f"{ALPACA_BASE}/v2/orders?status={status}&limit={limit}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url, headers=_alpaca_headers(), timeout=10)
    if res.status_code != 200:
        raise RuntimeError(f"Alpaca orders error: {res.status_code}")
    return [
        {
            "id":              o.get("id"),
            "symbol":          o.get("symbol"),
            "qty":             o.get("qty"),
            "side":            o.get("side"),
            "type":            o.get("type"),
            "status":          o.get("status"),
            "filledAt":        o.get("filled_at"),
            "filledAvgPrice":  o.get("filled_avg_price"),
        }
        for o in res.json()
    ]


async def place_order(symbol: str, qty: int, side: str,
                      order_type: str = "market", time_in_force: str = "day",
                      limit_price: float = None) -> dict:
    body: dict = {
        "symbol": symbol,
        "qty": str(qty),
        "side": side,
        "type": order_type,
        "time_in_force": time_in_force,
    }
    if order_type == "limit" and limit_price is not None:
        body["limit_price"] = str(limit_price)

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{ALPACA_BASE}/v2/orders",
            headers=_alpaca_headers(),
            json=body,
            timeout=10,
        )
    if res.status_code not in (200, 201):
        raise RuntimeError(f"Alpaca order error: {res.status_code} {res.text}")
    o = res.json()
    return {
        "orderId":     o.get("id"),
        "symbol":      o.get("symbol"),
        "qty":         o.get("qty"),
        "side":        o.get("side"),
        "type":        o.get("type"),
        "status":      o.get("status"),
        "submittedAt": o.get("submitted_at"),
    }


async def cancel_order(order_id: str) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.delete(
            f"{ALPACA_BASE}/v2/orders/{order_id}",
            headers=_alpaca_headers(),
            timeout=10,
        )
    if res.status_code == 204:
        return {"cancelled": True, "orderId": order_id}
    if res.status_code != 200:
        raise RuntimeError(f"Alpaca cancel error: {res.status_code}")
    return {"cancelled": True, "orderId": order_id}


async def export_portfolio_data(destination: str, format: str = "json") -> dict:
    """Policy engine will block external destinations before this runs."""
    import json as _json
    from datetime import datetime, timezone
    from pathlib import Path

    positions = await get_positions()
    account   = await get_account()
    snapshot  = {
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "account":    account,
        "positions":  positions,
    }

    if destination == "local":
        import aiofiles
        log_dir = Path(__file__).parent.parent.parent / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        from datetime import datetime as _dt
        filename = log_dir / f"portfolio-export-{int(_dt.now().timestamp() * 1000)}.{format}"
        async with aiofiles.open(filename, "w", encoding="utf-8") as f:
            await f.write(_json.dumps(snapshot, indent=2))
        return {"success": True, "file": str(filename), "recordCount": len(positions)}

    raise RuntimeError("POLICY_VIOLATION: External export not permitted")


# ── Tool registry ─────────────────────────────────────────────────────────────

TOOLS: dict[str, Any] = {
    "get_quote":            get_quote,
    "get_account":          get_account,
    "get_positions":        get_positions,
    "get_orders":           get_orders,
    "place_order":          place_order,
    "cancel_order":         cancel_order,
    "export_portfolio_data": export_portfolio_data,
}


def get_tool_names() -> list[str]:
    return list(TOOLS.keys())


async def execute_tool(tool_name: str, args: dict) -> Any:
    fn = TOOLS.get(tool_name)
    if fn is None:
        raise RuntimeError(f"Unknown tool: {tool_name}")
    return await fn(**args)
