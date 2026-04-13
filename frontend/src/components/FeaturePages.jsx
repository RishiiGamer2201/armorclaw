import { useState } from "react";
import { runAgent, runDelegatedAgent } from "../api/agent";
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
    description: "Delegate bounded authority to a sub-agent. The child agent can ONLY use tools permitted by the selected scope — any violation is deterministically blocked.",
    isDelegation: true,
    fields: [
      { key: "scope", label: "Delegation Scope", type: "select", options: ["read_only", "trade_limited", "compliance_audit", "payment_processor"] },
      { key: "prompt", label: "Sub-Agent Instruction", type: "text", placeholder: "e.g. Buy 5 shares of AAPL" },
    ],
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
      if (def.isDelegation) {
        // Delegation feature: call the delegation endpoint
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

  const allFilled = def.fields.every(
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

      {result && (
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
