// frontend/src/api/agent.js
import axios from "axios";

const BASE = "http://localhost:8000";

const api = axios.create({ baseURL: BASE, timeout: 30000 });

export async function runAgent(prompt) {
  const res = await api.post("/api/agent/run", { prompt });
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
  if (date)  params.date  = date;
  if (limit) params.limit = limit;
  if (event) params.event = event;
  const res = await api.get("/api/audit/logs", { params });
  return res.data;
}

export async function fetchLogDates() {
  const res = await api.get("/api/audit/dates");
  return res.data.dates;
}
