---
name: clawshield
description: ClawShield Finance — intent-aware financial agent with Merkle-tree IAP enforcement, MoE gatekeeper, and bounded delegation. Routes financial requests through 4-layer policy gating. Use this for any financial query, order, audit, or delegation request.
user-invocable: true
metadata: { "openclaw": { "emoji": "🦞", "homepage": "http://localhost:8000/docs", "always": true } }
---

# ClawShield Finance Skill

You are connected to the **ClawShield Finance** enforcement backend running at `http://localhost:8000`.

## What ClawShield Does

ClawShield Finance is a zero-trust execution gateway for autonomous financial agents that:
1. **Plans** a tool execution sequence via Gemini 2.5 Flash LLM
2. **Signs** the plan into a SHA256 Merkle tree and issues a cryptographic intent token
3. **Gates** every step through 4 independent enforcement layers:
   - PolicyEngine — deterministic JSON-driven rules
   - MoE Gatekeeper — 5 expert agents (Compliance, Risk, Fraud, Data, Temporal) vote
   - Merkle Proof — cryptographic verification that step matches approved plan
   - ConfidenceScore — weighted formula (40% consensus + 35% crypto proof + 25% intent alignment)
4. **Executes** only steps that pass ALL 4 layers
5. **Delegates** bounded authority to sub-agents with scope-limited tool access

## Slash Commands

- `/shield <prompt>` — Run any prompt through ClawShield enforcement
- `/delegate <scope> <prompt>` — Run as a delegated sub-agent with bounded authority
  - Scopes: `read_only`, `trade_limited`, `compliance_audit`, `payment_processor`
- `/demo <scenario>` — Run a preset demo scenario
- `/audit` — Fetch recent audit log entries
- `/scenarios` — List all demo scenarios

## How to Use This Skill

When a user sends a **financial request**:
1. POST their message to `http://localhost:8000/api/agent/run` with body `{"prompt": "<user message>"}`
2. Format the response using the Response Format below
3. Reply with the formatted result

When a user uses `/delegate <scope> <prompt>`:
1. Extract the scope (first word after /delegate) and prompt (rest)
2. POST to `http://localhost:8000/api/agent/delegate` with body `{"prompt": "<prompt>", "scope": "<scope>"}`
3. Format and return — include delegation info showing what tools were allowed vs blocked

When a user uses `/demo <scenario>`:
- POST to `http://localhost:8000/api/agent/demo/<scenario>`

When a user uses `/audit`:
- GET `http://localhost:8000/api/audit/logs?limit=5`

## Response Format

Format all ClawShield API responses like this (Telegram-friendly markdown):

```
🦞 *ClawShield Finance*
━━━━━━━━━━━━━━━━━━━━

📋 *Intent:* <intent from response>
🔑 *Token:* `<token_id>` (<token_source>)
🌳 *Merkle Root:* `<merkle_root first 16 chars>...`

*Enforcement Timeline:*
<for each step in results:>
  `Step <N>: <tool>`
  Status: <✅ EXECUTED | 🚫 BLOCKED | ⚠️ ERROR>
  Confidence: `<confidence>%`
  <for each layer in enforcement_timeline:>
    <✅|🚫> <layer.layer>: <layer.reason> (<layer.time_ms>ms)
  <if blocked: Rule: `<rule>`>

📊 *Summary:*
  ✅ Allowed: `<stats.allowed>`
  🚫 Blocked: `<stats.blocked>`
  ⚠️ Errors: `<stats.errors>`

<if delegation info present:>
🔒 *Delegation:* <scope_id> — <label>
  Allowed Tools: [<list>]
  Actions Taken: <count> | Blocked: <count>
```

## Trigger Words

Automatically use this skill when the user mentions:
- Stock prices, quotes, market data, trading
- Buying, selling, placing orders
- Portfolio, positions, holdings
- Any stock ticker (AAPL, MSFT, TSLA, etc.)
- Wire transfers, payments, invoices
- KYC, AML, compliance, sanctions
- Audit logs, enforcement, policy
- Delegation, sub-agent, bounded authority
- ClawShield, ArmorIQ, MoE, intent enforcement

## Error Handling

If the backend is unreachable (connection refused on port 8000):
Reply: "⚠️ ClawShield Finance backend is offline. Start it with: `python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000` from the project root."
