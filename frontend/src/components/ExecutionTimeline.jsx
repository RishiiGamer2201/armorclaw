// frontend/src/components/ExecutionTimeline.jsx

import { useState } from "react";
import StatusBadge    from "./StatusBadge";
import ConfidenceGauge from "./ConfidenceGauge";
import ExpertPanel    from "./ExpertPanel";

function StepCard({ step, index }) {
  const [expanded, setExpanded] = useState(true);

  const status = step.status || "pending";
  const animDelay = `${index * 0.08}s`;

  return (
    <div
      className={`step-card ${status}`}
      style={{ animationDelay: animDelay }}
    >
      <div className="step-header" onClick={() => setExpanded((v) => !v)} role="button">
        <div className="step-num">{step.step_id}</div>
        <span className="step-tool">{step.tool}</span>
        <StatusBadge status={status} />
        {step.confidence != null && (
          <span className="step-confidence mono">{(step.confidence * 100).toFixed(0)}%</span>
        )}
        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {expanded && (
        <div className="step-body">
          {step.rationale && (
            <p className="step-rationale">"{step.rationale}"</p>
          )}

          {/* Expert votes */}
          {step.expert_breakdown && step.expert_breakdown.length > 0 && (
            <ExpertPanel breakdown={step.expert_breakdown} />
          )}

          {/* Confidence gauge */}
          {step.confidence != null && (
            <ConfidenceGauge
              confidence={step.confidence}
              breakdown={step.score_breakdown}
            />
          )}

          {/* Block reason */}
          {step.reason && (
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Reason {step.rule && <span style={{ color: "var(--accent)" }}>· {step.rule}</span>}
              </div>
              <div className="step-reason">{step.reason}</div>
            </div>
          )}

          {/* Execution result */}
          {step.result && (
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--green)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Result</div>
              <pre className="step-result">{JSON.stringify(step.result, null, 2)}</pre>
            </div>
          )}

          {/* Error */}
          {step.error && (
            <div className="error-box">{step.error}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExecutionTimeline({ results, loading }) {
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <span>Enforcing intent…</span>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="timeline-empty">
        <div style={{ fontSize: "2rem", marginBottom: 8 }}>🦞</div>
        <div>Submit a financial instruction above to see the enforcement timeline.</div>
        <div style={{ marginTop: 8, fontSize: "0.8rem" }}>
          Every action passes 4 layers: PolicyEngine → MoE Experts → ArmorIQ → Validator
        </div>
      </div>
    );
  }

  return (
    <div className="timeline">
      {results.map((step, i) => (
        <StepCard key={step.step_id ?? i} step={step} index={i} />
      ))}
    </div>
  );
}
