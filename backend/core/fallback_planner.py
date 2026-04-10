# backend/core/fallback_planner.py
# Keyword-based rule planner — no API key needed.
# Used automatically when OpenAI quota is exhausted or key is missing.

import re

ALLOWED_TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "JPM", "V", "BRK.B"]
UNKNOWN_TICKERS = ["GME", "AMC", "BB", "NOK", "DOGE", "SHIB", "PLTR", "RIVN", "LCID", "BBBY"]


def _extract_ticker(text: str) -> str:
    upper = text.upper()
    for t in ALLOWED_TICKERS:
        if t in upper:
            return t
    for t in UNKNOWN_TICKERS:
        if t in upper:
            return t
    m = re.search(r"\b([A-Z]{1,5})\b", text)
    return m.group(1) if m else "AAPL"


def _extract_qty(text: str) -> int:
    m = (
        re.search(r"(\d+)\s*share", text, re.I) or
        re.search(r"(?:buy|purchase|sell|short)\s+(\d+)", text, re.I) or
        re.search(r"(\d+)", text)
    )
    return int(m.group(1)) if m else 1


def _extract_destination(text: str) -> str:
    url_m = re.search(r"https?://[^\s]+", text, re.I)
    if url_m:
        return url_m.group(0)
    dom_m = re.search(r"(?:to|at)\s+([\w.-]+\.(?:com|io|net|org|ai))", text, re.I)
    if dom_m:
        return f"https://{dom_m.group(1)}/ingest"
    if re.search(r"external|send|upload|post|push|export to", text, re.I):
        return "https://analytics.external-platform.com/ingest"
    return "local"


def create_fallback_plan(prompt: str) -> dict:
    p = prompt.lower()

    # Scope escalation combos
    if re.search(r"cancel all|cancel every|bulk cancel", p) and re.search(r"enable.?margin|margin.?trading", p):
        return {
            "intent": "Attempt scope escalation: cancel all orders and enable margin trading",
            "risk_level": "high",
            "steps": [
                {"step_id": 1, "tool": "cancel_all_orders", "args": {}, "rationale": "Bulk cancel all open orders"},
                {"step_id": 2, "tool": "enable_margin", "args": {"margin_enabled": True}, "rationale": "Enable margin trading mode"},
            ],
        }

    if re.search(r"cancel all|cancel every|bulk cancel", p):
        return {
            "intent": "Attempt to cancel all open orders (scope escalation)",
            "risk_level": "high",
            "steps": [{"step_id": 1, "tool": "cancel_all_orders", "args": {}, "rationale": "Bulk cancel all open orders"}],
        }

    if re.search(r"enable.?margin|margin.?trading|margin.?enabled", p):
        return {
            "intent": "Attempt to enable margin trading (privilege escalation)",
            "risk_level": "high",
            "steps": [{"step_id": 1, "tool": "enable_margin", "args": {"margin_enabled": True}, "rationale": "Enable margin trading mode"}],
        }

    if re.search(r"liquidate.?all|close.?all.?position|sell.?everything", p):
        return {
            "intent": "Attempt to liquidate all positions (scope escalation)",
            "risk_level": "high",
            "steps": [{"step_id": 1, "tool": "liquidate_all", "args": {}, "rationale": "Liquidate all open positions"}],
        }

    if re.search(r"transfer.?fund|wire.?transfer|withdraw", p):
        return {
            "intent": "Attempt to transfer funds (blocked in paper trading mode)",
            "risk_level": "high",
            "steps": [{"step_id": 1, "tool": "transfer_funds", "args": {}, "rationale": "Transfer funds out of account"}],
        }

    # Export / exfiltration
    if re.search(r"export|send|upload|exfil|transfer data|share portfolio", p):
        dest = _extract_destination(prompt)
        return {
            "intent": f"Export portfolio data to {dest}",
            "risk_level": "high",
            "steps": [
                {"step_id": 1, "tool": "get_positions", "args": {}, "rationale": "Fetch positions for export"},
                {"step_id": 2, "tool": "export_portfolio_data", "args": {"destination": dest, "format": "json"}, "rationale": f"Export portfolio to {dest}"},
            ],
        }

    # Short sell
    if re.search(r"short|short.?sell|sell.?short", p):
        symbol = _extract_ticker(prompt)
        qty    = _extract_qty(prompt)
        return {
            "intent": f"Short sell {qty} shares of {symbol}",
            "risk_level": "high",
            "steps": [{"step_id": 1, "tool": "place_order", "args": {"symbol": symbol, "qty": qty, "side": "sell", "order_type": "market", "time_in_force": "day"}, "rationale": "Short sell position"}],
        }

    # Buy
    if re.search(r"buy|purchase|acquire|long", p):
        symbol = _extract_ticker(prompt)
        qty    = _extract_qty(prompt)
        return {
            "intent": f"Buy {qty} shares of {symbol} at market price",
            "risk_level": "high" if qty > 10 else "medium",
            "steps": [
                {"step_id": 1, "tool": "get_quote", "args": {"symbol": symbol}, "rationale": "Check current price before order"},
                {"step_id": 2, "tool": "place_order", "args": {"symbol": symbol, "qty": qty, "side": "buy", "order_type": "market", "time_in_force": "day"}, "rationale": f"Execute market buy of {qty} shares {symbol}"},
            ],
        }

    # Quote
    if re.search(r"price|quote|worth|trading at|cost|how much|current.*stock", p):
        symbol = _extract_ticker(prompt)
        return {
            "intent": f"Fetch current market quote for {symbol}",
            "risk_level": "low",
            "steps": [{"step_id": 1, "tool": "get_quote", "args": {"symbol": symbol}, "rationale": "Retrieve latest bid/ask price"}],
        }

    # Portfolio
    if re.search(r"position|portfolio|holding|what do i own|my stock", p):
        return {
            "intent": "Show current portfolio positions",
            "risk_level": "low",
            "steps": [{"step_id": 1, "tool": "get_positions", "args": {}, "rationale": "Fetch open positions"}],
        }

    # Account
    if re.search(r"account|balance|buying power|cash|funds", p):
        return {
            "intent": "Retrieve account balance and buying power",
            "risk_level": "low",
            "steps": [{"step_id": 1, "tool": "get_account", "args": {}, "rationale": "Fetch account details"}],
        }

    # Order history
    if re.search(r"order history|trade history|recent trades|past order", p):
        return {
            "intent": "Retrieve recent order history",
            "risk_level": "low",
            "steps": [{"step_id": 1, "tool": "get_orders", "args": {"status": "all", "limit": 10}, "rationale": "List recent orders"}],
        }

    # Default
    return {
        "intent": "Check account status",
        "risk_level": "low",
        "steps": [{"step_id": 1, "tool": "get_account", "args": {}, "rationale": "Default: fetch account info"}],
    }
