import { useState } from "react";
import { runAgent, runDelegatedAgent, runDriftDemo, runCascadeDemo } from "../api/agent";
import FeatureResultViewer from "./FeatureResultViewer";
import AuditLogTable from "./AuditLogTable";

// Feature definitions with page-specific configs
const FEATURE_DEFS = {
  cheque: {
    title: "Cheque Fraud Scanner",
    description: "Upload a cheque image to analyze it for fraud markers, extract the amount, and verify visual consistency using Gemini Vision.",
    promptTemplate: (args) =>
      `Analyze this cheque image for fraud: ${args.imageUrl}`,
    fields: [
      { key: "imageUrl", label: "Cheque Image URL", type: "url", placeholder: "https://example.com/cheque.png" },
    ],
    isUpload: true,
  },
  wire: {
    title: "Wire Transfer Protection",
    description: "Execute a protected wire transfer. The system verifies account balance, frozen status, and policy limits before processing.",
    promptTemplate: (args) =>
      `Process a wire transfer of $${args.amount} to IBAN ${args.iban} with SWIFT code ${args.swift}`,
    fields: [
      { key: "amount", label: "Amount (USD)", type: "number", placeholder: "5000" },
      { key: "iban", label: "Recipient IBAN", type: "text", placeholder: "DE89370400440532013000" },
      { key: "swift", label: "SWIFT Code", type: "text", placeholder: "COBADEFFXXX" },
    ],
  },
  card: {
    title: "Corporate Card Generator",
    description: "Generate a compliant corporate credit card using Luhn algorithm validation, mapped to an authorized employee.",
    promptTemplate: (args) =>
      `Issue a corporate card for employee ${args.email} with a credit limit of $${args.limit}`,
    fields: [
      { key: "email", label: "Employee Email", type: "email", placeholder: "alice@company.com" },
      { key: "limit", label: "Credit Limit (USD)", type: "number", placeholder: "1500" },
    ],
  },
  kyc: {
    title: "KYC ID Extraction",
    description: "Upload an ID document (passport, driver's license) and extract identity details for KYC compliance using Gemini Vision.",
    promptTemplate: (args) =>
      `Verify this KYC document: ${args.documentUrl}`,
    fields: [
      { key: "documentUrl", label: "Document Image URL", type: "url", placeholder: "https://example.com/passport.png" },
    ],
    isUpload: true,
  },
  aml: {
    title: "AML Structuring Detection",
    description: "Scan an account's transaction history for rapid sub-threshold payments that indicate potential money laundering through structuring.",
    promptTemplate: (args) =>
      `Detect money laundering patterns for account ${args.accountId}`,
    fields: [
      { key: "accountId", label: "Account ID", type: "text", placeholder: "MAIN-001" },
    ],
  },
  freeze: {
    title: "Emergency DB Freeze",
    description: "Immediately freeze an account to block all outgoing transactions. This is an emergency response mechanism for detected breaches.",
    promptTemplate: (args) =>
      `Lock compromised funds in account ${args.accountId} because: ${args.reason}`,
    fields: [
      { key: "accountId", label: "Account ID", type: "text", placeholder: "MAIN-001" },
      { key: "reason", label: "Freeze Reason", type: "text", placeholder: "Suspected unauthorized access" },
    ],
  },
  crypto: {
    title: "Crypto Asset Swap",
    description: "Swap cryptocurrency assets with automatic balance updates. Supported assets: USDC, ETH, BTC.",
    promptTemplate: (args) =>
      `Swap ${args.amount} ${args.fromAsset} to ${args.toAsset}`,
    fields: [
      { key: "fromAsset", label: "From Asset", type: "select", options: ["USDC", "ETH", "BTC"] },
      { key: "toAsset", label: "To Asset", type: "select", options: ["USDC", "ETH", "BTC"] },
      { key: "amount", label: "Amount", type: "number", placeholder: "100" },
    ],
  },
  invoice: {
    title: "Invoice Verification",
    description: "Upload a vendor invoice to extract the vendor name and amount, then verify against the approved vendor database.",
    promptTemplate: (args) =>
      `Analyze this vendor invoice: ${args.invoiceUrl}`,
    fields: [
      { key: "invoiceUrl", label: "Invoice Image URL", type: "url", placeholder: "https://example.com/invoice.png" },
    ],
    isUpload: true,
  },
  "audit-tx": {
    title: "Transaction Anomaly Auditing",
    description: "Analyze transaction history to identify spending anomalies that exceed 3x the average transaction amount.",
    promptTemplate: (args) =>
      `Audit transaction anomalies for account ${args.accountId}`,
    fields: [
      { key: "accountId", label: "Account ID", type: "text", placeholder: "MAIN-001" },
    ],
  },
  loan: {
    title: "DTI Loan Pricing",
    description: "Calculate automated loan approval using Debt-to-Income ratio analysis and algorithmic credit scoring.",
    promptTemplate: (args) =>
      `Request loan approval for $${args.amount} with monthly income $${args.income}, existing debt $${args.debt}, and credit score ${args.creditScore}`,
    fields: [
      { key: "amount", label: "Loan Amount (USD)", type: "number", placeholder: "25000" },
      { key: "income", label: "Monthly Income (USD)", type: "number", placeholder: "8000" },
      { key: "debt", label: "Existing Debt (USD)", type: "number", placeholder: "2000" },
      { key: "creditScore", label: "Credit Score", type: "number", placeholder: "720" },
    ],
  },
  // ── NEW FEATURES ──
  sanctions: {
    title: "Sanctions & PEP Screening",
    description: "Screen entities against OFAC, UN, EU sanctions lists and Politically Exposed Persons (PEP) databases in real-time.",
    promptTemplate: (args) =>
      `Screen ${args.entityName} against sanctions and PEP databases`,
    fields: [
      { key: "entityName", label: "Entity / Person Name", type: "text", placeholder: "e.g. Bank Melli Iran, John Smith" },
    ],
  },
  "cross-border": {
    title: "Cross-Border Payment Compliance",
    description: "Multi-layer compliance pipeline for international wire transfers. Checks IBAN country → sanctions → AML → account status → balance before executing. Any failure halts the entire pipeline.",
    promptTemplate: (args) =>
      `Send international cross-border payment of ${args.amount} dollars to IBAN ${args.iban} recipient ${args.recipientName} SWIFT ${args.swift}`,
    fields: [
      { key: "amount", label: "Amount (USD)", type: "number", placeholder: "5000" },
      { key: "recipientName", label: "Recipient Name", type: "text", placeholder: "Acme Corporation" },
      { key: "iban", label: "Recipient IBAN", type: "text", placeholder: "DE89370400440532013000" },
      { key: "swift", label: "SWIFT Code", type: "text", placeholder: "COBADEFFXXX" },
    ],
  },
  onboarding: {
    title: "Compliance Onboarding Pipeline",
    description: "Full 4-stage compliance pipeline: KYC verification → AML screening → Sanctions check → Risk assessment. Each stage runs independently through the enforcement layers.",
    promptTemplate: (args) =>
      `Run full compliance onboarding for client ${args.clientName}`,
    fields: [
      { key: "clientName", label: "Client Name", type: "text", placeholder: "John Smith" },
    ],
  },
  delegation: {
    title: "Agent Delegation",
    description: "Delegate bounded authority to a sub-agent. The child agent can ONLY use tools permitted by the selected scope -- any violation is deterministically blocked.",
    isDelegation: true,
    fields: [
      { key: "scope", label: "Delegation Scope", type: "select", options: ["read_only", "trade_limited", "compliance_audit", "payment_processor"] },
      { key: "prompt", label: "Sub-Agent Instruction", type: "text", placeholder: "e.g. Buy 5 shares of AAPL" },
    ],
  },
  "drift-demo": {
    title: "Intent Drift Attack",
    description: "Live demonstration of ArmorIQ's core capability. Register a Merkle tree for Intent A, then try to execute Intent B against the SAME token. The Merkle proof fails because B's tool calls were never in A's signed plan.",
    isDriftDemo: true,
    fields: [
      { key: "original", label: "Original Intent (approved plan)", type: "text", placeholder: "What is the current price of AAPL?" },
      { key: "drifted", label: "Drifted Intent (unauthorized deviation)", type: "text", placeholder: "Buy 100 shares of AAPL at market price" },
    ],
  },
  "cascade-demo": {
    title: "Multi-Agent Cascade Prevention",
    description: "3 agents in a chain: Orchestrator (full) -> Research Agent (read-only, COMPROMISED) -> Execution Agent (trade-limited). ArmorIQ contains the blast radius -- compromising one agent cannot poison others.",
    isCascadeDemo: true,
    fields: [],
  },
};


