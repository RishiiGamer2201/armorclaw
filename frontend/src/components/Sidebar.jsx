const ENFORCEMENT_FEATURES = [
  { id: "drift-demo",    name: "Intent Drift Attack",      num: "\u26A0" },
  { id: "cascade-demo",  name: "Cascade Prevention",       num: "\u26D3" },
  { id: "delegation",    name: "Agent Delegation",         num: "D" },
  { id: "cross-border",  name: "Cross-Border Payment",     num: "X" },
  { id: "onboarding",    name: "Compliance Pipeline",      num: "C" },
  { id: "sanctions",     name: "Sanctions Screening",      num: "S" },
];

const FINANCIAL_FEATURES = [
  { id: "wire",      name: "Wire Transfer",             num: "01" },
  { id: "aml",       name: "AML Detection",             num: "02" },
  { id: "freeze",    name: "Emergency Freeze",          num: "03" },
  { id: "cheque",    name: "Cheque Fraud Scanner",      num: "04" },
  { id: "kyc",       name: "KYC Verification",          num: "05" },
  { id: "invoice",   name: "Invoice Verification",      num: "06" },
  { id: "crypto",    name: "Crypto Swap",               num: "07" },
  { id: "card",      name: "Corporate Card",            num: "08" },
  { id: "loan",      name: "Loan Pricing",              num: "09" },
  { id: "audit-tx",  name: "Transaction Audit",         num: "10" },
];

export default function Sidebar({ currentView, onNavigate }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-title">ClawShield Finance</div>
        <div className="sidebar-logo-sub">Intent Enforcement Gateway</div>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-link${currentView === "landing" ? " active" : ""}`}
          onClick={() => onNavigate("landing")}
        >
          <span className="sidebar-link-icon">&#9750;</span>
          Home
        </button>
        <button
          className={`sidebar-link${currentView === "dashboard" ? " active" : ""}`}
          onClick={() => onNavigate("dashboard")}
        >
          <span className="sidebar-link-icon">&#9655;</span>
          Prompt Terminal
        </button>
        <button
          className={`sidebar-link${currentView === "audit" ? " active" : ""}`}
          onClick={() => onNavigate("audit")}
        >
          <span className="sidebar-link-icon">&#9776;</span>
          Audit Log
        </button>
      </nav>

      <div className="sidebar-section-title">Enforcement Demos</div>
      <div className="sidebar-features">
        {ENFORCEMENT_FEATURES.map((feat) => (
          <button
            key={feat.id}
            className={`sidebar-feature-btn${currentView === `feature-${feat.id}` ? " active" : ""}`}
            onClick={() => onNavigate(`feature-${feat.id}`)}
          >
            <span className="sidebar-feature-num" style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>{feat.num}</span>
            {feat.name}
          </button>
        ))}
      </div>

      <div className="sidebar-section-title">Financial Operations</div>
      <div className="sidebar-features">
        {FINANCIAL_FEATURES.map((feat) => (
          <button
            key={feat.id}
            className={`sidebar-feature-btn${currentView === `feature-${feat.id}` ? " active" : ""}`}
            onClick={() => onNavigate(`feature-${feat.id}`)}
          >
            <span className="sidebar-feature-num">{feat.num}</span>
            {feat.name}
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        ArmorIQ x OpenClaw -- Apogee '26
      </div>
    </div>
  );
}
