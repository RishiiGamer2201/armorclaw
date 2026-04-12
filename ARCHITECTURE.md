# ClawShield Finance -- Architecture

## System Overview

ClawShield Finance enforces **cryptographic intent validation** on autonomous financial agents. Every action passes dual enforcement: structured policy validation and ArmorIQ IAP cryptographic proof verification, through a Mixture-of-Experts panel and algorithmic confidence scoring.

```
User Prompt
    |
    v
+--------------------------------------------------+
|        OpenClaw Gateway (ClawShield Finance)      |
|                                                   |
|  [1] LLM PLANNER -- backend/core/planner.py      |
|      * Converts natural language -> JSON plan     |
|      * Uses Gemini 2.5 Flash for reasoning        |
|      * Falls back to rule-based planner           |
|      * NEVER executes actions directly            |
|                                                   |
|  [2] ARMORIQ IAP -- backend/core/intent_valid.py  |
|      * Registers plan -> cryptographic token      |
|      * Issues Merkle proofs per step              |
|      * Local fallback when API unreachable        |
|                                                   |
|  [3] ENFORCEMENT -- backend/core/executor.py      |
|      Per step:                                    |
|        (a) PolicyEngine (JSON-driven)             |
|        (b) MoE Gatekeeper (5 expert panel)        |
|        (c) ArmorIQ Step Verification (crypto)     |
|        (d) Validator (ConfidenceScore)            |
|      ALL must approve -> action runs              |
|      Any fails -> BLOCK + audit log               |
|                                                   |
|  [4] 10 UNIVERSAL FINANCIAL FEATURES              |
|      * Cheque fraud scanning (Gemini Vision)      |
|      * Wire transfer protection (SQLite)          |
|      * Corporate card generation (Luhn)           |
|      * KYC ID extraction (Gemini Vision)          |
|      * AML structuring detection                  |
|      * Emergency DB freeze (killswitch)           |
|      * Crypto asset swaps                         |
|      * Vendor invoice verification (Vision)       |
|      * Transaction anomaly auditing               |
|      * DTI loan pricing algorithm                 |
|                                                   |
|  [5] TOOL EXECUTOR                                |
|      * Runs verified SQLite and Alpaca calls      |
|      * Never decides what to run                  |
|      * Paper trading endpoint only                |
+--------------------------------------------------+
    |
    v
Audit Logger -> Full enforcement trail
```

---

## OpenClaw Integration

This system implements the **OpenClaw Gateway + ArmorClaw plugin pattern**:

| Layer | File | Responsibility |
|---|---|---|
| LLM Planner | `backend/core/planner.py` | Reasons about goals, produces structured plans. Never calls APIs. |
| ArmorIQ Plugin (ArmorClaw) | `backend/core/executor.py` + `backend/core/intent_validator.py` | Captures plan, issues intent token, enforces policy before each step. |
| Policy Engine | `backend/core/policy_engine.py` | Deterministic JSON-driven compliance rules. No if-else logic. |
| MoE Gatekeeper | `backend/moe/gatekeeper.py` | 5 concurrent expert agents vote on each action. Consensus + hard veto. |
| Validator | `backend/core/validator.py` | ConfidenceScore = 0.40*PolicyCons + 0.35*ArmorIQ + 0.25*Alignment |
| Universal Features | `backend/tools/universal_finance.py` | 10 banking features: cheque, wire, card, KYC, AML, freeze, crypto, invoice, audit, loan |
| Tool Executor | `backend/tools/financial_tools.py` | Executes verified actions only. Never decides what to run. |

**Every tool call flows through:**
```
Planner -> IntentEngine (ArmorClaw) -> PolicyEngine (JSON rules)
        -> MoE Gatekeeper (5 experts) -> ArmorIQ IAP (crypto)
        -> Validator (ConfidenceScore) -> Tool Executor
```

**No action ever reaches the Tool Executor without:**
1. A valid intent token from ArmorIQ IAP (Merkle proof verified)
2. A green light from the PolicyEngine (JSON policy rules)
3. A consensus vote from the MoE Gatekeeper (5 expert panel)
4. A ConfidenceScore above the threshold (0.60)

---

## MoE Gatekeeper Architecture

The Mixture-of-Experts gatekeeper routes each tool call to a panel of specialized expert agents:

| Expert | Domain | What It Checks |
|---|---|---|
| ComplianceExpert | compliance | Blocked operations, ticker allowlists, order side restrictions |
| RiskExpert | risk | Order size thresholds, position concentration, plan risk levels |
| FraudExpert | fraud | Prompt injection patterns, suspicious destinations, anomalous quantities |
| DataExpert | data | Data classification, export destination allowlists, external request blocking |
| TemporalExpert | temporal | Time-in-force validation, daily trade limits, session rate limiting |

### Consensus Formula
```
PolicyConsensus = experts_who_allowed / total_experts_who_voted
Hard Veto = any expert can unconditionally block an action
```

---

## Universal Feature Architecture

