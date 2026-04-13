
import React from "react";

// Sub-components for specific feature cards
const KYCProfileCard = ({ data }) => (
  <div style={{ background: "rgba(30, 41, 59, 0.7)", borderRadius: 12, padding: 24, border: "1px solid rgba(100, 149, 237, 0.3)", display: "flex", gap: 20 }}>
    <div style={{ flexShrink: 0, width: 80, height: 80, background: "rgba(100, 149, 237, 0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>
      👤
    </div>
    <div style={{ flex: 1 }}>
      <h3 style={{ margin: "0 0 16px 0", color: "#f8fafc", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 8 }}>KYC Extraction Verified</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", fontSize: "0.95rem" }}>
        <div><span style={{ color: "#64748b" }}>Name</span><br/><strong>{data.name || "Unknown"}</strong></div>
        <div><span style={{ color: "#64748b" }}>DOB</span><br/><strong>{data.dob || "Unknown"}</strong></div>
        <div><span style={{ color: "#64748b" }}>ID Number</span><br/><strong className="mono">{data.id_number || "Unknown"}</strong></div>
        <div>
          <span style={{ color: "#64748b" }}>Status</span><br/>
          <strong style={{ color: data.isValid ? "#10b981" : "#ef4444" }}>
            {data.isValid ? "VERIFIED VALID" : "INVALID / EXPIRED"}
          </strong>
        </div>
      </div>
    </div>
  </div>
);

const ChequeFraudCard = ({ data }) => {
  const isHighRisk = data.fraud_probability_percentage > 30;
  return (
    <div style={{ background: "rgba(30, 41, 59, 0.7)", borderRadius: 12, padding: 24, border: `1px solid ${isHighRisk ? "rgba(239, 68, 68, 0.5)" : "rgba(16, 185, 129, 0.5)"}` }}>
      <h3 style={{ margin: "0 0 16px 0", color: "#f8fafc" }}>Cheque Vision Analysis</h3>
      <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 12 }}><span style={{ color: "#64748b" }}>Extracted Payee</span><br/><strong>{data.payee}</strong></div>
          <div style={{ marginBottom: 12 }}><span style={{ color: "#64748b" }}>Extracted Amount</span><br/><strong>${data.amount?.toLocaleString()}</strong></div>
          {data.fraud_reason && (
            <div style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: 8 }}>
              <strong>Flag:</strong> {data.fraud_reason}
            </div>
          )}
        </div>
        <div style={{ width: 140, height: 140, borderRadius: "50%", background: "transparent", border: `8px solid ${isHighRisk ? "#ef4444" : "#10b981"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
           <span style={{ fontSize: "2rem", fontWeight: "bold", color: isHighRisk ? "#ef4444" : "#10b981" }}>
             {data.fraud_probability_percentage}%
           </span>
           <span style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase" }}>Fraud Risk</span>
        </div>
      </div>
    </div>
  );
};

const WireTransferCard = ({ data }) => (
  <div style={{ background: "linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.9))", borderRadius: 12, padding: 32, border: "1px dashed rgba(255,255,255,0.2)", position: "relative" }}>
     <h2 style={{ textAlign: "center", textTransform: "uppercase", letterSpacing: 2, margin: "0 0 24px 0", color: "#f8fafc" }}>Wire Transaction Receipt</h2>
     <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 12, marginBottom: 12 }}>
       <span style={{ color: "#94a3b8" }}>Transaction ID</span>
       <span className="mono" style={{ color: "#6495ed" }}>{data.transaction_id}</span>
     </div>
     <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 12, marginBottom: 12 }}>
       <span style={{ color: "#94a3b8" }}>Recipient IBAN</span>
       <span className="mono">{data.recipient}</span>
     </div>
     <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, marginBottom: 12 }}>
       <span style={{ color: "#94a3b8" }}>New Account Balance</span>
       <span style={{ fontWeight: "bold", color: "#10b981", fontSize: "1.2rem" }}>
         ${data.new_balance?.toLocaleString(undefined, {minimumFractionDigits: 2})}
       </span>
     </div>
  </div>
);

const CorporateCard = ({ data }) => (
  <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: 16, padding: "24px 32px", border: "1px solid rgba(100, 149, 237, 0.4)", width: "100%", maxWidth: 400, margin: "0 auto", position: "relative", overflow: "hidden", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)"}}>
    <div style={{ position: "absolute", top: -50, right: -50, width: 100, height: 100, background: "rgba(100, 149, 237, 0.2)", borderRadius: "50%", filter: "blur(20px)" }}></div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
      <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "#f8fafc" }}>ClawShield VIP</div>
      <div style={{ fontWeight: 600, color: "#6495ed" }}>VISA</div>
    </div>
    <div className="mono" style={{ fontSize: "1.5rem", letterSpacing: 4, marginBottom: 16, color: "#f8fafc" }}>
      {data.card_number}
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", fontSize: "0.85rem" }}>
      <div>
        <div style={{ fontSize: "0.6rem", textTransform: "uppercase" }}>Cardholder</div>
        <div style={{ color: "#f8fafc", fontWeight: 600 }}>{data.employee}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "0.6rem", textTransform: "uppercase" }}>Limit</div>
        <div style={{ color: "#10b981", fontWeight: 600 }}>${data.limit?.toLocaleString()}</div>
      </div>
    </div>
  </div>
);

const AMLCheckCard = ({ data }) => (
  <div style={{ background: "rgba(30, 41, 59, 0.7)", borderRadius: 12, padding: 24, border: `1px solid ${data.flagged ? "rgba(239, 68, 68, 0.5)" : "rgba(16, 185, 129, 0.5)"}` }}>
    <h3 style={{ margin: "0 0 16px 0", color: data.flagged ? "#ef4444" : "#10b981", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: "1.5rem" }}>{data.flagged ? "\u{1F6A8}" : "\u2705"}</span>
      AML Structuring Report
    </h3>
    <div style={{ fontSize: "1rem", color: "#f8fafc", marginBottom: 16, lineHeight: 1.5 }}>
      {data.reason}
    </div>
    {data.flagged && (
      <div style={{ background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 8 }}>
        <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Flagged Volume:</span>
        <div style={{ color: "#ef4444", fontSize: "1.2rem", fontWeight: "bold" }}>${data.total_volume?.toLocaleString()}</div>
      </div>
    )}
  </div>
);

const LoanPricingCard = ({ data }) => (
  <div style={{ background: "rgba(30, 41, 59, 0.7)", borderRadius: 12, padding: 24, border: "1px solid rgba(100, 149, 237, 0.3)" }}>
    <h3 style={{ margin: "0 0 16px 0", color: "#f8fafc" }}>Algorithmic Credit Decision</h3>
    {data.approved ? (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 8, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase" }}>Approved Amount</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#10b981" }}>${data.amount?.toLocaleString()}</div>
        </div>
        <div style={{ background: "rgba(100, 149, 237, 0.1)", border: "1px solid rgba(100, 149, 237, 0.3)", borderRadius: 8, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase" }}>Assigned APR</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#6495ed" }}>{data.interest_rate_percentage}%</div>
        </div>
        <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
          Debt-to-Income (DTI) Ratio: <strong>{data.dti_ratio?.toFixed?.(1) ?? data.dti_ratio}%</strong>
        </div>
      </div>
    ) : (
      <div style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", padding: 16, borderRadius: 8 }}>
        <strong>Declined:</strong> {data.reason}
      </div>
    )}
  </div>
);

const InvoiceVerificationCard = ({ data }) => (
  <div style={{ background: "rgba(30, 41, 59, 0.7)", borderRadius: 12, padding: 24, border: `1px solid ${data.error ? "rgba(239, 68, 68, 0.5)" : "rgba(16, 185, 129, 0.5)"}` }}>
    <h3 style={{ margin: "0 0 16px 0", color: "#f8fafc" }}>Vendor Invoice Audit</h3>
    {data.error ? (
       <div style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", padding: 16, borderRadius: 8 }}>
         <strong>Blocked:</strong> {data.error}<br/>
         <span style={{ fontSize: "0.85rem", opacity: 0.8, display: "block", marginTop: 8 }}>Attempted Vendor: {data.extracted_vendor}</span>
       </div>
    ) : (
       <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
         <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#10b981", fontWeight: "bold", marginBottom: 8 }}>
            {data.msg}
         </div>
         <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
           <span style={{ color: "#94a3b8" }}>Total Due</span>
           <span>${data.amount_due?.toLocaleString()}</span>
         </div>
         <div style={{ display: "flex", justifyContent: "space-between" }}>
           <span style={{ color: "#94a3b8" }}>Authorized IBAN</span>
           <span className="mono">{data.iban}</span>
         </div>
       </div>
    )}
  </div>
);

const CryptoSwapCard = ({ data }) => (
  <div style={{ background: "rgba(30, 41, 59, 0.7)", borderRadius: 12, padding: 24, border: "1px solid rgba(16, 185, 129, 0.3)" }}>
    <h3 style={{ margin: "0 0 16px 0", color: "#f8fafc", textAlign: "center" }}>Swap Executed</h3>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "1.5rem", color: "#ef4444", fontWeight: "bold" }}>-{data.swapped}</div>
        <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{data.from}</div>
      </div>
      <div style={{ fontSize: "2rem", color: "#64748b" }}>{"\u27A4"}</div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "1.5rem", color: "#10b981", fontWeight: "bold" }}>+{data.received?.toLocaleString(undefined, {maximumFractionDigits: 6})}</div>
        <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{data.to}</div>
      </div>
    </div>
  </div>
);

// ── NEW FEATURE CARDS ───────────────────────────────────────────────────────

const SanctionsCard = ({ data }) => {
  const colors = { critical: "#ef4444", high: "#f59e0b", medium: "#f59e0b", low: "#10b981", none: "#10b981" };
  const color = colors[data.risk_level] || "#94a3b8";
  return (
    <div style={{ background: "rgba(30, 41, 59, 0.7)", borderRadius: 12, padding: 24, border: `1px solid ${data.match_found ? "rgba(239, 68, 68, 0.5)" : "rgba(16, 185, 129, 0.5)"}` }}>
      <h3 style={{ margin: "0 0 16px 0", color: "#f8fafc", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "1.5rem" }}>{data.match_found ? "\u{1F6A8}" : "\u{1F6E1}\uFE0F"}</span>
        Sanctions & PEP Screening
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", marginBottom: 16 }}>
        <div><span style={{ color: "#64748b" }}>Entity</span><br/><strong>{data.entity}</strong></div>
        <div><span style={{ color: "#64748b" }}>Risk Level</span><br/><strong style={{ color, textTransform: "uppercase" }}>{data.risk_level}</strong></div>
        {data.match_found && <>
          <div><span style={{ color: "#64748b" }}>Matched Name</span><br/><strong style={{ color: "#ef4444" }}>{data.match_name}</strong></div>
          <div><span style={{ color: "#64748b" }}>Sanctions List</span><br/><strong>{data.sanctions_list}</strong></div>
          <div><span style={{ color: "#64748b" }}>Country</span><br/><strong>{data.country}</strong></div>
          <div><span style={{ color: "#64748b" }}>Entity Type</span><br/><strong>{data.entity_type}</strong></div>
        </>}
      </div>
      <div style={{ background: data.match_found ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", padding: 12, borderRadius: 8, color, fontWeight: "bold", fontSize: "0.9rem" }}>
        {data.recommendation}
      </div>
      {data.lists_checked && (
        <div style={{ marginTop: 12, fontSize: "0.8rem", color: "#64748b" }}>
          Databases checked: {data.lists_checked.join(", ")}
        </div>
      )}
    </div>
  );
};

// Cross-Border Payment Card
const CrossBorderCard = ({ data }) => {
  const checks = data.checks || [];
  return (
    <div style={{ background: "rgba(30, 41, 59, 0.7)", borderRadius: 12, padding: 24, border: `1px solid ${data.success ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)"}` }}>
      <h3 style={{ margin: "0 0 16px 0", color: "#f8fafc" }}>Cross-Border Payment Compliance</h3>
      {!data.success && data.blocked_at && (
        <div style={{ background: "rgba(239,68,68,0.15)", padding: 12, borderRadius: 8, marginBottom: 16, color: "#ef4444", fontWeight: "bold" }}>
          HALTED at: {data.blocked_at} — {data.recommendation}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {checks.map((c, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 6,
            borderLeft: `3px solid ${c.status === "PASSED" || c.status === "COMPLETED" ? "#10b981" : c.status === "WARNING" ? "#f59e0b" : "#ef4444"}`,
            background: "rgba(0,0,0,0.15)",
          }}>
            <span style={{ fontWeight: "bold", color: c.status === "PASSED" || c.status === "COMPLETED" ? "#10b981" : c.status === "WARNING" ? "#f59e0b" : "#ef4444" }}>
              {c.status === "PASSED" || c.status === "COMPLETED" ? "\u2713" : c.status === "WARNING" ? "!" : "\u2717"}
            </span>
            <span style={{ fontWeight: 600, minWidth: 140 }}>{c.check}</span>
            <span style={{ color: "#94a3b8", fontSize: "0.85rem", flex: 1 }}>{c.detail}</span>
            <span style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: 4, background: c.status === "PASSED" || c.status === "COMPLETED" ? "rgba(16,185,129,0.2)" : c.status === "WARNING" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)", color: c.status === "PASSED" || c.status === "COMPLETED" ? "#10b981" : c.status === "WARNING" ? "#f59e0b" : "#ef4444" }}>
              {c.status}
            </span>
          </div>
        ))}
      </div>
      {data.success && (
        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "rgba(16,185,129,0.1)", borderRadius: 8, border: "1px solid rgba(16,185,129,0.3)" }}>
          <span>TX: <strong style={{ color: "#6495ed" }}>{data.transaction_id}</strong></span>
          <span>Amount: <strong>${data.amount?.toLocaleString()}</strong></span>
          <span>Balance: <strong style={{ color: "#10b981" }}>${data.new_balance?.toLocaleString()}</strong></span>
        </div>
      )}
    </div>
  );
};

