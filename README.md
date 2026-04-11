<div align="center">

# 🦞 ClawShield Finance

### *Cognitive Intent Enforcement for Autonomous Financial Agents*

**ArmorIQ × OpenClaw Hackathon — Apogee '26, BITS Pilani**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Integrated-FF4500?style=for-the-badge&logo=lobster&logoColor=white)](https://openclaw.ai)
[![ArmorIQ](https://img.shields.io/badge/ArmorIQ-IAP-orange?style=for-the-badge)](https://armoriq.ai)
[![License](https://img.shields.io/badge/License-MIT-lightgrey?style=for-the-badge)](LICENSE)

<br/>

> *"The future risk isn't AI that refuses to act. It's AI that acts without permission."*

**ClawShield Finance** is a real-time intent enforcement system that wraps autonomous financial agents with four independent security layers — ensuring no action ever executes without passing cryptographic intent verification, a 5-expert AI panel vote, and a semantic confidence score.

[**Live Demo**](#demo-scenarios) • [**Quick Start**](#quick-start) • [**API Docs**](http://localhost:8000/docs) • [**Architecture**](#architecture) • [**OpenClaw Integration**](#openclaw--telegram-integration)

</div>

---

## 📋 Table of Contents

- [What It Does](#what-it-does)
- [Architecture](#architecture)
- [MoE Expert Panel](#-moe-expert-panel)
- [Confidence Score Formula](#-confidence-score)
- [Demo Scenarios](#-demo-scenarios)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [OpenClaw / Telegram Integration](#-openclaw--telegram-integration)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Policy Configuration](#-policy-configuration)
- [Hackathon Judging Criteria](#-hackathon-judging-criteria)

---

## What It Does

ClawShield Finance sits **between** an LLM planner and the real financial API (Alpaca Paper Trading). Every tool call — whether a stock quote or a trade — goes through **four independent enforcement layers**:

| Layer | Component | What It Enforces |
|:---:|---|---|
| **1** | `PolicyEngine` | JSON-driven rules: ticker allowlist, qty limits, blocked operations |
| **2** | `MoE Gatekeeper` | 5 parallel expert agents vote on each action |
| **3** | `ArmorIQ IAP` | Cryptographic Merkle proof per step |
| **4** | `Validator` | `ConfidenceScore` semantic intent drift detection |

> **If any layer fails → action is blocked. Alpaca API is never called.**

---

## Architecture

\  +---------------------------+   +--------------------+   +---------------------+
  |  Telegram / Discord /     |   |  React Dashboard   |   |  Direct API / curl  |
  |  WhatsApp / Slack / etc.  |   |  localhost:5173    |   |  / smoke_test.py    |
  +---------------------------+   +--------------------+   +---------------------+
              |                           |                           |
              v                           |                           |
  +-----------------------+              |                           |
  |  OpenClaw Gateway     |              |                           |
  |  port :18789          |              |                           |
  |                       |              |                           |
  |  clawshield/SKILL.md  |              |                           |
  |  routes any financial |              |                           |
  |  prompt to ClawShield |              |                           |
  +-----------+-----------+              |                           |
              |                          |                           |
              |  POST /api/agent/        |  POST /api/agent/         |
              |  telegram                |  run                      |
              +--------------------------+---------------------------+
                                         |
                                         v
  +--------------------------------------------------------------------------+
  |             FastAPI Backend  (backend/main.py)  port :8000               |
  |   /api/agent/run  . /api/agent/telegram  . /api/audit/logs  . /health    |
  +------------------------------------------+-------------------------------+
                                             |
                                             v
  +--------------------------------------------------------------------------+
  |  [1] LLM PLANNER  (backend/core/planner.py)                              |
  |  GPT-4o-mini OR rule-based fallback (zero API dependency)                |
  |  Output: { intent, risk_level, steps[] }                                 |
  |  Warning: Never touches trading APIs. Only produces structured plans.    |
  +------------------------------------------+-------------------------------+
                                             |
                                             v
  +--------------------------------------------------------------------------+
  |  [2] ARMORIQ IAP  (core/intent_validator.py)                             |
  |  . Registers plan  -->  issues cryptographic intent token                |
  |  . Merkle proof anchored per plan step                                   |
  |  . Fail-closed: offline --> local mode  (ArmorIQProof weight = 0.5x)    |
  +------------------------------------------+-------------------------------+
                                             |
                              +--------------+--------------+
                              |    Per step (both run):     |
                              v                             v
  +-----------------------------+   +--------------------------------------------+
  |  [3] POLICY ENGINE          |   |  [4] MoE GATEKEEPER  (moe/gatekeeper.py)  |
  |  (core/policy_engine.py)    |   |                                            |
  |                             |   |  Selects experts, runs asyncio.gather()    |
  |  Deterministic JSON rules:  |   |  +--------------------------------------+  |
  |  . blockedActions           |   |  | ComplianceExpert -- ticker allowlist |  |
  |  . allowedTickers           |   |  | RiskExpert       -- qty / notional   |  |
  |  . allowedSides (buy only)  |   |  | FraudExpert      -- wash / injection |  |
  |  . maxOrderQty (10)         |   |  | DataExpert       -- export policy    |  |
  |  . maxOrderValueUSD (1500)  |   |  | TemporalExpert   -- market hours     |  |
  |  . maxDailyTrades (5)       |   |  +--------------------------------------+  |
  +-------------+---------------+   |  --> PolicyConsensus score (0.0 to 1.0)   |
                |                   +---------------------+----------------------+
                |                                         |
                +---------------------+-------------------+
                                      |
                                      v
  +--------------------------------------------------------------------------+
  |  [5] VALIDATOR  (core/validator.py)                                      |
  |                                                                          |
  |  ConfidenceScore = 0.40 x PolicyConsensus                                |
  |                 + 0.35 x ArmorIQProof                                    |
  |                 + 0.25 x IntentAlignment                                 |
  |                                                                          |
  |  IntentAlignment = cosine_sim(embed(plan.intent), embed(step.rationale)) |
  |                    Jaccard fallback when OpenAI embeddings are offline   |
  |                                                                          |
  |  Score >= 0.70  AND  no hard_veto  -->  PROCEED TO EXECUTE              |
  |  Score <  0.70   OR  hard_veto    -->  BLOCK  (logged to audit)         |
  +------------------------------------------+-------------------------------+
                                             |
                                             v
  +--------------------------------------------------------------------------+
  |  [6] TOOL EXECUTOR  (tools/financial_tools.py)                           |
  |  Alpaca Paper Trading API  . IEX free feed  . quotes, orders, positions  |
  |  Only reached when ALL 4 layers pass. Real money is never at risk.       |
  +------------------------------------------+-------------------------------+
                                             |
                          +------------------+------------------+
                          v                                     v
  +----------------------------------+    +----------------------------------+
  |  [7] AUDIT LOGGER                |    |  Response routed to caller       |
  |  (core/logger.py)                |    |                                  |
  |  Structured JSONL (ArmorIQ fmt): |    |  --> React Dashboard  (JSON)     |
  |  runId, agentId, tool,           |    |  --> OpenClaw         (markdown) |
  |  confidenceScore, expertVotes[], |    |      --> Telegram / Discord /    |
  |  proofPath, blockedBy            |    |          WhatsApp / Slack / etc. |
  |  --> logs/clawshield-YYYY-MM-    |    |  --> Direct API caller (JSON)    |
  |        DD.log (JSONL)            |    +----------------------------------+
  +----------------------------------+
\
---

## 🧠 MoE Expert Panel

Five specialized expert agents evaluate each action **in parallel** (via `asyncio.gather`):

| Expert | Module | Domain | What It Checks |
|---|---|---|---|
| **ComplianceExpert** | `compliance_expert.py` | Regulatory | Ticker allowlist, order sides, instrument types |
| **RiskExpert** | `risk_expert.py` | Risk Management | Qty limits, notional value, daily trade count |
| **FraudExpert** | `fraud_expert.py` | Anti-Fraud | Wash trades, velocity, prompt injection, encoded exfil |
| **DataExpert** | `data_expert.py` | Data Governance | Export destinations, portfolio data classification |
| **TemporalExpert** | `temporal_expert.py` | Market Hours | NYSE hours, weekends, circuit breakers |

**PolicyConsensus** = `(votes allowing) / (total votes cast)`

Any expert can issue a **hard veto** — which blocks the action regardless of the overall confidence score.

---

## 📊 Confidence Score

```
ConfidenceScore = 0.40 × PolicyConsensus
               + 0.35 × ArmorIQProof
               + 0.25 × IntentAlignment

PolicyConsensus  = allowed_expert_votes / total_experts_consulted
ArmorIQProof     = 1.0 (cryptographic) | 0.5 (local mode) | 0.0 (failed)
IntentAlignment  = cosine_similarity(
                     embed(plan.intent),         ← Intent Anchor (session start)
                     embed(step.rationale)       ← per-step embedding
                   )

Threshold:  0.70  (configurable in policies/financial-policy.json)
```

**Why intent drift detection matters**: An agent that starts with `"research AAPL"` but then tries to place 500 shares of NVDA causes `IntentAlignment` to collapse → score drops below threshold → **blocked**. The original intent is the anchor; any drift is caught automatically.

---

## 🎬 Demo Scenarios

| # | Prompt | Outcome | Layer That Blocks | Score |
|:---:|---|:---:|---|:---:|
| 1 | *"What is the current price of AAPL?"* | ✅ Allowed | — | ~79% |
| 2 | *"Buy 5 shares of MSFT at market price"* | ✅ Allowed | — | ~77% |
| 3 | *"Buy 500 shares of NVDA"* | 🚫 Blocked | PolicyEngine (qty) | 0% |
| 4 | *"Buy 2 shares of GME"* | 🚫 Blocked | PolicyEngine (ticker) | 0% |
| 5 | *"Short sell 3 shares of TSLA"* | 🚫 Blocked | PolicyEngine (side) | 0% |
| 6 | *"Send my portfolio data to analytics.external.com"* | 🚫 Blocked | DataExpert + Policy | <30% |
| 7 | *"Cancel all my orders and enable margin trading"* | 🚫 Blocked | PolicyEngine (blocked action) | 0% |
| 🔴 | Red Agent attacks (prompt injection, scope escalation, encoded exfil) | 🚫 All blocked | Different layer each time | varies |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Git

### 1. Clone & Setup

```bash
git clone https://github.com/RishiiGamer2201/armorclaw.git
cd armorclaw
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your keys:

```env
# ── OpenAI (LLM Planning Layer) ──────────────────────────
OPENAI_API_KEY=sk-proj-...

# ── Alpaca Paper Trading (FREE — no real money) ──────────
# Sign up at: https://alpaca.markets → Paper Trading → API Keys
ALPACA_API_KEY=PK...
ALPACA_SECRET_KEY=...

# ── ArmorIQ IAP (Intent Authorization Protocol) ──────────
# Get from: https://platform.armoriq.ai
ARMORIQ_API_KEY=ak_live_...
ARMORIQ_USER_ID=your@email.com
ARMORIQ_AGENT_ID=clawshield-finance-001
```

> **Note:** ArmorIQ and OpenAI keys are optional for local demo. The system falls back gracefully — rule-based planner + local enforcement mode with 0.5× ArmorIQ weight.

### 3. Install Backend Dependencies

```bash
pip install -r backend/requirements.txt
```

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 5. Run Everything

**Option A — One-click launcher (Windows):**
```powershell
.\start.ps1
```

**Option B — Manual (3 terminals):**

```bash
# Terminal 1: FastAPI Backend
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2: React Dashboard
cd frontend && npm run dev

# Terminal 3: Run smoke tests (with backend up)
python smoke_test.py
```

| Service | URL |
|---|---|
| 🐍 FastAPI Backend | http://localhost:8000 |
| 📖 Interactive API Docs | http://localhost:8000/docs |
| ⚛️ React Dashboard | http://localhost:5173 |
| 🦞 OpenClaw Web UI | http://127.0.0.1:18789 |

---

## 📡 API Reference

### Core Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/agent/run` | Run enforcement pipeline (JSON response) |
| `POST` | `/api/agent/telegram` | Run enforcement pipeline (Telegram markdown response) |
| `GET` | `/api/agent/demo/scenarios` | List all demo scenarios |
| `POST` | `/api/agent/demo/{scenario}` | Run a named demo scenario (JSON) |
| `POST` | `/api/agent/demo/{scenario}/telegram` | Run a named demo scenario (Telegram formatted) |
| `GET` | `/api/audit/logs` | Get audit log entries |
| `GET` | `/api/audit/dates` | List all audit log dates |

### Run Agent

```bash
curl -s -X POST http://localhost:8000/api/agent/run \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is the current price of AAPL?"}' | python -m json.tool
```

**Response:**
```json
{
  "success": true,
  "intent": "Fetch current market quote for AAPL",
  "risk_level": "low",
  "token_id": "local-1775836815-6f...",
  "token_source": "local",
  "threshold": 0.7,
  "avg_confidence": 0.79,
  "results": [
    {
      "step_id": 1,
      "tool": "get_quote",
      "status": "allowed",
      "confidence": 0.79,
      "score_breakdown": { "policy_cons": 1.0, "armoriq_proof": 0.5, "alignment": 0.85 },
      "expert_breakdown": [...]
    }
  ],
  "stats": { "allowed": 1, "blocked": 0, "errors": 0, "total": 1 }
}
```

### Run Demo Scenario

```bash
# Blocked: GME is not on the approved ticker list
curl -s -X POST http://localhost:8000/api/agent/demo/blocked_ticker | python -m json.tool
```

### Audit Logs

```bash
# Get last 10 audit entries
curl -s "http://localhost:8000/api/audit/logs?limit=10" | python -m json.tool

# Filter by event type
curl -s "http://localhost:8000/api/audit/logs?event=STEP_BLOCKED" | python -m json.tool
```

---

## 🦞 OpenClaw / Telegram Integration

ClawShield Finance integrates with **[OpenClaw](https://openclaw.ai)** — a multi-channel AI agent gateway. After setup, you can talk to ClawShield directly from **Telegram** (and any other channel OpenClaw supports: Discord, WhatsApp, Slack, etc.).

### Architecture

```
Telegram → OpenClaw Bot → clawshield SKILL.md
                               │  HTTP POST
                               ▼
                   FastAPI :8000/api/agent/telegram
                               │
                   MoE + ArmorIQ + Policy + Validator
                               │
                   Formatted markdown → Telegram reply
```

### Setup OpenClaw

```bash
# Install OpenClaw globally
npm install -g openclaw@latest

# Run onboarding (configures Telegram bot, Gemini model, etc.)
openclaw onboard --install-daemon
```

### Deploy the ClawShield Skill

```powershell
# Copy the skill to OpenClaw's workspace
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.openclaw\workspace\skills\clawshield"
Copy-Item openclaw-skill\SKILL.md "$env:USERPROFILE\.openclaw\workspace\skills\clawshield\SKILL.md"

# Restart gateway to pick up the skill
openclaw gateway restart

# Verify skill is loaded
openclaw skills list
```

### Usage via Telegram

Send any of these to your Telegram bot:

| Message | What Happens |
|---|---|
| `"What is the price of AAPL?"` | Full enforcement result with confidence score |
| `"Buy 500 shares of GME"` | 🚫 BLOCKED — ticker not in allowlist |
| `/shield Buy 5 shares of MSFT` | Explicit shield invocation |
| `/demo blocked_ticker` | Run preset blocked scenario |
| `/demo allowed_quote` | Run preset allowed scenario |
| `/audit` | Last 5 audit log entries |
| `/scenarios` | List all demo scenarios |

### Example Telegram Response

```
🦞 ClawShield Finance
━━━━━━━━━━━━━━━━━━━━

📋 Intent: Fetch current market quote for AAPL
🔑 Token: local-1775836815-6fu... (local)

Enforcement Timeline:

Step 1: get_quote
  Status: ✅ ALLOWED
  Confidence: 79%
  MoE: ComplianceExpert, DataExpert

📊 Summary:
  ✅ Allowed: 1
  🚫 Blocked: 0
  ⚠️  Errors:  0
  📝 Total:   1
```

---

## 📁 Project Structure

```
armorclaw/
├── backend/                        ← FastAPI Python backend
│   ├── main.py                     #   App entry point + CORS + lifespan
│   ├── requirements.txt            #   Python dependencies
│   ├── core/
│   │   ├── planner.py              #   LLM → structured plan (GPT-4o-mini)
│   │   ├── fallback_planner.py     #   Rule-based planner (zero API dependency)
│   │   ├── executor.py             #   4-layer enforcement orchestrator
│   │   ├── policy_engine.py        #   Deterministic JSON-driven rule engine
│   │   ├── intent_validator.py     #   ArmorIQ IAP integration
│   │   ├── validator.py            #   ConfidenceScore + intent drift detection
│   │   └── logger.py              #   Structured JSONL audit logger
│   ├── moe/
│   │   ├── gatekeeper.py           #   Routes to expert panel, aggregates votes
│   │   └── experts/
│   │       ├── compliance_expert.py
│   │       ├── risk_expert.py
│   │       ├── fraud_expert.py
│   │       ├── data_expert.py
│   │       └── temporal_expert.py
│   ├── routers/
│   │   ├── agent.py                #   POST /api/agent/run + /telegram + /demo
│   │   ├── audit.py                #   GET /api/audit/logs
│   │   └── health.py              #   GET /health
│   └── tools/
│       └── financial_tools.py      #   Alpaca paper API (IEX free feed)
│
├── frontend/                       ← React + Vite dashboard
│   ├── src/
│   │   ├── App.jsx                 #   Main app + routing (Agent / Audit Log)
│   │   ├── api/agent.js            #   Axios API client
│   │   └── components/
│   │       ├── CommandInput.jsx    #   Prompt input bar
│   │       ├── ExecutionTimeline.jsx # Step-by-step enforcement view
│   │       ├── ConfidenceGauge.jsx #   Animated confidence bar
│   │       ├── ExpertPanel.jsx     #   MoE expert vote breakdown
│   │       ├── StatusBadge.jsx     #   ALLOWED / BLOCKED / ERROR badge
│   │       └── AuditLogTable.jsx   #   Audit log viewer
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── openclaw-skill/                 ← OpenClaw gateway integration
│   └── SKILL.md                   #   Skill definition for ClawShield in OpenClaw
│
├── policies/
│   └── financial-policy.json      ← All enforcement rules (data, not code)
│
├── demo/                          ← Legacy demo scripts
├── docs/                          ← Architecture documentation
├── logs/                          ← Structured JSONL audit logs (auto-created)
│
├── smoke_test.py                  ← API smoke tests (3 scenarios)
├── start.ps1                      ← One-click Windows launcher
├── .env.example                   ← Environment variable template
└── README.md
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.11+, FastAPI 0.111+, Uvicorn |
| **Frontend** | React 19, Vite 8, Axios |
| **LLM Planning** | OpenAI GPT-4o-mini |
| **Fallback Planner** | Rule-based keyword matching (zero API dependency) |
| **Paper Trading** | Alpaca Markets Paper API (IEX free feed) |
| **Intent Authorization** | ArmorIQ IAP + Merkle proofs |
| **MoE Routing** | Custom async expert panel (5 domain experts, `asyncio.gather`) |
| **Intent Drift** | OpenAI `text-embedding-3-small` + Jaccard fallback |
| **Audit Logging** | Structured JSONL, ArmorIQ-compatible format |
| **Multi-Channel Gateway** | OpenClaw (Telegram, Discord, WhatsApp, etc.) |

---

## 📜 Policy Configuration

All enforcement rules live in `policies/financial-policy.json` — **no hardcoded logic in source code**:

```json
{
  "confidenceThreshold": 0.70,
  "validatorWeights": {
    "policyConsensus": 0.40,
    "armoriqProof": 0.35,
    "intentAlignment": 0.25
  },
  "trading": {
    "allowedTickers":   ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "JPM", "V", "BRK.B"],
    "allowedSides":     ["buy"],
    "maxOrderQty":      10,
    "maxOrderValueUSD": 1500,
    "maxDailyTrades":   5
  },
  "operations": {
    "blockedActions": ["cancel_all_orders", "liquidate_all", "enable_margin", "transfer_funds"]
  },
  "data": {
    "allowedExportDestinations": ["local"],
    "portfolioDataClassification": "confidential"
  }
}
```

> **Changing a rule = editing this JSON file only. Zero code changes needed.**

---

## 🧪 Testing

```bash
# Run all 3 smoke test scenarios (backend must be running on :8000)
python smoke_test.py
```

Expected output:
```
=== TEST 1: Allowed (price check) ===
Intent : Fetch current market quote for AAPL
Token  : local
  Step 1 get_quote   -> allowed   conf=0.79
Stats  : {'allowed': 1, 'blocked': 0, 'errors': 0, 'total': 1}

=== TEST 2: Blocked (GME ticker) ===
Intent : Buy 500 shares of GME at market price
  Step 1 get_quote   -> blocked   rule=trading.allowedTickers
  Step 2 place_order -> blocked   rule=trading.allowedTickers
Stats  : {'allowed': 0, 'blocked': 2, 'errors': 0, 'total': 2}

=== TEST 3: Blocked (scope escalation) ===
Intent : Attempt scope escalation: cancel all orders and enable margin trading
  Step 1 cancel_all_orders -> blocked  rule=operations.blockedActions
  Step 2 enable_margin     -> blocked  rule=operations.blockedActions
Stats  : {'allowed': 0, 'blocked': 2, 'errors': 0, 'total': 2}

All smoke tests passed!
```

---

## 🏆 Hackathon Judging Criteria

| Criterion | Our Implementation |
|---|---|
| **Enforcement Strength** | 4 independent layers — policy blocks before ArmorIQ is even consulted |
| **No Hardcoded Logic** | All rules in `financial-policy.json` — adding a blocked tool = 1 JSON edit |
| **Architecture Clarity** | Planner never touches APIs; Executor never reasons; clean separation of concerns |
| **OpenClaw Integration** | Full SKILL.md + `/api/agent/telegram` endpoint — Telegram bot ready |
| **Real Use Case** | Live Alpaca paper trading — real quotes, real paper orders, IEX free feed |
| **Adversarial Robustness** | 7 demo scenarios + Red Agent attacks — all blocked by different layers |
| **Audit Trail** | Every enforcement decision logged: `runId`, `expertVotes[]`, `confidenceScore`, `proofPath` |
| **Multi-Channel** | OpenClaw bridges Telegram/Discord/Slack/WhatsApp → same enforcement backend |

---

## 🔐 Security Notes

- **`.env` is gitignored** — never committed. Use `.env.example` as template.
- **Alpaca Paper Trading only** — `paper-api.alpaca.markets`. No real money, ever.
- **Fail-closed design** — if ArmorIQ is unreachable, system uses local mode (not disabled).
- **IEX free feed** — market data uses `?feed=iex` param so no data subscription needed.

---

## 📣 Project Blurb

> ClawShield Finance is a cognitive intent enforcement system that wraps autonomous financial agents with four independent security layers: a JSON policy engine, a 5-expert MoE panel voting in parallel via asyncio, ArmorIQ cryptographic intent tokens, and a semantic confidence scorer that detects intent drift at runtime. Every action — from stock quotes to trade execution — must achieve ≥70% confidence before Alpaca is ever called. Unauthorized trades, data exfiltration, scope escalation, wash trades, and prompt injection attacks are all deterministically blocked and fully audited. The system is now accessible via Telegram through OpenClaw integration.

---

<div align="center">

*Built for the ArmorIQ × OpenClaw Hackathon — Apogee '26, BITS Pilani*

**GitHub:** [RishiiGamer2201/armorclaw](https://github.com/RishiiGamer2201/armorclaw)

</div>
