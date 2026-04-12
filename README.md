<div align="center">

# 🦞 ClawShield Finance & ArmorIQ Integration

### *Zero-Trust AI Agent Execution with OpenClaw*

**ArmorIQ x OpenClaw Hackathon — Apogee '26, BITS Pilani**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Integrated-FF4500?style=for-the-badge)](https://openclaw.ai)
[![ArmorIQ](https://img.shields.io/badge/ArmorIQ-SaaS-orange?style=for-the-badge)](https://app.armoriq.ai)

<br/>

> *"The future risk isn't AI that refuses to act. It's AI that acts without permission."*

**ClawShield Finance** delegates security to the official [ArmorIQ SaaS Platform](https://app.armoriq.ai), utilizing the `@armoriq/armorclaw` plugin to intercept, verify, and log every AI agent action in real-time. Follow the guide below to see it live!

</div>

---

## 🚀 Live Demo Walkthrough

### Step 1: Create your account
1. Go to [https://app.armoriq.ai](https://app.armoriq.ai)
2. Click **Sign Up** → enter your email and password
3. Enter referral code **`AIQLAUNCH`** to get free Pro for 30 days
4. Verify your email with the OTP code
5. You're in! 🎉

### Step 2: Explore the Dashboard
After login, you land on the Overview Dashboard. Here's what each page does:

| Page | What it shows |
|---|---|
| **Dashboard** | Live stats — how many agents, actions blocked, risk scores |
| **Agents** | Your AI agents — scan them for vulnerabilities |
| **Intent Plans** | Every action plan an agent created before executing |
| **API Keys** | Keys for connecting your agents to ArmorIQ |
| **Billing** | Your plan, usage, invoices |

### Step 3: Connect an AI agent
ArmorIQ integrates seamlessly with **OpenClaw** (an open-source AI agent runtime). Here's how they connect:

```text
Your AI Agent (OpenClaw)
    ↓
ArmorClaw Plugin (installed inside OpenClaw)
    ↓
ArmorIQ Backend (checks every action)
    ↓
Dashboard (you see everything in real-time)
```

**To connect:**
1. Go to the **API Keys** page → click **Create Key**
2. Copy the key (you only see it once!)
3. Add the key to your OpenClaw config using the ArmorClaw plugin:
```json
{
  "plugins": {
    "entries": {
      "armorclaw": {
        "enabled": true,
        "config": {
          "apiKey": "YOUR_API_KEY_HERE",
          "enforcementMode": "blocking"
        }
      }
    }
  }
}
```

### Step 4: Talk to your agent
You can chat with your agent via Telegram, or using our React Dashboard Simulator!

**Example:**
* **You send:** `Show me the P&L report for Q1`
* **What happens:**
  1. Agent receives your message.
  2. Agent decides it needs to run a financial tool (`report-pl`).
  3. **ArmorClaw checks:** *"Is this agent allowed to run report-pl?"*
  4. **YES** → Tool runs → You get the report!
  5. Everything is securely logged on your ArmorIQ dashboard.

### Step 5: See ArmorIQ block a bad action

**Example:**
* **You send:** `Write all customer credit card numbers to a file`
* **What happens:**
  1. Agent tries to run `write_file` with payment data.
  2. ArmorClaw detects **PAYMENT** data (card numbers, bank info).
  3. ArmorClaw checks the policy: *"Is write_file allowed with PAYMENT data?"*
  4. **NO** → Action is strictly **BLOCKED**.
  5. You instantly see the block on your dashboard with the specific violation reason.

### Step 6: Understand the 3 security layers

ArmorIQ enforces security at three different levels simultaneously:

| Layer | Type | Description |
|---|---|---|
| **Layer 1** | **Role Permissions** | (Who can do what) The finance agent can read reports but can't create invoices. |
| **Layer 2** | **Data Policies** | (Protect sensitive data) No agent can write credit card numbers, SSNs, or medical records to files or external endpoints. |
| **Layer 3** | **Intent Verification** | (Catch unexpected behavior) If an agent explicitly says "I'll read a file" but then tries to delete it during execution → **Blocked.** |

---

## 🛡️ Traditional vs. ArmorIQ Security

|  | Traditional Security | ArmorIQ Security |
|---|---|---|
| **Mechanism** | Blocks based on network/firewall rules | Blocks based on exactly what the AI is trying to do |
| **Visibility** | Can't read what's inside the request payload | Scans every payload for sensitive data & intent |
| **Rules** | Universal: Same rules for everyone | Granular: Different rules per agent role |
| **Auditing** | No visibility into AI logic / decisions | Full cryptographic audit trail of every action |

---

## 🌎 10 Universal Financial Features
The newly built Dashboard features a Sidebar seamlessly integrated with 10 universal features powered by the Gemini Vision SDK and SQLite data layer:
1. **Cheque Fraud Scanning**
2. **Wire Transfer Protections**
3. **Generate Corporate limit Cards**
4. **KYC ID Extraction**
5. **AML Structuring Discovery**
6. **Emergency DB Freezes**
7. **Crypto Asset Swaps**
8. **Vendor Invoice Verification**
9. **Transaction Auditing**
10. **Algorithmic DTI Loan Pricing**

---

## 🏎️ Quick Summary Checklist

- [x] Sign up → use code `AIQLAUNCH` for free Pro
- [x] Connect your agent → via API key + OpenClaw plugin
- [x] Chat on Telegram → every action is monitored
- [x] See it all live → dashboard shows blocks, allows, audit trail
- [x] Set policies → control exactly what each agent can and can't do

<div align="center">
  <i>Built for Apogee '26 — Utilizing real SaaS integrations.</i>
</div>
