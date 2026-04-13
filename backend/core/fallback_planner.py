# backend/core/fallback_planner.py
# Keyword-based rule planner — no API key needed.
# Used automatically when Gemini quota is exhausted or key is missing.

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


def _extract_dollar(text: str) -> float:
    m = re.search(r"\$\s*([\d,]+(?:\.\d+)?)", text)
    if m:
        return float(m.group(1).replace(",", ""))
    m = re.search(r"([\d,]+(?:\.\d+)?)\s*(?:dollars?|usd)", text, re.I)
    if m:
        return float(m.group(1).replace(",", ""))
    m = re.search(r"(?:of|for|amount|transfer|wire|swap|limit)\s+\$?([\d,]+(?:\.\d+)?)", text, re.I)
    if m:
        return float(m.group(1).replace(",", ""))
    return 0.0


def _extract_account_id(text: str) -> str:
    m = re.search(r"(?:account|acct)\s+([\w-]+)", text, re.I)
    return m.group(1) if m else "MAIN-001"


def _extract_email(text: str) -> str:
    m = re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", text)
    return m.group(0) if m else "employee@company.com"


def _extract_url(text: str) -> str:
    m = re.search(r"https?://[^\s]+", text)
    return m.group(0) if m else ""


def _extract_iban(text: str) -> str:
    m = re.search(r"(?:IBAN\s+)?([A-Z]{2}\d{2}[A-Z0-9]{4,30})", text)
    return m.group(1) if m else "DE89370400440532013000"


def _extract_swift(text: str) -> str:
    m = re.search(r"(?:SWIFT|BIC)\s+(?:code\s+)?([A-Z]{6}[A-Z0-9]{2,5})", text, re.I)
    return m.group(1) if m else "COBADEFFXXX"


def _extract_asset(text: str, keyword: str) -> str:
    m = re.search(rf"{keyword}\s+(\w+)", text, re.I)
    if m:
        asset = m.group(1).upper()
        if asset in ("USDC", "ETH", "BTC"):
            return asset
    for a in ("USDC", "ETH", "BTC"):
        if a in text.upper():
            return a
    return "USDC"


