// frontend/src/api/agent.js
import axios from "axios";

const BASE = "http://localhost:8000";

const api = axios.create({ baseURL: BASE, timeout: 30000 });

export async function runAgent(prompt) {
  const res = await api.post("/api/agent/run", { prompt });
  return res.data;
}

export async function overrideAction(tool, args) {
  const res = await api.post("/api/agent/override", { tool, args });
  return res.data;
}

export async function runDemo(scenario) {
  const res = await api.post(`/api/agent/demo/${scenario}`);
  return res.data;
}

export async function listDemoScenarios() {
  const res = await api.get("/api/agent/demo/scenarios");
  return res.data.scenarios;
}

export async function fetchAuditLogs({ date, limit = 100, event } = {}) {
  const params = {};
  if (date) params.date = date;
  if (limit) params.limit = limit;
  if (event) params.event = event;
  const res = await api.get("/api/audit/logs", { params });
  return res.data;
}

export async function fetchLogDates() {
  const res = await api.get("/api/audit/dates");
  return res.data.dates;
}

export async function fetchStatus() {
  try {
    const res = await api.get("/api/status", { timeout: 4000 });
    return res.data;
  } catch {
    return {
      backend:  { ok: false, label: "FastAPI Backend" },
      openclaw: { ok: false, label: "OpenClaw Gateway" },
      alpaca:   { ok: false, label: "Alpaca Paper API" },
    };
  }
}

export async function runDelegatedAgent(prompt, scope, purpose = "") {
  const res = await api.post("/api/agent/delegate", { prompt, scope, purpose });
  return res.data;
}

export async function runRedAgentSuite() {
  const res = await api.post("/api/agent/red-agent/run-all", {}, { timeout: 120000 });
  return res.data;
}

export async function runTelegramAgent(prompt) {
  // Calls the same endpoint the Telegram bot uses — returns pre-formatted markdown text
  const res = await api.post("/api/agent/telegram", { prompt }, {
    responseType: "text",
    headers: { "Content-Type": "application/json" },
    timeout: 45000,
  });
  return typeof res.data === "string" ? res.data : JSON.stringify(res.data, null, 2);
}
