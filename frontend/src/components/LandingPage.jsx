import React from "react";

const FEATURES = [
  {
    title: "Cheque Fraud Analysis",
    description: "Gemini Vision scans written amounts and evaluates visual fraud markers on physical cheques.",
    icon: "SCAN"
  },
  {
    title: "Wire Transfer Protection",
    description: "Dynamically intercepts outgoing wires, verifying SQLite balances and policy limits before execution.",
    icon: "WIRE"
  },
  {
    title: "Dynamic Card Generation",
    description: "Issues compliant corporate cards using Luhn algorithm generation mapped to authorized roles.",
    icon: "CARD"
  },
  {
    title: "KYC Image Verification",
    description: "Extracts identity documentation using Vision models to approve onboarding workflows.",
    icon: "KYC"
  },
  {
    title: "AML Structuring Detection",
    description: "Identifies rapid sub-threshold payments indicative of structured money laundering.",
    icon: "AML"
  },
  {
    title: "Compromised Funds Killswitch",
    description: "Emergency protocol that freezes physical accounts instantly upon detection of a breach.",
    icon: "LOCK"
  },
  {
    title: "Crypto Asset Splitting",
    description: "Executes multi-asset swaps and mechanically updates dual wallet balances.",
    icon: "SWAP"
  },
  {
    title: "Invoice Matching",
    description: "Scans uploaded vendor invoices and strictly verifies them against approved SQL whitelists.",
    icon: "BILL"
  },
  {
    title: "Audit and Anomaly Detection",
    description: "Calculates standard deviation on spending to flag highly anomalous payments.",
    icon: "AUDIT"
  },
  {
    title: "Automated DTI Loan Pricing",
    description: "Calculates algorithmic decision trees for Debt-to-Income credit scoring.",
    icon: "LOAN"
  }
];

const PIPELINE = [
  { num: "1", title: "LLM Planner", desc: "Gemini 2.5 Flash converts your prompt into a structured JSON execution plan" },
  { num: "2", title: "MoE Gatekeeper", desc: "5 expert agents (Compliance, Risk, Fraud, Data, Temporal) vote on each action" },
  { num: "3", title: "Policy Engine", desc: "Deterministic JSON-driven rules check tickers, limits, blocked operations" },
  { num: "4", title: "Execute or Block", desc: "Only actions passing all layers execute. Everything else is blocked and logged" },
];

export default function LandingPage({ onLaunchDashboard }) {
  return (
    <div className="landing-container">
      <div className="landing-top-bar">
        <div className="landing-top-logo">ClawShield Finance</div>
        <button className="launch-btn" onClick={onLaunchDashboard} style={{ padding: "10px 24px", fontSize: "0.88rem" }}>
          Launch Dashboard
        </button>
      </div>

      <header className="landing-hero">
        <div className="landing-badge">ArmorIQ x OpenClaw Integration</div>
        <h1 className="landing-title">Universal Financial Security Engine</h1>
        <p className="landing-subtitle">
          A zero-trust execution gateway intercepting LLM tool calls.
          No action occurs without absolute deterministic verification
          through four independent enforcement layers.
        </p>
        <button className="launch-btn" onClick={onLaunchDashboard}>
          Launch Mission Control
        </button>
      </header>

      {/* How It Works */}
      <section className="landing-section">
        <h2 className="landing-section-title">How It Works</h2>
        <p className="landing-section-desc">
          Every prompt passes through four independent enforcement layers before any financial action executes.
        </p>
        <div className="pipeline-steps">
          {PIPELINE.map((step, idx) => (
            <React.Fragment key={step.num}>
              {idx > 0 && <div className="pipeline-arrow">&#8594;</div>}
              <div className="pipeline-step">
                <div className="pipeline-step-num">{step.num}</div>
                <div className="pipeline-step-title">{step.title}</div>
                <div className="pipeline-step-desc">{step.desc}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="landing-section" style={{ paddingTop: 0 }}>
        <h2 className="landing-section-title">10 Universal Financial Features</h2>
        <p className="landing-section-desc">
          Powered by Gemini Vision SDK and SQLite data layer. Each feature has a dedicated page with custom forms and result visualizations.
        </p>
      </section>
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

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "48px 24px", color: "#94a3b8", fontSize: "0.85rem", borderTop: "1px solid #e2e8f0" }}>
        Built for Apogee '26 -- BITS Pilani | ArmorIQ x OpenClaw Hackathon
      </footer>
    </div>
  );
}
