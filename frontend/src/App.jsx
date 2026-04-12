import { useState } from "react";
import "./index.css";
import LandingPage from "./components/LandingPage";
import Dashboard   from "./components/Dashboard";

export default function App() {
  const [currentView, setCurrentView] = useState("landing");

  return (
    <>
      {currentView === "landing" && (
        <LandingPage onLaunchDashboard={() => setCurrentView("dashboard")} />
      )}
      
      {currentView === "dashboard" && (
        <Dashboard onReturnHome={() => setCurrentView("landing")} />
      )}
    </>
  );
}
