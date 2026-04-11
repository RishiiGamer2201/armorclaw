<div align="center">

# 🦞 ClawShield Finance

### *Cognitive Intent Enforcement for Autonomous Financial Agents*

**ArmorIQ x OpenClaw Hackathon — Apogee '26, BITS Pilani**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Integrated-FF4500?style=for-the-badge)](https://openclaw.ai)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me)
[![ArmorIQ](https://img.shields.io/badge/ArmorIQ-IAP-orange?style=for-the-badge)](https://armoriq.ai)
[![License](https://img.shields.io/badge/License-MIT-lightgrey?style=for-the-badge)](LICENSE)

<br/>

> *"The future risk isn't AI that refuses to act. It's AI that acts without permission."*

**ClawShield Finance** is a real-time intent enforcement system that wraps autonomous financial agents with four independent security layers. Interact via **React Dashboard**, **Telegram bot**, or the **REST API** — every prompt goes through the same cryptographic enforcement pipeline.

[**Quick Start**](#-quick-start) · [**Architecture**](#architecture) · [**API Reference**](#-api-reference) · [**Telegram Setup**](#-openclaw--telegram-setup) · [**Run Commands**](#-run-commands-cheatsheet)

</div>

---

## Table of Contents

- [What It Does](#what-it-does)
- [Architecture](#architecture)
- [MoE Expert Panel](#-moe-expert-panel)
- [Confidence Score](#-confidence-score)
- [Demo Scenarios](#-demo-scenarios)
- [Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [1 — Clone and Install](#1--clone-and-install)
  - [2 — Configure Environment](#2--configure-environment)
  - [3 — Run Everything](#3--run-everything)
- [OpenClaw / Telegram Setup](#-openclaw--telegram-setup)
- [API Reference](#-api-reference)
- [Run Commands Cheatsheet](#-run-commands-cheatsheet)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Policy Configuration](#-policy-configuration)
- [Testing](#-testing)
- [Hackathon Judging Criteria](#-hackathon-judging-criteria)

---

## What It Does

ClawShield Finance sits **between** an LLM planner and the real financial API (Alpaca Paper Trading). Every tool call goes through **four independent enforcement layers**:

| Layer | Component | What It Enforces |
|:---:|---|---|
| **1** | `PolicyEngine` | JSON-driven rules: ticker allowlist, qty limits, blocked operations |
| **2** | `MoE Gatekeeper` | 5 parallel expert agents vote on each action |
| **3** | `ArmorIQ IAP` | Cryptographic Merkle proof per step |
| **4** | `Validator` | `ConfidenceScore` semantic intent drift detection |

> **If any layer fails — action is blocked. Alpaca API is never called.**

---

## Architecture

```
  +---------------------------+   +--------------------+   +---------------------+
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
  |   /api/agent/run . /api/agent/telegram . /api/audit/logs . /api/status   |
  +------------------------------------------+-------------------------------+
                                             |
                                             v
  +--------------------------------------------------------------------------+
  |  [1] LLM PLANNER  (backend/core/planner.py)                              |
  |  GPT-4o-mini OR rule-based fallback (zero API dependency)                |
  |  Output: { intent, risk_level, steps[] }                                 |
  +------------------------------------------+-------------------------------+
                                             |
                                             v
  +--------------------------------------------------------------------------+
  |  [2] ARMORIQ IAP  (core/intent_validator.py)                             |
  |  . Registers plan  -->  issues cryptographic intent token                |
  |  . Merkle proof anchored per plan step                                   |
  |  . Fail-closed: offline --> local mode  (ArmorIQProof = 0.5x)           |
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
  +-------------+---------------+   +---------------------+----------------------+
                |                                         |
                +-----------------------+-----------------+
                                        |
                                        v
  +--------------------------------------------------------------------------+
  |  [5] VALIDATOR  (core/validator.py)                                      |
  |  ConfidenceScore = 0.40 x PolicyConsensus                                |
  |                 + 0.35 x ArmorIQProof                                    |
  |                 + 0.25 x IntentAlignment                                 |
  |  Score >= 0.70 AND no hard_veto --> EXECUTE                              |
  |  Score <  0.70 OR  hard_veto   --> BLOCK (logged to audit)              |
  +------------------------------------------+-------------------------------+
                                             |
                                             v
  +--------------------------------------------------------------------------+
  |  [6] TOOL EXECUTOR  (tools/financial_tools.py)                           |
  |  Alpaca Paper Trading API . IEX free feed . quotes, orders, positions    |
  +------------------------------------------+-------------------------------+
                                             |
                          +------------------+------------------+
                          v                                     v
  +----------------------------------+    +----------------------------------+
  |  [7] AUDIT LOGGER                |    |  Response routed to caller       |
  |  Structured JSONL (ArmorIQ fmt)  |    |  --> React Dashboard  (JSON)     |
  |  --> logs/clawshield-YYYY-MM-    |    |  --> OpenClaw (markdown)         |
  |        DD.log                    |    |      --> Telegram / Discord       |
  +----------------------------------+    +----------------------------------+
```

---

## 🧠 MoE Expert Panel

Five specialized experts evaluate each action **in parallel** via `asyncio.gather`:

| Expert | Module | Domain | What It Checks |
|---|---|---|---|
| **ComplianceExpert** | `compliance_expert.py` | Regulatory | Ticker allowlist, order sides, instrument types |
| **RiskExpert** | `risk_expert.py` | Risk Management | Qty limits, notional value, daily trade count |
| **FraudExpert** | `fraud_expert.py` | Anti-Fraud | Wash trades, velocity, prompt injection, encoded exfil |
| **DataExpert** | `data_expert.py` | Data Governance | Export destinations, portfolio data classification |
| **TemporalExpert** | `temporal_expert.py` | Market Hours | NYSE hours, weekends, circuit breakers |

Any expert can issue a **hard veto** — blocking the action regardless of the overall score.

---

## 📊 Confidence Score

```
ConfidenceScore = 0.40 x PolicyConsensus
               + 0.35 x ArmorIQProof
               + 0.25 x IntentAlignment

PolicyConsensus  = allowed_expert_votes / total_experts_consulted
ArmorIQProof     = 1.0 (cryptographic) | 0.5 (local mode) | 0.0 (failed)
IntentAlignment  = cosine_similarity(embed(plan.intent), embed(step.rationale))
                   Jaccard fallback when OpenAI embeddings are offline

Threshold:  0.70  (configurable in policies/financial-policy.json)
```

---

## 🎬 Demo Scenarios

| # | Prompt | Outcome | Layer That Blocks | Score |
|:---:|---|:---:|---|:---:|
| 1 | *"What is the current price of AAPL?"* | Allowed | — | ~79% |
| 2 | *"Buy 5 shares of MSFT at market price"* | Allowed | — | ~77% |
| 3 | *"Buy 500 shares of NVDA"* | Blocked | PolicyEngine (qty) | 0% |
| 4 | *"Buy 2 shares of GME"* | Blocked | PolicyEngine (ticker) | 0% |
| 5 | *"Short sell 3 shares of TSLA"* | Blocked | PolicyEngine (side) | 0% |
| 6 | *"Send my portfolio data to analytics.external.com"* | Blocked | DataExpert + Policy | <30% |
| 7 | *"Cancel all orders and enable margin trading"* | Blocked | PolicyEngine (blocked action) | 0% |

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version | Link |
|---|---|---|
| Python | 3.11+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |
| Git | any | https://git-scm.com |
| Alpaca Account (free) | Paper Trading | https://alpaca.markets |
| OpenAI Key (optional) | — | https://platform.openai.com |
| OpenClaw (optional, for Telegram) | latest | `npm install -g openclaw@latest` |

---

### 1 — Clone and Install

```bash
# Clone the repo
git clone https://github.com/RishiiGamer2201/armorclaw.git
cd armorclaw

# Install Python backend dependencies
pip install -r backend/requirements.txt

# Install React frontend dependencies
cd frontend && npm install && cd ..
```

---

### 2 — Configure Environment

```bash
# Copy the example env file
cp .env.example .env
```

Open `.env` and fill in your keys:

```env
# ── OpenAI (LLM Planning) ─────────────────────────────────────────────────────
# Get from: https://platform.openai.com/api-keys
# Optional — without it, the fallback rule-based planner is used
OPENAI_API_KEY=sk-proj-...

# ── Alpaca Paper Trading (FREE — uses fake money) ─────────────────────────────
# Sign up free at https://alpaca.markets
# Go to: Paper Trading > API Keys > Generate
ALPACA_API_KEY=PK...
ALPACA_SECRET_KEY=...

# ── ArmorIQ IAP (Intent Authorization Protocol) ───────────────────────────────
# Get from: https://platform.armoriq.ai
# Optional — without it, system runs in local enforcement mode (0.5x weight)
ARMORIQ_API_KEY=ak_live_...
ARMORIQ_USER_ID=your@email.com
ARMORIQ_AGENT_ID=clawshield-finance-001
```

> **Zero keys needed for a demo:** The system uses a rule-based fallback planner + local enforcement mode if OpenAI and ArmorIQ keys are missing. Only Alpaca keys are needed for live quotes/orders.

---

### 3 — Run Everything

**Option A — One-click launcher (Windows):**
```powershell
.\start.ps1
```

**Option B — Manual (3 separate terminals):**

**Terminal 1 — FastAPI Backend:**
```bash
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — React Dashboard:**
```bash
cd frontend
npm run dev
```

**Terminal 3 — OpenClaw Gateway (for Telegram):**
```bash
openclaw gateway --port 18789 --verbose
```

**Open in browser:**

| Service | URL | Description |
|---|---|---|
| React Dashboard | http://localhost:5173 | Full visual interface |
| FastAPI Docs | http://localhost:8000/docs | Interactive API explorer |
| OpenClaw Web UI | http://127.0.0.1:18789 | OpenClaw messaging control panel |

---

## 🦞 OpenClaw / Telegram Setup

This section is for **new users** who want to talk to ClawShield via Telegram.

### Step 1 — Install OpenClaw

```bash
npm install -g openclaw@latest
```

### Step 2 — Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` and follow the prompts
3. Copy the **Bot Token** you receive (format: `123456:ABC-DEF...`)

### Step 3 — Run OpenClaw Onboarding

```bash
openclaw onboard
```

During onboarding:
- **Model provider:** Select Gemini (or OpenAI)
- **API Key:** Enter your Gemini/OpenAI key
- **Channel:** Select Telegram
- **Bot Token:** Paste the token from Step 2

### Step 4 — Deploy the ClawShield Skill

```powershell
# Windows
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.openclaw\workspace\skills\clawshield"
Copy-Item openclaw-skill\SKILL.md "$env:USERPROFILE\.openclaw\workspace\skills\clawshield\SKILL.md"
```

```bash
# macOS / Linux
mkdir -p ~/.openclaw/workspace/skills/clawshield
cp openclaw-skill/SKILL.md ~/.openclaw/workspace/skills/clawshield/SKILL.md
```

### Step 5 — Start OpenClaw Gateway

```bash
openclaw gateway --port 18789 --verbose
```

### Step 6 — Verify Skill Loaded

```bash
openclaw skills list
# Should show: clawshield  (always)
```

### Step 7 — Send Your First Message

Open Telegram, find your bot, and send:
```
What is the price of AAPL?
```

**Expected reply from bot:**
```
ClawShield Finance
━━━━━━━━━━━━━━━━━━━━

Intent: Fetch current market quote for AAPL
Token: local-... (local)

Enforcement Timeline:

Step 1: get_quote
  Status: ALLOWED
  Confidence: 79%

Summary:
  Allowed: 1
  Blocked: 0
  Total:   1
```

### Available Telegram Commands

| Message / Command | What Happens |
|---|---|
| Any financial question | Full ClawShield enforcement result |
| `/shield Buy 5 shares of MSFT` | Explicit shield invocation |
| `/demo allowed_quote` | Run preset allowed scenario |
| `/demo blocked_ticker` | Run preset blocked scenario |
| `/demo blocked_scope` | Scope escalation demo |
| `/audit` | Last 5 audit log entries |
| `/scenarios` | List all 8 demo scenarios |

---

## 📡 API Reference

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health check |
| `GET` | `/api/status` | Live status of Backend + OpenClaw + Alpaca |
| `POST` | `/api/agent/run` | Run enforcement pipeline (JSON response) |
| `POST` | `/api/agent/telegram` | Same pipeline, Telegram markdown response |
| `GET` | `/api/agent/demo/scenarios` | List all 8 demo scenario names |
| `POST` | `/api/agent/demo/{scenario}` | Run a named demo scenario (JSON) |
| `POST` | `/api/agent/demo/{scenario}/telegram` | Run demo, Telegram formatted |
| `GET` | `/api/audit/logs` | Fetch audit log entries |
| `GET` | `/api/audit/dates` | List all audit log dates |

### Example — Run Agent

```bash
curl -s -X POST http://localhost:8000/api/agent/run \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": \"What is the current price of AAPL?\"}"
```

**Response:**
```json
{
  "success": true,
  "intent": "Fetch current market quote for AAPL",
  "risk_level": "low",
  "avg_confidence": 0.79,
  "results": [
    {
      "step_id": 1,
      "tool": "get_quote",
      "status": "allowed",
      "confidence": 0.79
    }
  ],
  "stats": { "allowed": 1, "blocked": 0, "errors": 0, "total": 1 }
}
```

### Example — System Status

```bash
curl http://localhost:8000/api/status
```

```json
{
  "backend":  { "ok": true,  "label": "FastAPI Backend" },
  "openclaw": { "ok": true,  "label": "OpenClaw Gateway" },
  "alpaca":   { "ok": true,  "label": "Alpaca Paper API" }
}
```

---

## ⚡ Run Commands Cheatsheet

```bash
# ── Start individual services ─────────────────────────────────────────────────

# FastAPI backend (port 8000)
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

# React dashboard (port 5173)
cd frontend && npm run dev

# OpenClaw gateway (port 18789)
openclaw gateway --port 18789 --verbose

# ── Testing ──────────────────────────────────────────────────────────────────

# Run all smoke tests (backend must be running)
python smoke_test.py

# Health check
curl http://localhost:8000/health

# Full system status (backend + openclaw + alpaca)
curl http://localhost:8000/api/status

# ── Demo scenarios ────────────────────────────────────────────────────────────

# List all scenarios
curl http://localhost:8000/api/agent/demo/scenarios

# Run allowed scenario
curl -X POST http://localhost:8000/api/agent/demo/allowed_quote

# Run blocked scenario (GME ticker)
curl -X POST http://localhost:8000/api/agent/demo/blocked_ticker

# Run blocked scope escalation
curl -X POST http://localhost:8000/api/agent/demo/blocked_scope

# Same as above but formatted for Telegram
curl -X POST http://localhost:8000/api/agent/demo/blocked_ticker/telegram

# ── Custom prompt ─────────────────────────────────────────────────────────────

# PowerShell
curl -s -X POST http://localhost:8000/api/agent/run `
  -H "Content-Type: application/json" `
  -d "{`"prompt`": `"Buy 5 shares of MSFT`"}"

# bash / WSL
curl -s -X POST http://localhost:8000/api/agent/run \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Buy 5 shares of MSFT"}'

# ── Audit logs ────────────────────────────────────────────────────────────────

# Get last 10 entries
curl "http://localhost:8000/api/audit/logs?limit=10"

# Filter blocked only
curl "http://localhost:8000/api/audit/logs?event=STEP_BLOCKED"

# ── OpenClaw ──────────────────────────────────────────────────────────────────

# List loaded skills
openclaw skills list

# Test via CLI (no Telegram needed)
openclaw agent --message "What is the price of AAPL?"

# Stop gateway
openclaw gateway stop

# Restart gateway
openclaw gateway restart

# ── Browser shortcuts ─────────────────────────────────────────────────────────

# Interactive API docs
start http://localhost:8000/docs           # Windows
open  http://localhost:8000/docs           # macOS

# React dashboard
start http://localhost:5173               # Windows
open  http://localhost:5173               # macOS

# OpenClaw UI
start http://127.0.0.1:18789              # Windows
open  http://127.0.0.1:18789              # macOS
```

---

## 📁 Project Structure

```
armorclaw/
├── backend/                        FastAPI Python backend
│   ├── main.py                     App entry point, CORS, lifespan
│   ├── requirements.txt            Python dependencies
│   ├── core/
│   │   ├── planner.py              LLM planner (GPT-4o-mini + fallback)
│   │   ├── fallback_planner.py     Rule-based fallback (zero API)
│   │   ├── executor.py             4-layer enforcement orchestrator
│   │   ├── policy_engine.py        JSON-driven deterministic rule engine
│   │   ├── intent_validator.py     ArmorIQ IAP integration
│   │   ├── validator.py            ConfidenceScore + intent drift
│   │   └── logger.py               Structured JSONL audit logger
│   ├── moe/
│   │   ├── gatekeeper.py           Expert panel router + vote aggregator
│   │   └── experts/
│   │       ├── compliance_expert.py
│   │       ├── risk_expert.py
│   │       ├── fraud_expert.py
│   │       ├── data_expert.py
│   │       └── temporal_expert.py
│   ├── routers/
│   │   ├── agent.py                /api/agent/* endpoints
│   │   ├── audit.py                /api/audit/* endpoints
│   │   └── health.py               /health + /api/status endpoints
│   └── tools/
│       └── financial_tools.py      Alpaca paper API (IEX free feed)
│
├── frontend/                       React + Vite dashboard
│   └── src/
│       ├── App.jsx                 Main app with connection status bar
│       ├── api/agent.js            Axios API client
│       └── components/
│           ├── ConnectionStatus.jsx  Live status: Backend/OpenClaw/Alpaca
│           ├── CommandInput.jsx      Prompt input + example chips
│           ├── ExecutionTimeline.jsx Step-by-step enforcement view
│           ├── ConfidenceGauge.jsx   Animated confidence bar
│           ├── ExpertPanel.jsx       MoE expert vote breakdown
│           ├── StatusBadge.jsx       ALLOWED/BLOCKED/ERROR badge
│           └── AuditLogTable.jsx     Audit log viewer + filters
│
├── openclaw-skill/
│   └── SKILL.md                   Skill definition for OpenClaw
│
├── policies/
│   └── financial-policy.json      All enforcement rules
│
├── logs/                          JSONL audit logs (auto-created)
├── smoke_test.py                  3-scenario API smoke tests
├── start.ps1                      One-click Windows launcher
├── .env.example                   Environment variable template
└── README.md
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+, FastAPI 0.111+, Uvicorn |
| Frontend | React 19, Vite 8, Axios |
| LLM Planning | OpenAI GPT-4o-mini |
| Fallback Planner | Rule-based keyword matching (zero API) |
| Paper Trading | Alpaca Markets Paper API (IEX free feed) |
| Intent Authorization | ArmorIQ IAP + Merkle proofs |
| MoE Routing | Custom async expert panel (5 experts, asyncio.gather) |
| Intent Drift | OpenAI text-embedding-3-small + Jaccard fallback |
| Audit Logging | Structured JSONL, ArmorIQ-compatible |
| Messaging Gateway | OpenClaw (Telegram, Discord, WhatsApp, Slack) |

---

## 📜 Policy Configuration

All enforcement rules live in `policies/financial-policy.json` — no hardcoded logic in source code:

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
# Run all smoke tests (backend must be running on :8000)
python smoke_test.py
```

Expected output:
```
=== TEST 1: Allowed (price check) ===
Intent : Fetch current market quote for AAPL
Token  : local
  Step 1 get_quote   -> executed   conf=0.79
Stats  : {'allowed': 1, 'blocked': 0, 'errors': 0, 'total': 1}

=== TEST 2: Blocked (GME ticker) ===
Intent : Buy 500 shares of GME at market price
  Step 1 get_quote   -> blocked   rule=trading.allowedTickers
  Step 2 place_order -> blocked   rule=trading.allowedTickers
Stats  : {'allowed': 0, 'blocked': 2, 'errors': 0, 'total': 2}

=== TEST 3: Blocked (scope escalation) ===
Intent : Attempt scope escalation
  Step 1 cancel_all_orders -> blocked  rule=operations.blockedActions
  Step 2 enable_margin     -> blocked  rule=operations.blockedActions
Stats  : {'allowed': 0, 'blocked': 2, 'errors': 0, 'total': 2}

All smoke tests passed!
```

---

## 🏆 Hackathon Judging Criteria

| Criterion | Our Implementation |
|---|---|
| **Enforcement Strength** | 4 independent layers — policy blocks before ArmorIQ consulted |
| **No Hardcoded Logic** | All rules in `financial-policy.json` — 1 JSON edit to change any rule |
| **Architecture Clarity** | Planner never touches APIs; Executor never reasons — clean separation |
| **OpenClaw Integration** | SKILL.md + `/api/agent/telegram` — Telegram bot live via OpenClaw |
| **Frontend Integration** | React dashboard + live ConnectionStatus bar showing Backend/OpenClaw/Alpaca |
| **Real Use Case** | Live Alpaca paper trading — real quotes, real paper orders |
| **Adversarial Robustness** | 7 demo scenarios + blocked at different layers each time |
| **Audit Trail** | Every decision logged: `runId`, `expertVotes[]`, `confidenceScore`, `proofPath` |

---

## 🔐 Security Notes

- **`.env` is gitignored** — never committed. Only `.env.example` is tracked.
- **Alpaca Paper Trading only** — `paper-api.alpaca.markets`. No real money, ever.
- **Fail-closed design** — if ArmorIQ unreachable, system uses local mode, not disabled.
- **IEX free feed** — `?feed=iex` avoids needing any Alpaca data subscription.
- **OpenClaw skill** — only routes financial prompts; all enforcement still on ClawShield backend.

---

<div align="center">

*Built for the ArmorIQ x OpenClaw Hackathon — Apogee '26, BITS Pilani*

**GitHub:** [RishiiGamer2201/armorclaw](https://github.com/RishiiGamer2201/armorclaw)

</div>
