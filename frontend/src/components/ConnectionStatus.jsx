// frontend/src/components/ConnectionStatus.jsx
// Live status pill strip — polls /api/status every 8s
// Shows: FastAPI Backend · OpenClaw Gateway · Alpaca Paper API

import { useState, useEffect, useCallback } from "react";
import { fetchStatus } from "../api/agent";

const SERVICE_META = {
  backend:  { icon: "⚡", label: "Backend"  },
  openclaw: { icon: "🦞", label: "OpenClaw" },
  alpaca:   { icon: "📈", label: "Alpaca"   },
};

function Dot({ ok }) {
  return (
    <span
      style={{
        width: 7, height: 7,
        borderRadius: "50%",
        display: "inline-block",
        background: ok ? "var(--green)" : "var(--red)",
        boxShadow: ok
          ? "0 0 6px hsla(145,70%,50%,0.7)"
          : "0 0 6px hsla(0,75%,58%,0.5)",
        flexShrink: 0,
        animation: ok ? "glow 2.4s ease infinite" : "none",
      }}
    />
  );
}

export default function ConnectionStatus() {
  const [status, setStatus] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const check = useCallback(async () => {
    const data = await fetchStatus();
    setStatus(data);
    setLastChecked(new Date());
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, 8000);
    return () => clearInterval(id);
  }, [check]);

  if (!status) return null;

  const allOk = Object.values(status).every((s) => s.ok);
  const anyDown = Object.values(status).some((s) => !s.ok);

  return (
    <div className="conn-status-strip">
      {/* Overall indicator */}
      <span className={`conn-overall ${allOk ? "all-ok" : anyDown ? "some-down" : ""}`}>
        {allOk ? "● All Systems Up" : "● Partial"}
      </span>

      <span className="conn-divider" />

      {/* Per-service pills */}
      {Object.entries(SERVICE_META).map(([key, meta]) => {
        const svc = status[key];
        const ok  = svc?.ok ?? false;
        return (
          <span key={key} className={`conn-pill ${ok ? "conn-ok" : "conn-down"}`}>
            <Dot ok={ok} />
            <span>{meta.icon} {meta.label}</span>
          </span>
        );
      })}

      {/* OpenClaw hint if down */}
      {!status?.openclaw?.ok && (
        <span className="conn-hint">
          Run: <code>openclaw gateway</code>
        </span>
      )}

      {lastChecked && (
        <span className="conn-ts">
          {lastChecked.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      )}
    </div>
  );
}