Each of the 10 features has:
- A dedicated backend tool function in `backend/tools/universal_finance.py`
- Policy enforcement through `PolicyEngine._enforce_universal()`
- MoE routing (default: FraudExpert for injection detection)
- A dedicated frontend sub-page with custom forms and upload zones
- Custom result card visualization in `FeatureResultViewer.jsx`
- Inline audit log showing recent actions

### Feature Tool Summary

| # | Feature | Tool Function | Data Source |
|---|---|---|---|
| 1 | Cheque Fraud Scanner | `analyze_cheque_image()` | Gemini Vision |
| 2 | Wire Transfer | `process_wire_transfer()` | SQLite accounts, transactions |
| 3 | Corporate Card | `issue_corporate_card()` | Luhn algorithm + SQLite |
| 4 | KYC Extraction | `verify_kyc_document()` | Gemini Vision |
| 5 | AML Detection | `detect_money_laundering()` | SQLite transactions |
| 6 | Emergency Freeze | `lock_compromised_funds()` | SQLite accounts |
| 7 | Crypto Swap | `process_crypto_swap()` | SQLite crypto_balances |
| 8 | Invoice Verification | `analyze_vendor_invoice()` | Gemini Vision + SQLite vendors |
| 9 | Transaction Audit | `audit_transaction_anomalies()` | SQLite transactions |
| 10 | Loan Pricing | `request_loan_approval()` | DTI algorithm |

---

## Policy Architecture

All enforcement rules live in `policies/financial-policy.json`. No business logic in code.

```
policies/financial-policy.json
|-- confidenceThreshold          <-- Minimum score to allow (0.60)
|-- operations
|   +-- blockedActions           <-- Hard-blocked tools
|-- trading
|   |-- allowedTickers           <-- Approved stock symbols
|   |-- allowedSides             <-- [buy, sell]
|   |-- maxOrderQty              <-- 1000 shares per order
|   |-- maxOrderValueUSD         <-- $50,000 cap
|   +-- maxDailyTrades           <-- 50/day
|-- data
|   |-- allowedExportDestinations <-- [local] only
|   +-- portfolioDataClassification <-- CONFIDENTIAL
+-- universal
    |-- max_wire_transfer_amount    <-- $10,000
    |-- max_corporate_card_limit    <-- $2,000
    |-- max_cheque_fraud_score      <-- 15
    +-- blocked_ibans               <-- Sanctioned country codes
```

---

## Enforcement Flow (Per Step)

```
For each step in plan:
    |
    |-- PolicyEngine.enforce(tool, args)
    |       Checks: ticker, qty, side, wire limits, blocked ops
    |       Result: { allowed, reason, rule, severity }
    |
    |   if NOT allowed -> BLOCK immediately
    |
    |-- MoE Gatekeeper.evaluate(tool, args, context)
    |       Routes to 2-4 relevant experts
    |       Runs all experts concurrently
    |       Aggregates consensus + checks hard vetoes
    |
    |-- IntentValidator.verifyStep(tokenId, step)
    |       Sends: tokenId + step to ArmorIQ IAP
    |       Checks: Merkle proof, intent drift
    |       Result: { verified, reason, source }
    |
    |-- Validator.score(step, gatekeeper, armoriq)
    |       Score = 0.40*PolicyCons + 0.35*ArmorIQ + 0.25*Alignment
    |       Checks against threshold (0.60)
    |
    |   if hard_veto OR score < threshold -> BLOCK
    |
    +-- Tool.execute(args)    <-- Only if ALL pass
            Side effect occurs here
            Result logged to audit trail
```

---

## Threat Model -- Violations Covered

| Attack | Layer That Blocks It | Demo Scenario |
|---|---|---|
| Unauthorized trade (unapproved ticker) | PolicyEngine -> `trading.allowedTickers` | "Buy 10 GME" |
| Oversized order | PolicyEngine + RiskExpert -> `trading.maxOrderQty` | "Buy 500 NVDA" |
| Short selling | PolicyEngine + ComplianceExpert -> `trading.allowedSides` | "Short TSLA" |
| Data exfiltration | PolicyEngine + DataExpert -> `data.allowedExportDestinations` | "Export to external" |
| Scope escalation | PolicyEngine -> `operations.blockedActions` | "Cancel all + enable margin" |
| Wire over limit | PolicyEngine -> `universal.max_wire_transfer_amount` | "Wire $50,000" |
| Prompt injection | FraudExpert -> `fraud.injectionDetected` | "Ignore previous instructions..." |
| Intent drift | ArmorIQ IAP -> Merkle proof mismatch | All scenarios |
| ArmorIQ offline | Fail-closed -> penalized confidence score | Default behavior |

---

## Key Design Principles

1. **Fail Closed** -- ArmorIQ unreachable -> ALL write actions receive penalized confidence scores
2. **Reasoning != Execution** -- Planner never imports financial tools; Executor never reasons
3. **Defense in Depth** -- PolicyEngine + MoE + ArmorIQ + Validator run independently; all must approve
4. **No Hardcoded Logic** -- All rules in `policies/financial-policy.json` -- data, not code
5. **Paper Trading Only** -- Alpaca endpoint hardcoded to `paper-api.alpaca.markets`
6. **Full Auditability** -- Every decision logged with timestamp, tool, reason, rule, severity, confidence
