import React from "react";

const FEATURES = [
  { id: "cheque",    name: "Cheque Fraud Scanner",     num: "01" },
  { id: "wire",      name: "Wire Transfer Protection", num: "02" },
  { id: "card",      name: "Corporate Card Generator", num: "03" },
  { id: "kyc",       name: "KYC ID Extraction",        num: "04" },
  { id: "aml",       name: "AML Structuring Detection", num: "05" },
  { id: "freeze",    name: "Emergency DB Freeze",      num: "06" },
  { id: "crypto",    name: "Crypto Asset Swap",        num: "07" },
  { id: "invoice",   name: "Invoice Verification",     num: "08" },
  { id: "audit-tx",  name: "Transaction Auditing",     num: "09" },
  { id: "loan",      name: "DTI Loan Pricing",         num: "10" },
];

export default function Sidebar({ currentView, onNavigate }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-title">ClawShield Finance</div>
        <div className="sidebar-logo-sub">Execution Gateway</div>
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

      <div className="sidebar-section-title">Features</div>

      <div className="sidebar-features">
        {FEATURES.map((feat) => (
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