// Compliance Onboarding Card
const OnboardingCard = ({ data }) => {
  const stages = data.stages || [];
  return (
    <div style={{ background: "rgba(30, 41, 59, 0.7)", borderRadius: 12, padding: 24, border: `1px solid ${data.onboarding_approved ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, color: "#f8fafc" }}>Compliance Onboarding: {data.client_name}</h3>
        <div style={{ padding: "6px 16px", borderRadius: 20, fontWeight: 700, fontSize: "0.85rem", background: data.onboarding_approved ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)", color: data.onboarding_approved ? "#10b981" : "#ef4444", border: `1px solid ${data.onboarding_approved ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}` }}>
          {data.onboarding_approved ? "APPROVED" : "REJECTED"}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {stages.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8,
            background: "rgba(0,0,0,0.15)",
            borderLeft: `4px solid ${s.status === "PASSED" || s.status === "APPROVED" ? "#10b981" : s.status === "FLAGGED" || s.status === "REVIEW" ? "#f59e0b" : "#ef4444"}`,
          }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(100,149,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", color: "#6495ed" }}>{s.order}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{s.stage}</div>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{s.detail}</div>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "3px 10px", borderRadius: 4, background: s.status === "PASSED" || s.status === "APPROVED" ? "rgba(16,185,129,0.2)" : s.status === "FLAGGED" || s.status === "REVIEW" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)", color: s.status === "PASSED" || s.status === "APPROVED" ? "#10b981" : s.status === "FLAGGED" || s.status === "REVIEW" ? "#f59e0b" : "#ef4444" }}>
              {s.status}
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 24, fontSize: "0.85rem", color: "#94a3b8" }}>
        <span>Risk Score: <strong style={{ color: data.risk_score >= 70 ? "#10b981" : data.risk_score >= 40 ? "#f59e0b" : "#ef4444" }}>{data.risk_score}/100</strong></span>
        <span>Risk Grade: <strong>{data.risk_grade}</strong></span>
        <span>Stages: <strong>{data.stages_passed}/{data.stages_total} passed</strong></span>
      </div>
    </div>
  );
};

// Tool Poisoning Card
const ToolPoisoningCard = ({ data }) => {
  const ha = data._hidden_action || {};
  return (
    <div style={{ background: "rgba(30, 41, 59, 0.7)", borderRadius: 12, padding: 24, border: "1px solid rgba(239, 68, 68, 0.5)" }}>
      <h3 style={{ margin: "0 0 16px 0", color: "#f8fafc" }}>Tool Poisoning Detection</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ padding: 16, background: "rgba(16,185,129,0.08)", borderRadius: 8, border: "1px solid rgba(16,185,129,0.3)" }}>
          <div style={{ fontSize: "0.75rem", color: "#10b981", textTransform: "uppercase", marginBottom: 8 }}>Legitimate Action (Executed)</div>
          <div><span style={{ color: "#94a3b8" }}>Notification sent to:</span> <strong>{data.recipient}</strong></div>
          <div><span style={{ color: "#94a3b8" }}>Subject:</span> {data.subject}</div>
          <div><span style={{ color: "#94a3b8" }}>Amount:</span> ${data.amount_referenced?.toLocaleString()}</div>
        </div>
        <div style={{ padding: 16, background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)" }}>
          <div style={{ fontSize: "0.75rem", color: "#ef4444", textTransform: "uppercase", marginBottom: 8 }}>Hidden Action (INTERCEPTED)</div>
          <div><span style={{ color: "#94a3b8" }}>Attempted tool:</span> <strong style={{ color: "#ef4444" }}>{ha.attempted_tool}</strong></div>
          <div><span style={{ color: "#94a3b8" }}>To IBAN:</span> <span style={{ fontFamily: "monospace" }}>{ha.attempted_args?.recipient_iban}</span></div>
          <div><span style={{ color: "#94a3b8" }}>Amount:</span> <strong style={{ color: "#ef4444" }}>${ha.attempted_args?.amount?.toLocaleString()}</strong></div>
        </div>
      </div>
      <div style={{ marginTop: 16, padding: 12, background: "rgba(239,68,68,0.1)", borderRadius: 8, fontSize: "0.85rem" }}>
        <div style={{ color: "#ef4444", fontWeight: 700, marginBottom: 4 }}>Attack Vector: {ha.type}</div>
        <div style={{ color: "#94a3b8" }}>{ha.attack_vector}</div>
        <div style={{ color: "#64748b", marginTop: 4, fontSize: "0.8rem" }}>Real-world: {ha.real_world_reference}</div>
      </div>
    </div>
  );
};

// Fallback JSON Viewer for unmapped results
const DefaultJSONCard = ({ tool, data }) => (
  <div style={{ background: "rgba(30, 41, 59, 0.7)", borderRadius: 12, padding: 24, border: "1px solid rgba(100, 149, 237, 0.3)" }}>
    <h3 style={{ margin: "0 0 16px 0", color: "#f8fafc" }}>Output: <span className="mono">{tool}</span></h3>
    <pre style={{ background: "rgba(0,0,0,0.3)", padding: 16, borderRadius: 8, color: "#10b981", overflowX: "auto", fontSize: "0.85rem", margin: 0 }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  </div>
);

export default function FeatureResultViewer({ executionData }) {
  if (!executionData || !executionData.results || executionData.results.length === 0) return null;

  const delegation = executionData?.delegation;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "16px 0" }}>
      {/* Delegation info banner */}
      {delegation && (
        <div style={{ background: "rgba(100, 149, 237, 0.1)", border: "1px solid rgba(100, 149, 237, 0.4)", padding: 20, borderRadius: 12 }}>
          <h3 style={{ color: "#6495ed", margin: "0 0 12px 0" }}>Delegated Execution: {delegation.label}</h3>
          <div style={{ fontSize: "0.85rem", color: "#f8fafc", marginBottom: 8 }}>{delegation.description}</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: "0.8rem" }}>
            <span style={{ color: "#94a3b8" }}>Scope: <strong style={{ color: "#6495ed" }}>{delegation.scope_id}</strong></span>
            <span style={{ color: "#94a3b8" }}>Allowed Tools: <strong>{delegation.allowed_tools?.length}</strong></span>
            {delegation.info && <>
              <span style={{ color: "#94a3b8" }}>Actions Taken: <strong style={{ color: "#10b981" }}>{delegation.info.actions_taken}</strong></span>
              <span style={{ color: "#94a3b8" }}>Actions Blocked: <strong style={{ color: "#ef4444" }}>{delegation.info.actions_blocked}</strong></span>
            </>}
          </div>
          <div style={{ marginTop: 8, fontSize: "0.75rem", color: "#64748b" }}>
            Permitted: [{delegation.allowed_tools?.join(", ")}]
          </div>
        </div>
      )}
      {executionData.results.map((res, i) => {
        if (res.status === "blocked") {
          return (
            <div key={i} style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: 20, borderRadius: 12 }}>
              <h3 style={{ color: "#ef4444", margin: "0 0 8px 0" }}>Blocked: {res.tool}</h3>
              <div style={{ fontSize: "0.9rem", color: "#f8fafc" }}>{res.reason || res.error || res.rule || "Policy Violation"}</div>
              {res.rule && <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 6 }}>Rule: <code>{res.rule}</code></div>}
              {res.confidence != null && <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 4 }}>Confidence: {Math.round(res.confidence * 100)}%</div>}
            </div>
          );
        }

        if (res.status === "error") {
          return (
            <div key={i} style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: 20, borderRadius: 12 }}>
              <h3 style={{ color: "#f59e0b", margin: "0 0 8px 0" }}>Error: {res.tool}</h3>
              <div style={{ fontSize: "0.9rem", color: "#f8fafc" }}>{res.error}</div>
            </div>
          );
        }

        const payload = res.result;
        if (!payload) return null;

        // If the tool result itself has an error field (e.g. insufficient balance)
        if (payload.error && !payload.success) {
          return (
            <div key={i} style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: 20, borderRadius: 12 }}>
              <h3 style={{ color: "#ef4444", margin: "0 0 8px 0" }}>Failed: {res.tool}</h3>
              <div style={{ fontSize: "0.9rem", color: "#f8fafc" }}>{payload.error}</div>
            </div>
          );
        }

        let CardComponent = DefaultJSONCard;

        switch (res.tool) {
          case "verify_kyc_document":      CardComponent = KYCProfileCard; break;
          case "analyze_cheque_image":     CardComponent = ChequeFraudCard; break;
          case "process_wire_transfer":    CardComponent = WireTransferCard; break;
          case "issue_corporate_card":     CardComponent = CorporateCard; break;
          case "detect_money_laundering":  CardComponent = AMLCheckCard; break;
          case "request_loan_approval":    CardComponent = LoanPricingCard; break;
          case "analyze_vendor_invoice":   CardComponent = InvoiceVerificationCard; break;
          case "process_crypto_swap":      CardComponent = CryptoSwapCard; break;
          case "sanctions_screening":      CardComponent = SanctionsCard; break;
          case "cross_border_payment":     CardComponent = CrossBorderCard; break;
          case "compliance_onboarding":    CardComponent = OnboardingCard; break;
          case "send_payment_notification": CardComponent = ToolPoisoningCard; break;
          default:                         CardComponent = DefaultJSONCard; break;
        }

        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {CardComponent === DefaultJSONCard && (
              <div style={{ padding: "10px 16px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 8, color: "#10b981", fontWeight: "bold", display: "inline-block", alignSelf: "flex-start" }}>
                Allowed & Executed: {res.tool}
              </div>
            )}
            <CardComponent tool={res.tool} data={payload} />
          </div>
        );
      })}
    </div>
  );
}
