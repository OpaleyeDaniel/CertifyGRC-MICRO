import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { clearAllAppState } from "@/lib/clearAppState";
import { clearAllEvidenceFiles } from "@/lib/resetAssessmentLifecycle";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Assessment from "./pages/Assessment";
import GapAnalysis from "./pages/GapAnalysis";
import RiskAssessment from "./pages/RiskAssessment";
import Evidence from "./pages/Evidence";
import Report from "./pages/Report";
import Review from "./pages/Review";
import Improvement from "./pages/Improvement";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/settings/SettingsPage";

const queryClient = new QueryClient();

const AppContent = () => {
  // Minimal global notifier so same-tab localStorage clears/resets propagate to
  // localStorage-backed hooks (storage events do NOT fire in the same tab).
  useEffect(() => {
    const w = window as any;
    if (w.__storageNotifierInstalled) return;
    w.__storageNotifierInstalled = true;

    const ORIGINAL = {
      setItem: localStorage.setItem.bind(localStorage),
      removeItem: localStorage.removeItem.bind(localStorage),
      clear: localStorage.clear.bind(localStorage),
    };

    const dispatch = (detail: any) => {
      window.dispatchEvent(new CustomEvent("appStorageChanged", { detail }));
    };

    localStorage.setItem = ((key: string, value: string) => {
      ORIGINAL.setItem(key, value);
      dispatch({ type: "setItem", key });
    }) as any;

    localStorage.removeItem = ((key: string) => {
      ORIGINAL.removeItem(key);
      dispatch({ type: "removeItem", key });
    }) as any;

    localStorage.clear = (() => {
      ORIGINAL.clear();
      dispatch({ type: "clear" });
    }) as any;
  }, []);

  // Translate storage changes into the domain events that hooks already listen for.
  // Also covers DevTools/manual clears by checking on window focus.
  useEffect(() => {
    // We only need to help with same-tab clears/removals.
    // Regular writes already dispatch domain events from their owning hooks.
    const emitAllDomainSync = () => {
      window.dispatchEvent(new CustomEvent("assessmentDataChanged"));
      window.dispatchEvent(new CustomEvent("gapRemediationDataChanged"));
      window.dispatchEvent(new CustomEvent("riskAssessmentDataChanged"));
      window.dispatchEvent(new CustomEvent("auditorVerificationDataChanged"));
      window.dispatchEvent(new CustomEvent("continuousImprovementDataChanged"));
      window.dispatchEvent(new CustomEvent("revisionControlsUpdated"));
      window.dispatchEvent(new CustomEvent("revisionDataChanged"));
    };

    const emitDomainSyncForKey = (key: string) => {
      if (key === "nist_assessment_answers" || key === "nist_assessment_responses") {
        window.dispatchEvent(new CustomEvent("assessmentDataChanged"));
        return;
      }
      if (key === "gap_remediation_data" || key === "gap_remediation_evidence") {
        window.dispatchEvent(new CustomEvent("gapRemediationDataChanged"));
        return;
      }
      if (key === "risk_assessment_data") {
        window.dispatchEvent(new CustomEvent("riskAssessmentDataChanged"));
        return;
      }
      if (key === "auditor_verification_data") {
        window.dispatchEvent(new CustomEvent("auditorVerificationDataChanged"));
        return;
      }
      if (key === "continuous_improvement_data") {
        window.dispatchEvent(new CustomEvent("continuousImprovementDataChanged"));
        return;
      }
      if (key === "revision_controls_data") {
        window.dispatchEvent(new CustomEvent("revisionControlsUpdated"));
        return;
      }
      if (key === "revision_data") {
        window.dispatchEvent(new CustomEvent("revisionDataChanged"));
        return;
      }
    };

    const handleAppStorageChanged = (e: any) => {
      const detail = e?.detail || {};
      const key: string | undefined = detail.key;
      // Avoid event storms: we only broadcast on removals/clears.
      if (detail.type === "setItem") return;
      if (detail.type === "clear") {
        emitAllDomainSync();
        return;
      }
      if (detail.type === "removeItem" && key) {
        emitDomainSyncForKey(key);
      }
    };

    const handleFocus = () => {
      // DevTools "Clear site data" doesn't call JS APIs; on focus we resync.
      emitAllDomainSync();
    };

    window.addEventListener("appStorageChanged", handleAppStorageChanged as any);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("appStorageChanged", handleAppStorageChanged as any);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Expose console commands for quick actions
  useEffect(() => {
    (window as any).__clearAllEvidence = () => {
      console.log("🗑️ CLEARING ALL EVIDENCE FILES...");
      clearAllEvidenceFiles();
      console.log("✓ All evidence files removed. Reloading page...");
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    };

    (window as any).__clearAllLocalStorage = () => {
      console.log("🗑️ COMPLETE LOCALSTORAGE WIPE - REMOVING ALL DATA...\n");

      console.log("📋 ASSESSMENT DATA:");
      // Known assessment keys
      const assessmentKeys = [
        "nist_assessment_answers",
        "nist_assessment_responses",
        "gap_remediation_data",
        "gap_remediation_evidence",
        "risk_assessment_data",
      ];

      assessmentKeys.forEach((key) => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`  ✓ Removed: ${key}`);
        }
      });

      console.log("\n📋 COMMENT & REVIEW DATA:");
      // Comment & Review keys
      const reviewKeys = [
        "auditor_verification_data",
        "continuous_improvement_data",
        "revision_controls_data",
        "revision_data",
      ];

      reviewKeys.forEach((key) => {
        if (localStorage.getItem(key)) {
          const data = localStorage.getItem(key);
          console.log(`  ⚠️  Found: ${key} (${data?.length} chars)`);
          localStorage.removeItem(key);
          console.log(`  ✅ Removed: ${key}`);
        }
      });

      console.log("\n📋 CLEARING ALL REMAINING ITEMS:");
      // Clear ALL remaining localStorage items (catch anything else)
      const allKeys = Object.keys(localStorage);
      if (allKeys.length > 0) {
        allKeys.forEach((key) => {
          console.log(`  ✓ Cleared: ${key}`);
          localStorage.removeItem(key);
        });
      } else {
        console.log("  (no additional items)");
      }

      // Force clear as fallback
      console.log("\n🔄 FINALIZING CLEAR:");
      try {
        localStorage.clear();
        console.log("  ✓ localStorage.clear() executed");
      } catch (e) {
        console.error("  ⚠️  clear() failed:", e);
      }

      // Verify everything is gone
      const remaining = Object.keys(localStorage);
      console.log(`\n✅ VERIFICATION: ${remaining.length} items remaining\n`);

      if (remaining.length === 0) {
        console.log("🎉 SUCCESS: Complete wipe successful!");
        console.log("🔄 Reloading page in 1 second...");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.error("⚠️  WARNING: Items still remain:", remaining);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    console.log("💡 CONSOLE COMMANDS AVAILABLE:");
    console.log("   - __clearAllEvidence() : Clear only evidence files");
    console.log("   - __clearAllLocalStorage() : Clear ALL data from localStorage");
  }, []);

  // Handle reset flag in URL (?reset=true) or clear evidence (?clearEvidence=true)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.has("clearEvidence")) {
      console.log("🗑️ CLEARING ALL EVIDENCE FILES...");
      clearAllEvidenceFiles();
      console.log("✓ All evidence files removed. Reloading...");
      // Remove the clearEvidence parameter and reload
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } else if (params.has("reset")) {
      console.log("🔄 Resetting application to clean state...");
      clearAllAppState();
      console.log("✓ Application reset complete. Reloading...");
      // Remove the reset parameter and reload
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    }
  }, []);

  // Selective cleanup: Only clear old NIST assessment data, preserve auditor verification data
  useEffect(() => {
    try {
      console.log("🔄 Performing selective cleanup...");

      // Only clear specific old keys - DO NOT clear auditor_verification_data
      const legacyKeysToCheck = [
        "nist_assessment_answers",
        "nist_assessment_responses",
        "gap_remediation_evidence",
      ];

      let foundData = false;
      legacyKeysToCheck.forEach((key) => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`  ✓ Cleared legacy: ${key}`);
          foundData = true;
        }
      });

      if (foundData) {
        console.log("✓ Legacy data cleared. App ready.");
      } else {
        console.log("✓ App initialized.");
      }
    } catch (e) {
      console.error("Cleanup failed:", e);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* App Pages - With Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/assessment"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Assessment />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/gap-analysis"
              element={
                <ProtectedRoute>
                  <Layout>
                    <GapAnalysis />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/risk-assessment"
              element={
                <ProtectedRoute>
                  <Layout>
                    <RiskAssessment />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/evidence"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Evidence />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Report />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/review"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Review />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/improvement"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Improvement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* User settings pages */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SettingsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const App = () => (
  <AuthProvider>
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  </AuthProvider>
);

// Store root in window to prevent recreating on HMR
declare global {
  interface Window {
    __reactRoot?: ReturnType<typeof createRoot>;
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  // Reuse existing root if available (during HMR), otherwise create new one
  if (!window.__reactRoot) {
    window.__reactRoot = createRoot(rootElement);
  }
  window.__reactRoot.render(<App />);
}
