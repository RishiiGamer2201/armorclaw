<div align="center">

# ClawShield Finance

#### Intent-Aware Defensive Financial Execution Gateway

**ArmorIQ x OpenClaw Hackathon -- Apogee '26, BITS Pilani**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Integrated-FF4500?style=for-the-badge)](https://openclaw.ai)

<br/>

> *"The future risk isn't AI that refuses to act. It's AI that acts without permission."*

A zero-trust execution gateway where the LLM **plans** but never executes.
Every action passes through **6 independent enforcement layers** before any side effect occurs.
If any layer rejects, the action is blocked and logged.

</div>

---

## The Problem

AI agents are getting execution power over financial systems. But agents don't understand intent -- they interpret instructions. An agent asked to "check stock price" might buy the stock, export your portfolio, or cancel all orders.

Traditional security controls **who** an agent is. Nobody controls **what** it does within its permissions. This is semantic privilege escalation.

Real incidents prove this is not theoretical:
- **Meta Sev-1 (March 2026):** rogue agent leaked internal docs for 2 hours using valid credentials
- **postmark-mcp:** malicious email tool added hidden BCCs, compromising 300+ organizations
- **Step Finance:** $45M drained when AI trading agents exceeded their intended scope
- **1,184 malicious skills** found on ClawHub (1 in 5 packages)

---

## Architecture

```
User Prompt
    |
    v
[1] LLM Planner (Gemini 2.5 Flash) --> Structured JSON plan
    |
    v
[2] SHA256 Merkle Tree --> HMAC-signed intent token (600s expiry)
    |
    v  (per step)
[3] Circuit Breaker       --> Trade velocity limit
[4] PolicyEngine          --> Deterministic JSON-driven rules
[5] MoE Gatekeeper        --> 5 AI expert agents vote (consensus + hard veto)
[6] Merkle Proof           --> Cryptographic step-matches-plan verification
[7] ConfidenceScore       --> 0.40*Consensus + 0.35*CryptoProof + 0.25*Alignment
[8] DEFCON Auto-Tightening --> Policy hardens under attack
    |
    v
    ALL pass --> EXECUTE     ANY fails --> BLOCK + audit log
```

**Core principle:** The LLM planner **never** imports or calls financial tools. The executor **never** reasons about what to do. Reasoning and execution are completely separated.

---

## Key Differentiators

### Real Cryptographic Intent Enforcement
SHA256 Merkle tree built over plan steps. HMAC-SHA256 signed tokens with 600-second expiry. Per-step Merkle proof verification. If an agent tries to execute a step not in the original plan, the leaf hash doesn't exist in the tree. **Intent drift is mathematically impossible.**

### AI-Powered Fraud Detection
Two-phase FraudExpert: Phase 1 regex (<1ms deterministic), Phase 2 Gemini AI deep analysis for novel attacks. Scans original prompt + plan + tool args. Goes beyond hardcoded if-else.

### Bounded Agent Delegation
Parent agents create sub-agents with restricted tool access. 4 scopes: `read_only`, `trade_limited`, `compliance_audit`, `payment_processor`. Scope violations deterministically blocked.

### Tool Poisoning Detection
Based on the real postmark-mcp attack (300 orgs compromised). A "notification" tool secretly tries to trigger a hidden wire transfer. The executor detects it because the hidden action was never in the signed Merkle tree.

### Intent Drift Demo
Register Merkle tree for "check price of AAPL", then try to execute "buy 100 shares of AAPL" against the same token. `place_order` fails verification because its leaf hash doesn't exist in the tree built for `get_quote`.

### Multi-Agent Cascade Prevention
3 agents in a delegation chain. Middle one gets "compromised" with malicious instructions. ArmorIQ contains the blast radius via per-agent delegation scope enforcement. Compromise of one agent cannot poison others.

### Dynamic Policy Tightening (DEFCON)
When FraudExpert detects injection attempts, policy automatically tightens. DEFCON 3: max order drops to 100 shares. DEFCON 2: cross-border blocked. DEFCON 1: all trading frozen.

### Trade Velocity Circuit Breaker
Inspired by the $45M Step Finance breach. Sliding window rate limiter trips when N trades happen in M seconds, freezing ALL trading tools.

---

## Enforcement Demos

| Feature | What It Demonstrates |
|---|---|
| **Intent Drift Attack** | Merkle proof fails when agent deviates from plan |
| **Cascade Prevention** | 3-agent chain, middle compromised, blast radius contained |
| **Agent Delegation** | Sub-agents blocked from exceeding scope |
| **Cross-Border Payment** | 5-layer compliance cascade (IBAN/sanctions/AML/status/balance) |
| **Compliance Pipeline** | 4-stage onboarding (KYC/AML/sanctions/risk) |
| **Sanctions Screening** | OFAC/UN/EU match detection |
| **Tool Poisoning** | Hidden action intercepted by Merkle verification |
| **PII Leak Scanner** | Catches credit cards, SSNs, IBANs in agent output |
| **Circuit Breaker** | Trading frozen on velocity breach |
| **DEFCON Mode** | Policy auto-tightens under attack |

## Financial Operations (all enforced)

Wire Transfer, AML Detection, Emergency Freeze, Cheque Fraud Scanner (Gemini Vision), KYC Verification (Gemini Vision), Invoice Verification (Gemini Vision), Crypto Asset Swap, Corporate Card Generation, DTI Loan Pricing, Transaction Anomaly Audit

---

## Red Agent Attack Suite

11 adversarial scenarios run automatically with one click:

| Attack | Blocked By |
|---|---|
| Prompt Injection | FraudExpert (AI + regex) |
| SQL Injection | FraudExpert |
| Scope Escalation | PolicyEngine (blockedActions) |
| Data Exfiltration | PolicyEngine + DataExpert |
| Blocked Ticker (GME) | PolicyEngine (allowedTickers) |
| Oversized Order (5000 shares) | PolicyEngine (maxOrderQty) |
| Short Selling | PolicyEngine (shortSellingAllowed) |
| Wire Over Limit ($50K) | PolicyEngine (maxWire) |
| Delegation Escape | DelegationManager (scope violation) |

**Score: 9/10 attacks blocked. The 1 "allowed" is the control test.**

---

## MoE Gatekeeper (5 Expert Panel)

| Expert | Domain | What It Checks |
|---|---|---|
| **ComplianceExpert** | Compliance | Blocked operations, ticker allowlists, order side restrictions |
| **RiskExpert** | Risk | Order size thresholds, position concentration, plan risk levels |
| **FraudExpert** | Fraud | Prompt injection (regex + Gemini AI), suspicious destinations, anomalous quantities |
| **DataExpert** | Data | Data classification, export destination allowlists, external request blocking |
| **TemporalExpert** | Temporal | Time-in-force validation, daily trade limits, session rate limiting |

---

## Confidence Scoring

```
ConfidenceScore = 0.40 * PolicyConsensus + 0.35 * ArmorIQProof + 0.25 * IntentAlignment
```

- **PolicyConsensus** (0.40): ratio of approving MoE experts
- **ArmorIQProof** (0.35): 1.0 if ArmorIQ remote, 0.9 if local Merkle verified, 0.0 if failed
- **IntentAlignment** (0.25): semantic similarity between intent and step rationale

Threshold: action blocked if score < 0.60

---

## Technology Stack

| Layer | Technology |
|---|---|
| LLM Planner | Gemini 2.5 Flash |
| Intent Enforcement | SHA256 Merkle + HMAC-SHA256 |
| Policy Engine | JSON-driven deterministic rules |
| MoE Gatekeeper | 5 expert agents with consensus voting |
| Fraud Detection | Regex + Gemini AI (two-phase) |
| Delegation | Bounded authority tokens with scope enforcement |
| Circuit Breaker | Sliding window rate limiter |
| DEFCON | Adaptive policy tightening |
| Backend | Python 3.11+ / FastAPI |
| Frontend | React 19 / Vite |
| Database | SQLite 3 |
| OpenClaw | SKILL.md + Telegram endpoints |

---

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Gemini API key (set `GEMINI_API_KEY` in `.env`)

### Run

```bash
# Backend
cd backend && pip install -r requirements.txt && cd ..
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

Open `http://localhost:5173`

### Environment

Copy `.env.example` to `.env` and add your keys:
```
GEMINI_API_KEY=your-key
ALPACA_API_KEY=your-key
ALPACA_SECRET_KEY=your-key
ARMORIQ_API_KEY=ak_live_...
ARMORIQ_USER_ID=your-email
ARMORIQ_AGENT_ID=clawshield-finance-001
```

---

## Project Structure

```
clawshield-finance/
|-- backend/
|   |-- core/
|   |   |-- executor.py          # 6-layer enforcement orchestration
|   |   |-- planner.py           # Gemini 2.5 Flash LLM planner
|   |   |-- fallback_planner.py  # Rule-based fallback (no API needed)
|   |   |-- intent_validator.py  # SHA256 Merkle tree IAP
|   |   |-- policy_engine.py     # JSON-driven policy enforcement
|   |   |-- validator.py         # ConfidenceScore computation
|   |   |-- delegation.py        # Bounded agent delegation
|   |   +-- logger.py            # JSONL audit trail
|   |-- moe/
|   |   |-- gatekeeper.py        # MoE router + consensus
|   |   +-- experts/             # 5 expert agents
|   |-- tools/
|   |   |-- financial_tools.py   # 21 tool registry
|   |   +-- universal_finance.py # Financial + enforcement tools
|   |-- routers/
|   |   |-- agent.py             # All API endpoints
|   |   +-- audit.py             # Audit log API
|   +-- main.py                  # FastAPI entry point
|-- frontend/
|   +-- src/
|       |-- components/          # Dashboard, feature pages, result cards
|       +-- api/agent.js         # API client
|-- policies/
|   +-- financial-policy.json    # All enforcement rules (data, not code)
|-- openclaw-skill/
|   +-- SKILL.md                 # OpenClaw integration spec
+-- PITCH.md                     # Hackathon pitch document
```

---

## Design Principles

1. **Reasoning is not Execution** -- Planner never calls tools. Executor never reasons.
2. **Fail Closed** -- Unknown tools blocked. Expired tokens blocked. Unreachable services penalized.
3. **Defense in Depth** -- 6 independent layers. All must approve.
4. **Policy as Data** -- All rules in `financial-policy.json`. No hardcoded logic.
5. **No Human Loops** -- Fully automated. Merkle proofs provide mathematical certainty.
6. **Full Auditability** -- Every decision logged with timestamp, tool, args, confidence, reason, rule, expert breakdown.
7. **Beyond If-Else** -- AI-powered fraud detection + cryptographic verification.

---

## By The Numbers

| | |
|---|---|
| **21** | Financial tools under enforcement |
| **6** | Independent enforcement layers per step |
| **5** | AI expert agents in MoE panel |
| **11** | Adversarial attack scenarios (9/10 blocked) |
| **4** | Delegation scopes with bounded authority |
| **<5ms** | Enforcement pipeline latency per step |
| **0** | Actions execute without cryptographic verification |

---

<div align="center">
<i>Built for Apogee '26 -- BITS Pilani</i>
</div>