def create_fallback_plan(prompt: str) -> dict:
    p = prompt.lower()

    # ── Universal Finance Features (check FIRST — before legacy Alpaca patterns) ──

    # 1. Wire Transfer
    if re.search(r"wire\s*transfer|process.{0,15}wire|wire.{0,15}\$", p):
        amount = _extract_dollar(prompt)
        iban = _extract_iban(prompt)
        swift = _extract_swift(prompt)
        return {
            "intent": f"Process wire transfer of ${amount:,.2f} to {iban}",
            "risk_level": "high" if amount > 5000 else "medium",
            "steps": [{
                "step_id": 1,
                "tool": "process_wire_transfer",
                "args": {"amount": amount, "recipient_iban": iban, "swift_code": swift},
                "rationale": f"Execute wire transfer of ${amount:,.2f} to IBAN {iban}",
            }],
        }

    # 2. Cheque Fraud Scanning
    if re.search(r"cheque|check.{0,10}(fraud|scan|image|analy)", p):
        url = _extract_url(prompt) or "https://example.com/cheque.png"
        return {
            "intent": "Analyze cheque image for fraud detection",
            "risk_level": "medium",
            "steps": [{
                "step_id": 1,
                "tool": "analyze_cheque_image",
                "args": {"image_url": url},
                "rationale": "Use Gemini Vision to scan cheque for fraud markers",
            }],
        }

    # 3. Invoice Verification
    if re.search(r"invoice|vendor.{0,10}(invoice|verify|verif)", p):
        url = _extract_url(prompt) or "https://example.com/invoice.png"
        return {
            "intent": "Verify vendor invoice against approved vendor list",
            "risk_level": "medium",
            "steps": [{
                "step_id": 1,
                "tool": "analyze_vendor_invoice",
                "args": {"invoice_image_url": url},
                "rationale": "Extract vendor details from invoice and verify against approved vendors",
            }],
        }

    # 4. Corporate Card
    if re.search(r"corporate.{0,10}card|issue.{0,15}card|generate.{0,10}card", p):
        email = _extract_email(prompt)
        limit = _extract_dollar(prompt) or 1500.0
        return {
            "intent": f"Issue corporate card for {email} with ${limit:,.0f} limit",
            "risk_level": "medium",
            "steps": [{
                "step_id": 1,
                "tool": "issue_corporate_card",
                "args": {"employee_email": email, "credit_limit": limit},
                "rationale": f"Generate Luhn-valid corporate card for {email}",
            }],
        }

    # 5. KYC Document Verification
    if re.search(r"kyc|know.{0,10}customer|verify.{0,10}(id|document|passport|license|identity)", p):
        url = _extract_url(prompt) or "https://example.com/id.png"
        return {
            "intent": "Extract identity details from document for KYC compliance",
            "risk_level": "medium",
            "steps": [{
                "step_id": 1,
                "tool": "verify_kyc_document",
                "args": {"document_url": url},
                "rationale": "Use Gemini Vision to extract ID details for KYC onboarding",
            }],
        }

    # 6. AML / Money Laundering Detection
    if re.search(r"aml|money.{0,10}launder|structur|smurfing|detect.{0,15}launder", p):
        account = _extract_account_id(prompt)
        return {
            "intent": f"Scan account {account} for AML structuring patterns",
            "risk_level": "medium",
            "steps": [{
                "step_id": 1,
                "tool": "detect_money_laundering",
                "args": {"account_id": account},
                "rationale": f"Query transaction history for sub-threshold structuring on {account}",
            }],
        }

    # 7. Emergency Account Freeze
    if re.search(r"freeze|lock.{0,10}(account|fund|compromis)|emergency.{0,10}(lock|freeze|block)|kill.?switch", p):
        account = _extract_account_id(prompt)
        reason_m = re.search(r"(?:because|reason|due to)[:\s]+(.+?)(?:\.|$)", prompt, re.I)
        reason = reason_m.group(1).strip() if reason_m else "Emergency lockdown requested"
        return {
            "intent": f"Emergency freeze on account {account}",
            "risk_level": "high",
            "steps": [{
                "step_id": 1,
                "tool": "lock_compromised_funds",
                "args": {"account_id": account, "reason": reason},
                "rationale": f"Freeze account {account} to block all outgoing transactions",
            }],
        }

    # 8. Crypto Swap
    if re.search(r"crypto.{0,10}swap|swap.{0,15}(usdc|eth|btc|crypto)|convert.{0,15}(usdc|eth|btc)", p):
        amount = _extract_dollar(prompt)
        if amount == 0:
            m = re.search(r"swap\s+([\d.]+)", p)
            amount = float(m.group(1)) if m else 100.0
        # Try to find "X USDC to ETH" or "from USDC to ETH"
        from_m = re.search(r"(?:swap|convert)\s+[\d.]+\s+(\w+)\s+to\s+(\w+)", p)
        if from_m:
            from_asset = from_m.group(1).upper()
            to_asset = from_m.group(2).upper()
        else:
            from_asset = _extract_asset(prompt, "from")
            to_asset = _extract_asset(prompt, "to")
        return {
            "intent": f"Swap {amount} {from_asset} to {to_asset}",
            "risk_level": "medium",
            "steps": [{
                "step_id": 1,
                "tool": "process_crypto_swap",
                "args": {"from_asset": from_asset, "to_asset": to_asset, "amount": amount},
                "rationale": f"Execute atomic crypto swap: {amount} {from_asset} → {to_asset}",
            }],
        }

    # 9. Loan Approval
    if re.search(r"loan|credit.{0,10}(score|approv)|dti|debt.{0,5}to.{0,5}income|mortgage", p):
        amount = _extract_dollar(prompt) or 25000.0
        income_m = re.search(r"(?:income|salary|earn)\s*\$?([\d,]+(?:\.\d+)?)", prompt, re.I)
        monthly_income = float(income_m.group(1).replace(",", "")) if income_m else 8000.0
        debt_m = re.search(r"(?:debt|owe|existing.{0,5}debt)\s*\$?([\d,]+(?:\.\d+)?)", prompt, re.I)
        existing_debt = float(debt_m.group(1).replace(",", "")) if debt_m else 2000.0
        score_m = re.search(r"(?:credit.{0,5}score|score)\s*(\d{3})", prompt, re.I)
        credit_score = int(score_m.group(1)) if score_m else 720
        return {
            "intent": f"Evaluate loan approval for ${amount:,.0f} (credit score {credit_score})",
            "risk_level": "medium",
            "steps": [{
                "step_id": 1,
                "tool": "request_loan_approval",
                "args": {"amount": amount, "monthly_income": monthly_income, "existing_debt": existing_debt, "credit_score": credit_score},
                "rationale": f"Run DTI algorithm: ${amount:,.0f} loan, income ${monthly_income:,.0f}, debt ${existing_debt:,.0f}, score {credit_score}",
            }],
        }

    # 10. Transaction Anomaly Audit
    if re.search(r"audit.{0,10}(transaction|anomal|spend)|transaction.{0,10}anomal|spending.{0,10}(audit|anomal|deviation)", p):
        account = _extract_account_id(prompt)
        return {
            "intent": f"Audit transaction anomalies for account {account}",
            "risk_level": "low",
            "steps": [{
                "step_id": 1,
                "tool": "audit_transaction_anomalies",
                "args": {"account_id": account},
                "rationale": f"Scan transaction history for spending deviations on {account}",
            }],
        }

    # ── Sanctions Screening (new feature) ──
    if re.search(r"sanction|pep|politically.{0,10}exposed|ofac|watchlist|screening", p):
        name_m = re.search(r"(?:screen|check|scan|for)\s+(.+?)(?:\s+(?:against|for|in)|$)", prompt, re.I)
        name = name_m.group(1).strip() if name_m else prompt.strip()
        return {
            "intent": f"Screen '{name}' against sanctions and PEP databases",
            "risk_level": "high",
            "steps": [{
                "step_id": 1,
                "tool": "sanctions_screening",
                "args": {"entity_name": name},
                "rationale": f"Check '{name}' against OFAC, UN, EU sanctions lists and PEP databases",
            }],
        }

    # ── Circuit Breaker Status ──
    if re.search(r"circuit.{0,5}breaker|trade.{0,10}(velocity|rate|speed|limit)|trading.{0,10}(freeze|halt|pause)", p):
        return {
            "intent": "Check trade velocity circuit breaker status",
            "risk_level": "low",
            "steps": [{
                "step_id": 1,
                "tool": "circuit_breaker_status",
                "args": {},
                "rationale": "Query the circuit breaker for current trading velocity and freeze state",
            }],
        }

    # ── PII/PCI Leak Scan ──
    if re.search(r"pii|pci|data.{0,5}leak|sensitive.{0,10}data|scan.{0,10}(leak|pii|sensitive)|credit.{0,5}card.{0,5}(leak|exposed)", p):
        text = prompt
        return {
            "intent": "Scan text for PII/PCI data leaks",
            "risk_level": "medium",
            "steps": [{
                "step_id": 1,
                "tool": "scan_pii_leaks",
                "args": {"text": text},
                "rationale": "Post-processing PII/PCI scanner to prevent sensitive data leakage",
            }],
        }

    # ── Cross-Border Payment ──
    if re.search(r"cross.{0,5}border|international.{0,10}(wire|transfer|payment)|send.{0,10}(money|payment).{0,10}(to|abroad|overseas)", p):
        amount = _extract_dollar(prompt) or 1000.0
        iban = _extract_iban(prompt)
        swift = _extract_swift(prompt)
        name_m = re.search(r"(?:to|for|recipient)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)*)", prompt)
        name = name_m.group(1) if name_m else "Unknown Recipient"
        return {
            "intent": f"Process cross-border payment of ${amount:,.2f} to {name}",
            "risk_level": "high",
            "steps": [{
                "step_id": 1,
                "tool": "cross_border_payment",
                "args": {"amount": amount, "recipient_iban": iban, "recipient_name": name, "swift_code": swift},
                "rationale": f"Multi-layer compliance check + international wire: ${amount:,.2f} to {name} ({iban})",
            }],
        }

    # ── Compliance Onboarding ──
    if re.search(r"onboard|compliance.{0,10}(check|pipeline|onboard)|kyc.{0,5}aml|full.{0,10}compliance", p):
        name_m = re.search(r"(?:onboard|client|for)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)*)", prompt)
        name = name_m.group(1) if name_m else "New Client"
        url = _extract_url(prompt) or ""
        account = _extract_account_id(prompt)
        return {
            "intent": f"Run full compliance onboarding pipeline for {name}",
            "risk_level": "medium",
            "steps": [{
                "step_id": 1,
                "tool": "compliance_onboarding",
                "args": {"client_name": name, "document_url": url, "account_id": account},
                "rationale": f"4-stage compliance pipeline: KYC → AML → Sanctions → Risk Assessment for {name}",
            }],
        }

    # ── Legacy Alpaca Trading Patterns ──

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

    # Generic transfer/withdraw (blocked)
    if re.search(r"transfer.?fund|withdraw", p):
        return {
            "intent": "Attempt to transfer funds (blocked in paper trading mode)",
            "risk_level": "high",
            "steps": [{"step_id": 1, "tool": "transfer_funds", "args": {}, "rationale": "Transfer funds out of account"}],
        }

    # Export / exfiltration
    if re.search(r"export|send.*portfolio|upload.*data|exfil|share portfolio", p):
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
            "steps": [{"step_id": 1, "tool": "place_order", "args": {"symbol": symbol, "qty": qty, "side": "short_sell", "order_type": "market", "time_in_force": "day"}, "rationale": "Short sell position"}],
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

    # Sell
    if re.search(r"\bsell\b", p):
        symbol = _extract_ticker(prompt)
        qty    = _extract_qty(prompt)
        return {
            "intent": f"Sell {qty} shares of {symbol}",
            "risk_level": "medium",
            "steps": [
                {"step_id": 1, "tool": "place_order", "args": {"symbol": symbol, "qty": qty, "side": "sell", "order_type": "market", "time_in_force": "day"}, "rationale": f"Execute market sell of {qty} shares {symbol}"},
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
