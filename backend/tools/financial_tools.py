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


def _has_alpaca_keys() -> bool:
    return bool(os.environ.get("ALPACA_API_KEY", "").strip())


def _alpaca_headers() -> dict:
    return {
        "APCA-API-KEY-ID":     os.environ.get("ALPACA_API_KEY", ""),
        "APCA-API-SECRET-KEY": os.environ.get("ALPACA_SECRET_KEY", ""),
        "Content-Type":        "application/json",
    }


# ── Mock data for when Alpaca keys are missing ──────────────────────────────
import random
from datetime import datetime, timezone

_MOCK_PRICES = {
    "AAPL": 227.48, "MSFT": 456.72, "GOOGL": 178.34, "AMZN": 203.15,
    "TSLA": 268.93, "NVDA": 950.42, "META": 585.67, "JPM": 217.89,
    "V": 305.12, "BRK.B": 462.55,
}

def _mock_quote(symbol: str) -> dict:
    base = _MOCK_PRICES.get(symbol.upper(), 150.00)
    spread = base * 0.001
    return {
        "symbol": symbol.upper(),
        "askPrice": round(base + spread, 2),
        "bidPrice": round(base - spread, 2),
        "askSize": random.randint(100, 500),
        "bidSize": random.randint(100, 500),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "_source": "mock",
    }


# ── Tool implementations ──────────────────────────────────────────────────────

async def get_quote(symbol: str) -> dict:
    if not _has_alpaca_keys():
        return _mock_quote(symbol)
    url = f"{DATA_BASE}/v2/stocks/{symbol}/quotes/latest"
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers=_alpaca_headers(), params=_QUOTE_PARAMS, timeout=10)
        if res.status_code == 401:
            return await _get_latest_trade(symbol)
        if res.status_code != 200:
            return _mock_quote(symbol)
        q = res.json().get("quote", {})
        return {
            "symbol": symbol, "askPrice": q.get("ap"), "bidPrice": q.get("bp"),
            "askSize": q.get("as"), "bidSize": q.get("bs"), "timestamp": q.get("t"),
        }
    except Exception:
        return _mock_quote(symbol)


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
    if not _has_alpaca_keys():
        return {"buyingPower": "250000.00", "cash": "250000.00", "portfolioValue": "250000.00", "currency": "USD", "status": "ACTIVE", "tradingBlocked": False, "_source": "mock"}
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{ALPACA_BASE}/v2/account", headers=_alpaca_headers(), timeout=10)
        if res.status_code != 200:
            return {"buyingPower": "250000.00", "cash": "250000.00", "portfolioValue": "250000.00", "currency": "USD", "status": "ACTIVE", "tradingBlocked": False, "_source": "mock"}
        d = res.json()
        return {"buyingPower": d.get("buying_power"), "cash": d.get("cash"), "portfolioValue": d.get("portfolio_value"), "currency": d.get("currency"), "status": d.get("status"), "tradingBlocked": d.get("trading_blocked")}
    except Exception:
        return {"buyingPower": "250000.00", "cash": "250000.00", "portfolioValue": "250000.00", "currency": "USD", "status": "ACTIVE", "tradingBlocked": False, "_source": "mock"}


async def get_positions() -> list:
    if not _has_alpaca_keys():
        return [
            {"symbol": "AAPL", "qty": "25", "side": "long", "marketValue": "5687.00", "avgEntryPrice": "215.30", "unrealizedPL": "304.50", "unrealizedPLPct": "0.0565", "_source": "mock"},
            {"symbol": "MSFT", "qty": "15", "side": "long", "marketValue": "6850.80", "avgEntryPrice": "440.00", "unrealizedPL": "250.80", "unrealizedPLPct": "0.0380", "_source": "mock"},
        ]
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{ALPACA_BASE}/v2/positions", headers=_alpaca_headers(), timeout=10)
        if res.status_code != 200:
            return []
        return [
            {"symbol": p.get("symbol"), "qty": p.get("qty"), "side": p.get("side"), "marketValue": p.get("market_value"), "avgEntryPrice": p.get("avg_entry_price"), "unrealizedPL": p.get("unrealized_pl"), "unrealizedPLPct": p.get("unrealized_plpc")}
            for p in res.json()
        ]
    except Exception:
        return []


