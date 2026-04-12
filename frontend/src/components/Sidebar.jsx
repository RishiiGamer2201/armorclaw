import React from "react";

const SIDEBAR_FEATURES = [
  {
    name: "Cheque Fraud Scanning",
    prompt: "Scan this cheque image for fraud and written amount limits: https://storage.googleapis.com/demo-assets/cheque.jpg"
  },
  {
    name: "Wire Transfer Execution",
    prompt: "Wire $50,000 to GB123456789 offshore immediately"
  },
  {
    name: "Generate Corporate Card",
    prompt: "Issue a new corporate card for finance@example.com with a limit of 1500"
  },
  {
    name: "KYC Extraction",
    prompt: "Verify this ID document for KYC compliance: https://storage.googleapis.com/demo-assets/passport.jpg"
  },
  {
    name: "AML Structuring Check",
    prompt: "Run an AML check on MAIN-001 looking for structuring anomalies"
  },
  {
    name: "Emergency Database Lock",
    prompt: "A breach was detected. Instantly lock compromised funds for MAIN-001"
  },
  {
    name: "Crypto Asset Swap",
    prompt: "Swap 10.5 ETH for USDC in the corporate wallets"
  },
  {
    name: "Invoice Whitelist Verification",
    prompt: "Verify this vendor invoice against our database whitelist: https://storage.googleapis.com/demo-assets/invoice.pdf"
  },
  {
    name: "Transaction Auditing",
    prompt: "Audit my recent transactions for MAIN-001 looking for high deviation anomalies"
  },
  {
    name: "Algorithmic Loan Pricing",
    prompt: "Request loan approval for $50000. My monthly income is 4000, existing debt 1000, credit score 720"
  }
];

export default function Sidebar({ onFeatureClick }) {
  return (
    <div style={{ width: "280px", background: "rgba(15, 23, 42, 0.9)", borderRight: "1px solid rgba(255, 255, 255, 0.05)", padding: "20px", display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto" }}>
      <h3 style={{ margin: "0 0 10px 0", color: "#6495ed", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>
        Universal Features
      </h3>
      {SIDEBAR_FEATURES.map((feat, idx) => (
        <button
          key={idx}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
            padding: "12px",
            borderRadius: "8px",
            color: "#f8fafc",
            textAlign: "left",
            cursor: "pointer",
            fontSize: "0.9rem",
            transition: "background 0.2s"
          }}
          onClick={() => onFeatureClick(feat.prompt)}
          onMouseEnter={(e) => e.target.style.background = "rgba(100, 149, 237, 0.15)"}
          onMouseLeave={(e) => e.target.style.background = "rgba(255,255,255,0.03)"}
        >
          {feat.name}
        </button>
      ))}
      <div style={{ marginTop: "auto", fontSize: "0.75rem", color: "#94a3b8", textAlign: "center", paddingTop: "20px" }}>
        Click any feature to auto-fill the prompt terminal.
      </div>
    </div>
  );
}
