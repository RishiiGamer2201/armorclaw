// frontend/src/components/ExpertPanel.jsx

const EXPERT_ICONS = {
  ComplianceExpert: "⚖️",
  RiskExpert:       "📊",
  FraudExpert:      "🔍",
  DataExpert:       "🗄️",
  TemporalExpert:   "⏰",
};

function shortName(name) {
  return name.replace("Expert", "");
}

export default function ExpertPanel({ breakdown }) {
  if (!breakdown || breakdown.length === 0) return null;

  return (
    <div className="expert-panel">
      {breakdown
        .filter((e) => !e.abstained)
        .map((expert, i) => {
          const isVeto = expert.hardVeto;
          const cls = isVeto ? "veto" : expert.allowed ? "allowed" : "blocked";
          return (
            <span
              key={i}
              className={`expert-badge ${cls}`}
              title={expert.reason || ""}
            >
              {EXPERT_ICONS[expert.expert] || "🤖"}{" "}
              {shortName(expert.expert)}{" "}
              {expert.allowed ? "✓" : "✗"}
              {isVeto && " 🔴"}
            </span>
          );
        })}
    </div>
  );
}
