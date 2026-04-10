// frontend/src/components/AuditLogTable.jsx

import { useState, useEffect } from "react";
import { fetchAuditLogs } from "../api/agent";
import StatusBadge from "./StatusBadge";

const EVENT_FILTERS = [
  { label: "All",       value: null },
  { label: "Allowed",   value: "STEP_ALLOWED" },
  { label: "Blocked",   value: "STEP_BLOCKED" },
  { label: "Executed",  value: "STEP_EXECUTED" },
  { label: "Errors",    value: "STEP_ERROR" },
  { label: "Plans",     value: "PLAN_CREATED" },
];

function eventToStatus(event) {
  if (!event) return "pending";
  if (event.includes("ALLOWED") || event.includes("EXECUTED")) return "executed";
  if (event.includes("BLOCKED")) return "blocked";
  if (event.includes("ERROR"))   return "error";
  return "pending";
}

function fmtTime(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return ts;
  }
}

export default function AuditLogTable() {
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [eventFilter, setEventFilter] = useState(null);
  const [error, setError]       = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLogs({ limit: 100, event: eventFilter || undefined });
      setEntries(data.entries || []);
    } catch (err) {
      setError("Could not load audit logs — is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [eventFilter]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="audit-filter-row">
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "center", marginRight: 4 }}>Filter:</span>
        {EVENT_FILTERS.map((f) => (
          <button
            key={f.label}
            className={`filter-btn${eventFilter === f.value ? " active" : ""}`}
            onClick={() => setEventFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
        <button className="filter-btn" onClick={load} style={{ marginLeft: "auto" }}>
          ↻ Refresh
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="loading-overlay" style={{ padding: 24 }}>
          <div className="spinner" />
        </div>
      ) : entries.length === 0 ? (
        <div className="timeline-empty" style={{ padding: 32 }}>
          <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>📋</div>
          <div>No audit entries yet — run a command to generate logs.</div>
        </div>
      ) : (
        <div className="audit-table-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Tool</th>
                <th>Status</th>
                <th>Rule / Reason</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i}>
                  <td>{fmtTime(e.timestamp)}</td>
                  <td className="mono" style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{e.event}</td>
                  <td className="tool-col">{e.tool || e.intent?.slice(0, 30) || "—"}</td>
                  <td><StatusBadge status={eventToStatus(e.event)} /></td>
                  <td className="reason-col" title={e.reason || e.rule || ""}>
                    {e.rule ? <span style={{ color: "var(--accent)" }}>{e.rule}</span> : ""}
                    {e.reason ? ` — ${e.reason}` : ""}
                    {!e.rule && !e.reason ? "—" : ""}
                  </td>
                  <td className="mono">
                    {e.confidenceScore != null
                      ? <span style={{ color: e.confidenceScore >= 0.7 ? "var(--green)" : "var(--red)" }}>
                          {(e.confidenceScore * 100).toFixed(0)}%
                        </span>
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
