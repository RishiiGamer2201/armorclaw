import React from "react";

const FEATURES = [
  {
    title: "Cheque Fraud Analysis",
    description: "Utilizes Gemini Vision to scan written amounts and evaluate visual fraud markers.",
    icon: "SCAN"
  },
  {
    title: "Wire Transfer Protection",
    description: "Dynamically intercepts outgoing wires, verifying SQLite balances and policy limits.",
    icon: "WIRE"
  },
  {
    title: "Dynamic Card Generation",
    description: "Issues compliant corporate limits using Luhn algorithm generation.",
    icon: "CARD"
  },
  {
    title: "KYC Image Verification",
    description: "Extracts identity documentation using Vision models to approve onboarding.",
    icon: "KYC"
  },
  {
    title: "AML Structuring Detection",
    description: "Identifies rapid sub-threshold payments indicative of money laundering.",
    icon: "AML"
  },
  {
    title: "Compromised Funds Killswitch",
    description: "Emergency protocol that freezes physical accounts instantly upon detection.",
    icon: "LOCK"
  },
  {
    title: "Crypto Splitting",
    description: "Executes multi-asset swaps and mechanically updates wallet balances.",
    icon: "SWAP"
  },
  {
    title: "Invoice Matching",
    description: "Scans uploaded vendor invoices and strictly verifies them against approved SQL whitelists.",
    icon: "BILL"
  },
  {
    title: "Audit & Anomaly Detection",
    description: "Calculates standard deviation on spending to flag highly anomalous payments.",
    icon: "AUDIT"
  },
  {
    title: "Automated DTI Loan Pricing",
    description: "Calculates algorithmic Decision Trees for Debt to Income credit scoring.",
    icon: "LOAN"
  }
];

export default function LandingPage({ onLaunchDashboard }) {
  return (
    <div className="landing-container">
      <div className="landing-content">
        <header className="landing-hero">
          <div className="landing-badge">ArmorIQ x OpenClaw Integration</div>
          <h1 className="landing-title">Universal Financial Security Engine</h1>
          <p className="landing-subtitle">
            A zero-trust execution gateway intercepting LLM tool calls. No action occurs without absolute deterministic verification.
          </p>
          <button className="launch-btn" onClick={onLaunchDashboard}>
            Launch Mission Control
          </button>
        </header>

        <section className="features-grid">
          {FEATURES.map((feat, idx) => (
            <div key={idx} className="feature-card">
              <div className="feature-icon-wrapper">
                <span className="feature-icon-text">{feat.icon}</span>
              </div>
              <h3 className="feature-card-title">{feat.title}</h3>
              <p className="feature-card-desc">{feat.description}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
