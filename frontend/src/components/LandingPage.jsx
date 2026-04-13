import { useState, useEffect } from "react";

const ENFORCEMENT_FEATURES = [
  { title: "Intent Drift Detection", desc: "Merkle proof fails when agent deviates from approved plan", icon: "\u26A0", color: "#ef4444" },
  { title: "Cascade Prevention", desc: "Compromised agent in a chain cannot poison downstream agents", icon: "\u26D3", color: "#f59e0b" },
  { title: "Tool Poisoning Defense", desc: "Hidden actions in tool responses intercepted via Merkle verification", icon: "\u2622", color: "#ef4444" },
  { title: "Bounded Delegation", desc: "Sub-agents restricted to scope-limited tool access", icon: "\u{1F512}", color: "#6366f1" },
  { title: "AI Fraud Detection", desc: "Two-phase: regex + Gemini deep analysis for novel attacks", icon: "\u{1F916}", color: "#10b981" },
  { title: "DEFCON Auto-Tightening", desc: "Policy hardens automatically when injection attacks detected", icon: "\u{1F6E1}", color: "#f59e0b" },
];

const PIPELINE = [
  { num: "01", title: "LLM Planner", desc: "Gemini 2.5 Flash converts prompt into structured JSON plan", color: "#6366f1" },
  { num: "02", title: "Merkle Tree", desc: "SHA256 hash tree + HMAC-signed intent token with 600s expiry", color: "#8b5cf6" },
  { num: "03", title: "MoE Gatekeeper", desc: "5 AI experts vote independently (Compliance, Risk, Fraud, Data, Temporal)", color: "#ec4899" },
  { num: "04", title: "Policy Engine", desc: "Deterministic JSON rules check tickers, limits, blocked operations", color: "#f59e0b" },
  { num: "05", title: "Merkle Proof", desc: "Each step verified cryptographically against the original plan", color: "#ef4444" },
  { num: "06", title: "Execute / Block", desc: "ALL pass = execute. ANY fail = block + full audit log", color: "#10b981" },
];

const STATS = [
  { value: "21", label: "Financial Tools" },
  { value: "6", label: "Enforcement Layers" },
  { value: "5", label: "AI Expert Agents" },
  { value: "9/10", label: "Attacks Blocked" },
  { value: "<5ms", label: "Enforcement Latency" },
  { value: "0", label: "Unverified Executions" },
];

const ATTACK_DEMOS = [
  { attack: "Prompt Injection", blocked: "FraudExpert", result: "BLOCKED" },
  { attack: "SQL Injection", blocked: "FraudExpert", result: "BLOCKED" },
  { attack: "Scope Escalation", blocked: "PolicyEngine", result: "BLOCKED" },
  { attack: "Data Exfiltration", blocked: "DataExpert", result: "BLOCKED" },
  { attack: "Unauthorized Ticker", blocked: "PolicyEngine", result: "BLOCKED" },
  { attack: "Short Selling", blocked: "PolicyEngine", result: "BLOCKED" },
  { attack: "Wire Over Limit", blocked: "PolicyEngine", result: "BLOCKED" },
  { attack: "Delegation Escape", blocked: "DelegationMgr", result: "BLOCKED" },
  { attack: "Allowed Quote", blocked: "-", result: "ALLOWED" },
];

