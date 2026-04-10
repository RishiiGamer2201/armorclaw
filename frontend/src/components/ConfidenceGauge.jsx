// frontend/src/components/ConfidenceGauge.jsx

function getColor(score) {
  if (score === null || score === undefined) return "var(--text-muted)";
  if (score >= 0.7) return "var(--green)";
  if (score >= 0.4) return "var(--orange)";
  return "var(--red)";
}

function pct(val) {
  if (val === null || val === undefined) return "--";
  return `${(val * 100).toFixed(0)}%`;
}

export default function ConfidenceGauge({ confidence, breakdown }) {
  const color     = getColor(confidence);
  const fillWidth = confidence != null ? `${Math.max(0, Math.min(100, confidence * 100))}%` : "0%";

  return (
    <div className="confidence-gauge">
      <div className="gauge-header">
        <span className="gauge-label">Confidence Score</span>
        <span className="gauge-value" style={{ color }}>{pct(confidence)}</span>
      </div>
      <div className="gauge-bar-track">
        <div
          className="gauge-bar-fill"
          style={{ width: fillWidth, background: color }}
        />
      </div>
      {breakdown && (
        <div className="breakdown-row">
          <div className="breakdown-item">
            <div className="breakdown-item-label">Policy</div>
            <div className="breakdown-item-val">{pct(breakdown.policy_cons)}</div>
          </div>
          <div className="breakdown-item">
            <div className="breakdown-item-label">ArmorIQ</div>
            <div className="breakdown-item-val">{pct(breakdown.armoriq_proof)}</div>
          </div>
          <div className="breakdown-item">
            <div className="breakdown-item-label">Intent</div>
            <div className="breakdown-item-val">{pct(breakdown.alignment)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
