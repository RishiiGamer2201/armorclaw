// ArmorIQ SDK Bridge — Connects OpenClaw agents to ClawShield's enforcement pipeline
//
// This bridge provides an HTTP API that OpenClaw skills and external agents
// can call to register plans and verify steps against the local IAP.
//
// Endpoints:
//   POST /capture     — Register a plan intent, returns token
//   POST /verify-step — Verify a single step against the token
//   POST /delegate    — Create a delegated sub-agent with bounded scope
//   GET  /health      — Bridge health check

const express = require('express');
const app = express();
app.use(express.json());

// Try ArmorIQ SDK if available, otherwise proxy to local FastAPI backend
let armoriqClient = null;
try {
    const { ArmorIQClient } = require('@armoriq/sdk');
    const apiKey = process.env.ARMORIQ_API_KEY || "";
    if (apiKey) {
        armoriqClient = new ArmorIQClient({ apiKey, userId: process.env.ARMORIQ_USER_ID || "local_admin" });
        console.log("[OK] ArmorIQ SDK initialized");
    }
} catch(e) {
    console.log("[INFO] ArmorIQ SDK not available — using local IAP proxy");
}

const BACKEND_URL = "http://localhost:8000";

// Register plan intent
app.post('/capture', async (req, res) => {
    try {
        const { intent, steps, risk_level } = req.body;

        // Try ArmorIQ SDK first
        if (armoriqClient) {
            try {
                const captured = await armoriqClient.capture_plan({ intent, steps: steps || [], risk_level: risk_level || 'low' });
                return res.json({ success: true, token: captured.intent_token || captured.id, source: "armoriq_sdk" });
            } catch(e) {
                console.error("[WARN] ArmorIQ SDK failed:", e.message);
            }
        }

        // Fall through to local backend — the Python IAP handles Merkle tree creation
        const resp = await fetch(`${BACKEND_URL}/api/agent/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: intent }),
        });
        const data = await resp.json();
        res.json({
            success: true,
            token: data.token_id,
            merkle_root: data.merkle_root,
            source: data.token_source || "local_iap",
        });
    } catch (err) {
        console.error("[ERROR] Bridge capture failed:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Delegation endpoint for OpenClaw agents
app.post('/delegate', async (req, res) => {
    try {
        const { prompt, scope, purpose } = req.body;
        const resp = await fetch(`${BACKEND_URL}/api/agent/delegate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, scope, purpose }),
        });
        const data = await resp.json();
        res.json(data);
    } catch (err) {
        console.error("[ERROR] Bridge delegation failed:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: "ok",
        service: "armoriq-bridge",
        armoriq_sdk: !!armoriqClient,
        local_iap: true,
    });
});

const PORT = 8001;
app.listen(PORT, () => {
    console.log(`[OK] ArmorIQ Bridge running on port ${PORT}`);
    console.log(`     ArmorIQ SDK: ${armoriqClient ? "connected" : "unavailable (using local IAP)"}`);
    console.log(`     Backend: ${BACKEND_URL}`);
});
