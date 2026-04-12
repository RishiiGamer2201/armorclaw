<div align="center">

# 🦞 ClawShield Finance 
#### *Intent-Aware Defensive Financial Execution Gateway*

**ArmorIQ x OpenClaw Hackathon — Apogee '26, BITS Pilani**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Integrated-FF4500?style=for-the-badge)](https://openclaw.ai)

<br/>

> *"The future risk isn't AI that refuses to act. It's AI that acts without permission."*

An autonomous financial agent that enforces **strict intent boundaries** at runtime. No action executes without passing both a structured compliance policy check **and** cryptographic ArmorIQ IAP verification. 

</div>

---

## 🎯 What It Does

ClawShield Finance operates on a locally managed SQLite state (or Alpaca simulated markets) and demonstrates that an autonomous agent can:
- Execute external multi-layered operations **only within defined intent boundaries.**
- **Deterministically block** unauthorized trades, compliance violations, and data exfiltration (Zero Trust).
- Produce a full **cryptographically-anchored audit trail** of every allowed and blocked action.

---

## 🌎 10 Universal Financial Features
The newly built Dashboard features a Sidebar seamlessly integrated with 10 universal features powered by the Gemini Vision SDK and SQLite data layer:

1. **Cheque Fraud Scanning:** Gemini Vision extracts payload amounts and assigns a fraud probability score based on visual anomalies.
2. **Wire Transfer Protections:** Dynamically deduces balances and verifies strict spending bounds before SQLite execution.
3. **Generate Corporate limit Cards:** Calculates and injects valid Luhn CC algorithms strictly mapped to authorized roles.
4. **KYC ID Extraction:** Reads physical passport/DL images to natively parse Date of Birth, Name, and strict regulatory validity.
5. **AML Structuring Discovery:** Sweeps execution trails for patterns of sub-reporting money laundering.
6. **Emergency DB Freezes:** A hard operational kill-switch that flags and quarantines accounts across physical logic domains.
7. **Crypto Asset Swaps:** Automatically bridges dual asset valuation models inside secure database transactions.
8. **Vendor Invoice Verification:** Prevents unauthorized payees by mathematically vetting visual invoice PDFs against our strict allowed-vendor dataset.
9. **Transaction Auditing:** Triggers multi-layer standard deviation modeling on user portfolios to flag anomalous routing.
10. **Algorithmic DTI Loan Pricing:** Rapidly maps mathematical debt-to-income models for precise interest routing.

---

## 🏗️ Architecture Stack

```text
User Prompt
    │
    ▼
┌─────────────────────────────────────────────────┐
│  LLM PLANNER (Reasoning Layer)                  │
│  Gemini 2.5 Flash → structured JSON plan        │
│  { intent, riskLevel, steps: [{tool, args}] }   │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│  ARMORIQ IAP (Intent Token Issuance)            │
│  • Registers plan + issues cryptographic token  │
│  • Creates Merkle proofs per step               │
└──────────────┬──────────────────────────────────┘
               │
               ▼  (per step)
┌─────────────────────────────────────────────────┐
│  ENFORCEMENT LAYER (Dual Check — BOTH must pass)│
│                                                 │
│  ① PolicyEngine.enforce(tool, args)             │
│     JSON-driven compliance rules:               │
│     • AML Limits                                │
│     • Wire transfer maximums                    │
│     • Hard-blocking unauthorized queries        │
│                                                 │
│  ② ArmorIQ.verifyStep(tokenId, step)            │
│     • Cryptographic Merkle proof check          │
│     • Intent drift detection                    │
│     • Step matches approved plan                │
│                                                 │
│  BOTH pass → execute  |  Either fails → block   │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│  EXECUTION / SIDE EFFECT LAYER                  │
│  SQLite DB / Alpaca Financial Tools             │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│  AUDIT LOGGER / DASHBOARD RENDERER              │
│  Graphic visualization of output / blocks       │
└─────────────────────────────────────────────────┘
```

### Key Design Principles
- **Fail Closed**: ArmorIQ unreachable → ALL execution-level actions blocked.
- **Reasoning ≠ Execution**: LLM only produces plans, never touches APIs directly.
- **Defense in Depth**: PolicyEngine + ArmorIQ run independently; both must approve.
- **No Hardcoded Logic**: All rules in `policies/financial-policy.json` — data, not code.

---

## 🏎️ Quick Start

### 1. Requirements & Run
```bash
# Terminal 1: Application Backend
cd backend
python -m uvicorn backend.main:app

# Terminal 2: Dashboard Frontend
cd frontend
npm run dev

# Terminal 3: OpenClaw Core
openclaw gateway --port 18789 --verbose

# Terminal 4: ArmorIQ Bridge (Optional telemetry)
cd backend
node armoriq_bridge.js
```

### 2. View The Interface
Open your browser to `http://localhost:5173` to interact with the GUI, the Live Audit Log, and the Telemetry pipeline.

<div align="center">
  <i>Built for Apogee '26 — BITS Pilani</i>
</div>
