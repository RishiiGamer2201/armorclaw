---
name: clawshield
description: ClawShield Finance — intent-aware financial agent with MoE enforcement. Routes financial requests through policy gating, ArmorIQ IAP, and Alpaca paper trading. Use this for any financial query, order, or audit request.
user-invocable: true
metadata: { "openclaw": { "emoji": "🦞", "homepage": "http://localhost:8000/docs", "always": true } }
---

# ClawShield Finance Skill

You are connected to the **ClawShield Finance** enforcement backend running at `http://localhost:8000`.

## What ClawShield Does

ClawShield Finance is an intent-aware autonomous financial agent that:
1. **Plans** a tool execution sequence (get_quote, place_order, get_positions, etc.)
2. **Gates** every step through the MoE Gatekeeper (5 expert agents: Compliance, Risk, Fraud, Data, Temporal)
3. **Enforces** policy rules (allowed tickers, max quantities, blocked operations)
4. **Validates** via ArmorIQ IAP (Intent Authorization Protocol) — cryptographic intent enforcement
5. **Executes** only steps that pass all gates

## Slash Commands

- `/shield <prompt>` — Run any prompt through ClawShield enforcement
- `/demo <scenario>` — Run a preset demo scenario
- `/audit` — Fetch recent audit log entries
- `/scenarios` — List all demo scenarios

## How to Use This Skill

When a user sends a **financial request** (anything about stocks, prices, orders, portfolio, etc.):

1. POST their message to `http://localhost:8000/api/agent/run` with body `{"prompt": "<user message>"}`
2. Format the response as shown in the **Response Format** section below
3. Reply with the formatted result

When a user uses `/shield <prompt>`:
- Extract the prompt after `/shield` and run it through step 1-3 above

When a user uses `/demo <scenario>`:
- POST to `http://localhost:8000/api/agent/demo/<scenario>`
- Format and return the result

When a user uses `/audit`:
- GET `http://localhost:8000/api/audit/logs?limit=5`
- Format and return the last 5 audit entries

When a user uses `/scenarios`:
- GET `http://localhost:8000/api/agent/demo/scenarios`
- List the available demo scenarios

## Response Format

Format all ClawShield API responses like this (use Telegram-friendly markdown):

```
🦞 *ClawShield Finance*
━━━━━━━━━━━━━━━━━━━━

📋 *Intent:* <intent from response>
🔑 *Token:* <token_source>

*Enforcement Timeline:*
<for each step in results:>
  `Step <N>: <tool>`
  Status: <✅ ALLOWED | 🚫 BLOCKED | ⚠️ ERROR>
  Confidence: <confidence>%
  <if blocked: Rule: <rule>>
  <if error: Error: <error message>>
  MoE: <comma-separated expert names that voted>

📊 *Summary:*
  ✅ Allowed: <stats.allowed>
  🚫 Blocked: <stats.blocked>
  ⚠️ Errors: <stats.errors>
  📝 Total: <stats.total>
```

## Trigger Words

Automatically use this skill (without needing `/shield`) when the user says anything about:
- Stock prices, quotes, market data
- Buying, selling, placing orders
- Portfolio, positions, holdings
- GME, AAPL, MSFT, TSLA, NVDA, or any stock ticker
- Audit logs, enforcement history
- ClawShield, ArmorIQ, MoE, policy enforcement

## Error Handling

If the backend is unreachable (connection refused on port 8000):
Reply: "⚠️ ClawShield Finance backend is offline. Start it with: `python -m uvicorn backend.main:app --reload` from the `claw-shield-finance/` directory."

If the backend returns a non-200 status:
Show the status code and error message from the response.
