// frontend/src/App.jsx

import { useState } from "react";
import "./index.css";

import CommandInput        from "./components/CommandInput";
import ExecutionTimeline   from "./components/ExecutionTimeline";
import AuditLogTable       from "./components/AuditLogTable";
import ConnectionStatus    from "./components/ConnectionStatus";
import { runAgent }        from "./api/agent";

const TABS = ["Agent", "Audit Log"];

export default function App() {
  const [activeTab, setActiveTab]         = useState("Agent");
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [executionData, setExecutionData] = useState(null);

  const handleSubmit = async (prompt) => {
    setLoading(true);
    setError(null);
    setExecutionData(null);
    try {
      const data = await runAgent(prompt);
      setExecutionData(data);
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Unknown error";
      setError(`Backend error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const stats      = executionData?.stats;
  const results    = executionData?.results ?? [];
  const avgConf    = executionData?.avg_confidence;
  const hasResults = executionData !== null;

  return (
    <div className="app">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-brand">
          <div className="header-logo">🦞</div>
          <div>
            <div className="header-title">ClawShield Finance</div>
            <div className="header-subtitle">Intent-Aware Autonomous Financial Agent</div>
          </div>
        </div>
        <nav className="header-nav">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`nav-btn${activeTab === tab ? " active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Live Connection Status Bar ──────────────────────────────────── */}
      <ConnectionStatus />

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="main">
        {activeTab === "Agent" && (
          <>
            {/* Command Input Card */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">
                  <span>💬</span> Financial Instruction
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  ↵ Enter to submit
                </span>
              </div>
              <div className="card-body">
                <CommandInput onSubmit={handleSubmit} loading={loading} />
              </div>
            </div>

            {/* Error */}
            {error && <div className="error-box">{error}</div>}

            {/* Stats summary */}
            {(hasResults || loading) && (
              <div className="summary-bar">
                <div className="summary-stat stat-allowed">
                  <div className="summary-stat-val">{stats?.allowed ?? "—"}</div>
                  <div className="summary-stat-label">Allowed</div>
                </div>
                <div className="summary-stat stat-blocked">
                  <div className="summary-stat-val">{stats?.blocked ?? "—"}</div>
                  <div className="summary-stat-label">Blocked</div>
                </div>
                <div className="summary-stat stat-errors">
                  <div className="summary-stat-val">{stats?.errors ?? "—"}</div>
                  <div className="summary-stat-label">Errors</div>
                </div>
                <div className="summary-stat stat-total">
                  <div className="summary-stat-val">
                    {avgConf != null ? `${(avgConf * 100).toFixed(0)}%` : "—"}
                  </div>
                  <div className="summary-stat-label">Avg Confidence</div>
                </div>
              </div>
            )}

            {/* Intent banner */}
            {executionData && (
              <div className="intent-banner">
                <div className="intent-icon">🎯</div>
                <div className="intent-text">
                  <div className="intent-label">Detected Intent</div>
                  <div className="intent-value">{executionData.intent}</div>
                  <div className="intent-meta">
                    <span className={`intent-risk ${executionData.risk_level}`}>
                      {executionData.risk_level?.toUpperCase()} RISK
                    </span>
                    {executionData.token_id && (
                      <span className="intent-token">
                        Token: {executionData.token_id.slice(0, 20)}…
                        {" "}({executionData.token_source})
                      </span>
                    )}
                    {executionData.run_id && (
                      <span className="intent-token">
                        Run: {executionData.run_id.slice(0, 8)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Execution Timeline Card */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">
                  <span>⚡</span> Enforcement Timeline
                </span>
                {hasResults && (
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    {stats?.total} step{stats?.total !== 1 ? "s" : ""} · threshold {executionData?.threshold ? `${(executionData.threshold * 100).toFixed(0)}%` : "70%"}
                  </span>
                )}
              </div>
              <div className="card-body" style={{ padding: hasResults ? "16px" : "0" }}>
                <ExecutionTimeline results={results} loading={loading} />
              </div>
            </div>
          </>
        )}

        {activeTab === "Audit Log" && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <span>📋</span> Audit Log
              </span>
            </div>
            <div className="card-body">
              <AuditLogTable />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
