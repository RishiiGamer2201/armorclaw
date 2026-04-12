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
      <div style={{ fontWeight: 800, italic: true, fontSize: "1.2rem", color: "#f8fafc" }}>ClawShield VIP</div>
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
      <span style={{ fontSize: "1.5rem" }}>{data.flagged ? "🚨" : "✅"}</span> 
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
          Debt-to-Income (DTI) Ratio: <strong>{data.dti_ratio?.toFixed(1)}%</strong>
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
            ✅ {data.msg}
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
      <div style={{ fontSize: "2rem", color: "#64748b" }}>➔</div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "1.5rem", color: "#10b981", fontWeight: "bold" }}>+{data.received?.toLocaleString(undefined, {maximumFractionDigits: 4})}</div>
        <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{data.to}</div>
      </div>
    </div>
  </div>
);

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

  // We only show custom UI for successful executions or Universal features
  // Loop through results and render cards
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "16px 0" }}>
      {executionData.results.map((res, i) => {
        // If there's an error block from the policy engine, we still show the timeline style or error
        if (res.status === "blocked") {
          return (
            <div key={i} style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: 20, borderRadius: 12 }}>
              <h3 style={{ color: "#ef4444", margin: "0 0 8px 0" }}>🚫 Blocked: {res.tool}</h3>
              <div style={{ fontSize: "0.9rem", color: "#f8fafc" }}>{res.error || res.rule || "Policy Violation"}</div>
            </div>
          );
        }

        const payload = res.result;
        if (!payload) return null;

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
          default:                         CardComponent = DefaultJSONCard; break;
        }

        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: "10px 16px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 8, color: "#10b981", fontWeight: "bold", display: "inline-block", alignSelf: "flex-start" }}>
              ✅ Allowed & Executed: {res.tool}
            </div>
            <CardComponent tool={res.tool} data={payload} />
          </div>
        );
      })}
    </div>
  );
}
