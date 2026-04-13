import { useState } from "react";
import "./index.css";
import LandingPage   from "./components/LandingPage";
import Dashboard     from "./components/Dashboard";
import Sidebar       from "./components/Sidebar";
import AuditLogTable from "./components/AuditLogTable";
import FeaturePages  from "./components/FeaturePages";

const FEATURE_IDS = [
  "cheque", "wire", "card", "kyc", "aml",
  "freeze", "crypto", "invoice", "audit-tx", "loan",
  "sanctions", "cross-border", "onboarding", "delegation",
];

export default function App() {
  const [currentView, setCurrentView] = useState("landing");

  const isFeaturePage = currentView.startsWith("feature-");
  const featureId = isFeaturePage ? currentView.replace("feature-", "") : null;
  const showSidebar = currentView !== "landing";

  return (
    <>
      {currentView === "landing" && (
        <LandingPage onLaunchDashboard={() => setCurrentView("dashboard")} />
      )}

      {showSidebar && (
        <div className="app-layout">
          <Sidebar currentView={currentView} onNavigate={setCurrentView} />
          <div className="dashboard-content">
            {currentView === "dashboard" && (
              <Dashboard onReturnHome={() => setCurrentView("landing")} />
            )}

            {currentView === "audit" && (
              <div style={{ padding: 24 }}>
                <div className="feature-page-header">
                  <h1 className="feature-page-title">Audit Log</h1>
                  <p className="feature-page-desc">
                    Complete enforcement trail across all features and prompts.
                  </p>
                </div>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Enforcement Audit Trail</span>
                  </div>
                  <div className="card-body">
                    <AuditLogTable />
                  </div>
                </div>
              </div>
            )}

            {isFeaturePage && (
              <FeaturePages featureId={featureId} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