async def get_orders(status: str = "all", limit: int = 10) -> list:
    if not _has_alpaca_keys():
        return [{"id": "mock-001", "symbol": "AAPL", "qty": "10", "side": "buy", "type": "market", "status": "filled", "filledAt": datetime.now(timezone.utc).isoformat(), "filledAvgPrice": "227.48", "_source": "mock"}]
    try:
        url = f"{ALPACA_BASE}/v2/orders?status={status}&limit={limit}"
        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers=_alpaca_headers(), timeout=10)
        if res.status_code != 200:
            return []
        return [
            {"id": o.get("id"), "symbol": o.get("symbol"), "qty": o.get("qty"), "side": o.get("side"), "type": o.get("type"), "status": o.get("status"), "filledAt": o.get("filled_at"), "filledAvgPrice": o.get("filled_avg_price")}
            for o in res.json()
        ]
    except Exception:
        return []


async def place_order(symbol: str, qty: int, side: str,
                      order_type: str = "market", time_in_force: str = "day",
                      limit_price: float = None) -> dict:
    if not _has_alpaca_keys():
        price = _MOCK_PRICES.get(symbol.upper(), 150.00)
        return {"orderId": f"mock-{random.randint(10000,99999)}", "symbol": symbol.upper(), "qty": str(qty), "side": side, "type": order_type, "status": "accepted", "submittedAt": datetime.now(timezone.utc).isoformat(), "estimatedValue": round(price * int(qty), 2), "_source": "mock"}
    body: dict = {"symbol": symbol, "qty": str(qty), "side": side, "type": order_type, "time_in_force": time_in_force}
    if order_type == "limit" and limit_price is not None:
        body["limit_price"] = str(limit_price)
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{ALPACA_BASE}/v2/orders", headers=_alpaca_headers(), json=body, timeout=10)
    if res.status_code not in (200, 201):
        raise RuntimeError(f"Alpaca order error: {res.status_code} {res.text}")
    o = res.json()
    return {"orderId": o.get("id"), "symbol": o.get("symbol"), "qty": o.get("qty"), "side": o.get("side"), "type": o.get("type"), "status": o.get("status"), "submittedAt": o.get("submitted_at")}


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


from backend.tools.universal_finance import (
    process_wire_transfer, analyze_cheque_image, analyze_vendor_invoice,
    issue_corporate_card, verify_kyc_document, detect_money_laundering,
    lock_compromised_funds, process_crypto_swap, request_loan_approval,
    audit_transaction_anomalies, sanctions_screening,
    cross_border_payment, compliance_onboarding,
    circuit_breaker_status, scan_pii_leaks,
    record_trade, is_circuit_broken, check_defcon_escalation, get_defcon_status,
)

# ── Tool registry ─────────────────────────────────────────────────────────────

TOOLS: dict[str, Any] = {
    "get_quote":            get_quote,
    "get_account":          get_account,
    "get_positions":        get_positions,
    "get_orders":           get_orders,
    "place_order":          place_order,
    "cancel_order":         cancel_order,
    "export_portfolio_data": export_portfolio_data,
    
    "process_wire_transfer": process_wire_transfer,
    "analyze_cheque_image": analyze_cheque_image,
    "analyze_vendor_invoice": analyze_vendor_invoice,
    "issue_corporate_card": issue_corporate_card,
    "verify_kyc_document": verify_kyc_document,
    "detect_money_laundering": detect_money_laundering,
    "lock_compromised_funds": lock_compromised_funds,
    "process_crypto_swap": process_crypto_swap,
    "request_loan_approval": request_loan_approval,
    "audit_transaction_anomalies": audit_transaction_anomalies,
    "sanctions_screening": sanctions_screening,
    "cross_border_payment": cross_border_payment,
    "compliance_onboarding": compliance_onboarding,
    "circuit_breaker_status": circuit_breaker_status,
    "scan_pii_leaks": scan_pii_leaks,
}


def get_tool_names() -> list[str]:
    return list(TOOLS.keys())


async def execute_tool(tool_name: str, args: dict) -> Any:
    fn = TOOLS.get(tool_name)
    if fn is None:
        raise RuntimeError(f"Unknown tool: {tool_name}")
    return await fn(**args)