export default function FeaturePages({ featureId }) {
  const def = FEATURE_DEFS[featureId];
  const [formValues, setFormValues]   = useState({});
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [result, setResult]           = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);

  if (!def) {
    return (
      <div style={{ padding: 24 }}>
        <div className="error-box">Feature "{featureId}" not found.</div>
      </div>
    );
  }

  const updateField = (key, value) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = (e, fieldKey) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setUploadPreview(dataUrl);
      // Use a simulated external URL for the backend (Option B)
      updateField(fieldKey, `https://simulated-upload.clawshield.local/${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let data;
      if (def.isDriftDemo) {
        data = await runDriftDemo(formValues.original, formValues.drifted);
      } else if (def.isCascadeDemo) {
        data = await runCascadeDemo();
      } else if (def.isDelegation) {
        data = await runDelegatedAgent(formValues.prompt, formValues.scope, `Delegation demo: ${formValues.scope}`);
      } else {
        const prompt = def.promptTemplate(formValues);
        data = await runAgent(prompt);
      }
      setResult(data);
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Unknown error";
      setError(`Request failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const allFilled = def.fields.length === 0 || def.fields.every(
    (f) => formValues[f.key] && String(formValues[f.key]).trim() !== ""
  );

  return (
    <div style={{ padding: 24 }} className="feature-page">
      <div className="feature-page-header">
        <h1 className="feature-page-title">{def.title}</h1>
        <p className="feature-page-desc">{def.description}</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">Configuration</span>
        </div>
        <div className="card-body">
          <div className="feature-form">
            {def.fields.map((field) => (
              <div key={field.key} className="form-group">
                <label className="form-label">{field.label}</label>

                {field.type === "select" ? (
                  <select
                    className="form-select"
                    value={formValues[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                  >
                    <option value="">Select...</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === "url" && def.isUpload ? (
                  <div>
                    <div
                      className={`upload-zone${uploadPreview ? " has-file" : ""}`}
                      onClick={() => document.getElementById(`upload-${field.key}`).click()}
                    >
                      {uploadPreview ? (
                        <div>
                          <img src={uploadPreview} alt="Preview" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }} />
                          <p style={{ marginTop: 8, fontSize: "0.82rem", color: "var(--green)" }}>
                            File loaded. Click to replace.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="upload-zone-icon">&#8682;</div>
                          <div className="upload-zone-text">Click to upload an image</div>
                          <div className="upload-zone-hint">PNG, JPG, or WEBP. Max 10MB.</div>
                        </>
                      )}
                    </div>
                    <input
                      id={`upload-${field.key}`}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleFileUpload(e, field.key)}
                    />
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Or paste a URL:</span>
                      <input
                        className="form-input"
                        type="url"
                        placeholder={field.placeholder}
                        value={formValues[field.key] || ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        style={{ marginTop: 4 }}
                      />
                    </div>
                  </div>
                ) : (
                  <input
                    className="form-input"
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formValues[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                  />
                )}
              </div>
            ))}

            <button
              className="form-submit"
              onClick={handleSubmit}
              disabled={!allFilled || loading}
            >
              {loading ? "Processing..." : "Execute"}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

      {result && result.demo_type === "intent_drift" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card"><div className="card-header"><span className="card-title">Original Plan (Approved)</span></div>
            <div className="card-body" style={{ padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: "var(--green)" }}>Intent: {result.original?.intent}</div>
              <div style={{ fontSize: "0.8rem", fontFamily: "monospace", color: "var(--text-muted)" }}>Merkle Root: {result.original?.merkle_root?.slice(0, 32)}...</div>
              <div style={{ marginTop: 8 }}>{result.original?.steps?.map((s, i) => (
                <div key={i} style={{ padding: "6px 12px", background: "rgba(16,185,129,0.08)", borderLeft: "3px solid var(--green)", borderRadius: 4, marginBottom: 4, fontSize: "0.85rem" }}>
                  Step {i+1}: <strong>{s.tool}</strong>
                </div>
              ))}</div>
            </div>
          </div>
          <div className="card"><div className="card-header"><span className="card-title">Drifted Steps (Unauthorized)</span></div>
            <div className="card-body" style={{ padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: "var(--red)" }}>Drifted Intent: {result.drifted?.intent}</div>
              {result.drift_results?.map((r, i) => (
                <div key={i} style={{ padding: "10px 12px", background: r.drift_detected ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)", borderLeft: `3px solid ${r.drift_detected ? "var(--red)" : "var(--green)"}`, borderRadius: 4, marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Step {r.step_id}: <span style={{ fontFamily: "monospace" }}>{r.tool}</span></span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: r.drift_detected ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)", color: r.drift_detected ? "var(--red)" : "var(--green)" }}>
                      {r.drift_detected ? "DRIFT BLOCKED" : "MATCHED"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>{r.reason?.slice(0, 120)}</div>
                </div>
              ))}
            </div>
          </div>
          {result.drift_detected && (
            <div style={{ padding: 16, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontWeight: 600, color: "var(--red)", textAlign: "center" }}>
              INTENT DRIFT DETECTED -- All unauthorized steps blocked by Merkle proof verification
            </div>
          )}
        </div>
      )}

      {result && result.demo_type === "cascade_prevention" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {result.agents?.map((agent, i) => (
            <div key={i} className="card" style={{ borderLeft: `4px solid ${agent.status === "compromised" ? "var(--red)" : "var(--green)"}` }}>
              <div className="card-header">
                <span className="card-title">
                  {agent.status === "compromised" ? "\u26A0 " : "\u2713 "}
                  Agent {i+1}: {agent.agent}
                </span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: agent.status === "compromised" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)", color: agent.status === "compromised" ? "var(--red)" : "var(--green)" }}>
                  {agent.status.toUpperCase()}
                </span>
              </div>
              <div className="card-body" style={{ padding: 16 }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>{agent.role}</div>
                <div style={{ fontSize: "0.85rem", marginBottom: 8 }}>Scope: <strong>{agent.scope}</strong></div>
                <div style={{ fontSize: "0.85rem", marginBottom: 8 }}>Prompt: <em>{agent.prompt?.slice(0, 80)}</em></div>
                <div style={{ display: "flex", gap: 16, fontSize: "0.85rem" }}>
                  <span>Allowed: <strong style={{ color: "var(--green)" }}>{agent.result?.stats?.allowed || 0}</strong></span>
                  <span>Blocked: <strong style={{ color: "var(--red)" }}>{agent.result?.stats?.blocked || 0}</strong></span>
                </div>
                {agent.delegation_info?.actions_blocked > 0 && (
                  <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: 6, fontSize: "0.8rem", color: "var(--red)" }}>
                    Delegation violations caught: {agent.delegation_info.actions_blocked}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div style={{ padding: 16, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, fontSize: "0.9rem" }}>
            <strong>Cascade Contained:</strong> {result.summary?.explanation}
          </div>
        </div>
      )}

      {result && !result.demo_type && (
        <div className="feature-result-container">
          <FeatureResultViewer executionData={result} />
        </div>
      )}

      {/* Inline Audit Log */}
      <div className="inline-audit">
        <div className="inline-audit-title">Recent Audit Entries</div>
        <AuditLogTable />
      </div>
    </div>
  );
}