export default function LandingPage({ onLaunchDashboard }) {
  const [activeAttack, setActiveAttack] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActiveAttack(p => (p + 1) % ATTACK_DEMOS.length), 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="landing-container" style={{ background: "#0a0a0f", color: "#e2e8f0", minHeight: "100vh" }}>

      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#f8fafc", letterSpacing: -0.5 }}>ClawShield Finance</div>
        <button onClick={onLaunchDashboard} style={{
          padding: "10px 24px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff",
          border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(99,102,241,0.4)", transition: "transform 0.2s",
        }}>Launch Dashboard</button>
      </nav>

      {/* Hero */}
      <header style={{ textAlign: "center", padding: "80px 24px 60px", position: "relative", overflow: "hidden" }}>
        {/* Glow effect */}
        <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 20, border: "1px solid rgba(99,102,241,0.4)", background: "rgba(99,102,241,0.1)", fontSize: "0.75rem", fontWeight: 600, color: "#818cf8", marginBottom: 24, letterSpacing: 1 }}>
          ARMORIQ x OPENCLAW HACKATHON
        </div>

        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.1, marginBottom: 20, background: "linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Intent Enforcement for<br/>Autonomous Financial Agents
        </h1>

        <p style={{ fontSize: "1.1rem", color: "#94a3b8", maxWidth: 620, margin: "0 auto 32px", lineHeight: 1.6 }}>
          The LLM reasons freely. The enforcement pipeline verifies cryptographically.
          No action reaches execution without passing every gate.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onLaunchDashboard} style={{
            padding: "14px 32px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff",
            border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
            boxShadow: "0 4px 25px rgba(99,102,241,0.5)",
          }}>Launch Mission Control</button>
          <button onClick={onLaunchDashboard} style={{
            padding: "14px 32px", background: "rgba(255,255,255,0.05)", color: "#e2e8f0",
            border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, fontWeight: 600, fontSize: "0.95rem", cursor: "pointer",
          }}>Run Red Agent Suite</button>
        </div>
      </header>

      {/* Stats Bar */}
      <section style={{ display: "flex", justifyContent: "center", gap: 0, flexWrap: "wrap", padding: "0 24px 48px", maxWidth: 900, margin: "0 auto" }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ flex: "1 1 140px", textAlign: "center", padding: "20px 16px", borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#f8fafc", fontFamily: "monospace" }}>{s.value}</div>
            <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* Live Attack Demo */}
      <section style={{ padding: "48px 24px", maxWidth: 800, margin: "0 auto" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, textAlign: "center", marginBottom: 8, color: "#f8fafc" }}>Live Enforcement</h2>
        <p style={{ textAlign: "center", color: "#64748b", marginBottom: 28, fontSize: "0.85rem" }}>Red Agent attacks fired continuously. Every one intercepted.</p>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          {ATTACK_DEMOS.map((a, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 20px", fontSize: "0.85rem",
              background: i === activeAttack ? "rgba(99,102,241,0.08)" : "transparent",
              borderLeft: i === activeAttack ? "3px solid #6366f1" : "3px solid transparent",
              transition: "all 0.3s",
            }}>
              <span style={{ fontWeight: i === activeAttack ? 700 : 400, color: i === activeAttack ? "#f8fafc" : "#64748b" }}>{a.attack}</span>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: "monospace" }}>{a.blocked}</span>
                <span style={{
                  fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                  background: a.result === "BLOCKED" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                  color: a.result === "BLOCKED" ? "#ef4444" : "#10b981",
                }}>{a.result}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline */}
      <section style={{ padding: "48px 24px 60px", maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, textAlign: "center", marginBottom: 8, color: "#f8fafc" }}>6-Layer Enforcement Pipeline</h2>
        <p style={{ textAlign: "center", color: "#64748b", marginBottom: 32, fontSize: "0.85rem" }}>Every action passes through ALL layers. Any failure = BLOCK.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {PIPELINE.map((step) => (
            <div key={step.num} style={{
              padding: 20, borderRadius: 12, background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -8, right: -8, fontSize: "3rem", fontWeight: 900, color: "rgba(255,255,255,0.03)", fontFamily: "monospace" }}>{step.num}</div>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: step.color, marginBottom: 12 }} />
              <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 6, color: "#f8fafc" }}>{step.title}</div>
              <div style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Enforcement Features */}
      <section style={{ padding: "48px 24px 60px", maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, textAlign: "center", marginBottom: 8, color: "#f8fafc" }}>Enforcement Capabilities</h2>
        <p style={{ textAlign: "center", color: "#64748b", marginBottom: 32, fontSize: "0.85rem" }}>Beyond if-else. Real cryptographic proofs. AI-powered detection.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {ENFORCEMENT_FEATURES.map((f, i) => (
            <div key={i} style={{
              padding: "18px 20px", borderRadius: 10, background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 14, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#f8fafc", marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: "0.78rem", color: "#64748b", lineHeight: 1.4 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Principle */}
      <section style={{ padding: "48px 24px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px", borderRadius: 16, background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)" }}>
          <p style={{ fontSize: "1.15rem", fontStyle: "italic", color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>
            "The future risk isn't AI that refuses to act.<br/>It's AI that acts without permission."
          </p>
          <p style={{ marginTop: 16, fontSize: "0.85rem", color: "#6366f1", fontWeight: 600 }}>
            This is not a trading bot. This is the shield.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "32px 24px", color: "#334155", fontSize: "0.8rem", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        Built for Apogee '26 -- BITS Pilani | ArmorIQ x OpenClaw Hackathon
      </footer>
    </div>
  );
}
