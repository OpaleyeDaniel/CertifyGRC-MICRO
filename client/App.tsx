import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { useEffect } from "react";
import { OmegaLayout } from "@/components/layout/OmegaLayout";
import { FrameworkLayout } from "@/components/layout/FrameworkLayout";
import { clearAllAppState } from "@/lib/clearAppState";
import { clearAllEvidenceFiles } from "@/lib/resetAssessmentLifecycle";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Omega root platform pages — the cross-framework command center.
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OmegaDashboard from "./pages/OmegaDashboard";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/settings/SettingsPage";
import FrameworksHub from "./pages/frameworks/FrameworksHub";

// Omega global sidebar pages — aggregate data from every framework.
import OmegaAssessment from "./pages/omega/OmegaAssessment";
import OmegaGapAnalysis from "./pages/omega/OmegaGapAnalysis";
import OmegaRiskAssessment from "./pages/omega/OmegaRiskAssessment";
import OmegaEvidence from "./pages/omega/OmegaEvidence";
import OmegaReport from "./pages/omega/OmegaReport";
import OmegaReview from "./pages/omega/OmegaReview";
import OmegaImprovement from "./pages/omega/OmegaImprovement";
import OmegaCrossMapping from "./pages/omega/OmegaCrossMapping";
import OmegaAuditReadiness from "./pages/omega/OmegaAuditReadiness";
import OmegaNotifications from "./pages/omega/OmegaNotifications";

// Framework registry — all framework-specific routes are derived from here.
import { REGISTERED_FRAMEWORKS } from "@/frameworks/registry";

const queryClient = new QueryClient();

/**
 * Dynamic framework-workspace routes — one per registered framework.
 * Inactive / coming-soon frameworks redirect back to the hub so no
 * broken route ever gets mounted.
 */
const frameworkWorkspaceRoutes = REGISTERED_FRAMEWORKS.map((framework) => {
  if (framework.status !== "active" || !framework.Routes) {
    return (
      <Route
        key={framework.id}
        path={`${framework.basePath}/*`}
        element={<Navigate to="/frameworks" replace />}
      />
    );
  }
  const FrameworkComponent = framework.Routes;
  return (
    <Route
      key={framework.id}
      path={`${framework.basePath}/*`}
      element={
        <ProtectedRoute>
          <FrameworkLayout framework={framework}>
            <FrameworkComponent />
          </FrameworkLayout>
        </ProtectedRoute>
      }
    />
  );
});

/**
 * Legacy absolute paths declared by any framework get redirected into
 * the owning framework — keeps pre-refactor deep links working.
 */
const legacyRedirectRoutes = REGISTERED_FRAMEWORKS.flatMap((framework) =>
  (framework.legacyRedirects ?? []).map((redirect) => {
    const toPath = `${framework.basePath}/${redirect.to.replace(/^\//, "")}`;
    return (
      <Route
        key={`${framework.id}-${redirect.from}`}
        path={redirect.from}
        element={<Navigate to={toPath} replace />}
      />
    );
  }),
);

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
      const reviewKeys = [
        "auditor_verification_data",
        "continuous_improvement_data",
        "revision_controls_data",
        "revision_data",
      ];
      reviewKeys.forEach((key) => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`  ✅ Removed: ${key}`);
        }
      });
      Object.keys(localStorage).forEach((key) => {
        localStorage.removeItem(key);
      });
      try {
        localStorage.clear();
      } catch (e) {
        console.error("  ⚠️  clear() failed:", e);
      }
      setTimeout(() => {
        window.location.reload();
      }, 500);
    };
  }, []);

  // Handle reset flag in URL (?reset=true) or clear evidence (?clearEvidence=true)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("clearEvidence")) {
      clearAllEvidenceFiles();
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } else if (params.has("reset")) {
      clearAllAppState();
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    }
  }, []);

  // Selective cleanup of legacy storage keys retained for backward compat.
  useEffect(() => {
    try {
      const legacyKeysToCheck = [
        "nist_assessment_answers",
        "nist_assessment_responses",
        "gap_remediation_evidence",
      ];
      legacyKeysToCheck.forEach((key) => {
        if (localStorage.getItem(key)) {
          // Intentionally left blank — legacy keys are preserved so the
          // NIST-CSF hooks can hydrate from them.
        }
      });
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
            {/* Public landing / marketing (kept as-is). */}
            <Route path="/landing" element={<Index />} />

            {/* Auth. */}
            <Route path="/login" element={<LoginPage />} />

            {/* Omega root (GRC operating system) shell. */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <OmegaLayout>
                    <OmegaDashboard />
                  </OmegaLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <OmegaLayout>
                    <OmegaDashboard />
                  </OmegaLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/frameworks"
              element={
                <ProtectedRoute>
                  <OmegaLayout>
                    <FrameworksHub />
                  </OmegaLayout>
                </ProtectedRoute>
              }
            />

            {/* Omega global cross-framework pages. */}
            <Route
              path="/assessment"
              element={
                <ProtectedRoute>
                  <OmegaLayout>
                    <OmegaAssessment />
                  </OmegaLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/gap-analysis"
              element={
                <ProtectedRoute>
                  <OmegaLayout>
                    <OmegaGapAnalysis />
                  </OmegaLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/risk"
              element={
                <ProtectedRoute>
                  <OmegaLayout>
                    <OmegaRiskAssessment />
                  </OmegaLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/risk-assessment"
              element={<Navigate to="/risk" replace />}
            />
            <Route
              path="/evidence"
              element={
                <ProtectedRoute>
                  <OmegaLayout>
                    <OmegaEvidence />
                  </OmegaLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute>
                  <OmegaLayout>
                    <OmegaReport />
                  </OmegaLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/review"
              element={
                <ProtectedRoute>
                  <OmegaLayout>
                    <OmegaReview />
                  </OmegaLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/improvement"
              element={
                <ProtectedRoute>
                  <OmegaLayout>
                    <OmegaImprovement />
                  </OmegaLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cross-mapping"
              element={
                <ProtectedRoute>
                  <OmegaLayout>
                    <OmegaCrossMapping />
                  </OmegaLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-readiness"
              element={
                <ProtectedRoute>
                  <OmegaLayout>
                    <OmegaAuditReadiness />
                  </OmegaLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <OmegaLayout>
                    <OmegaNotifications />
                  </OmegaLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <OmegaLayout>
                    <ProfilePage />
                  </OmegaLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <OmegaLayout>
                    <SettingsPage />
                  </OmegaLayout>
                </ProtectedRoute>
              }
            />

            {/* Legacy absolute paths claimed by frameworks (if any). */}
            {legacyRedirectRoutes}

            {/* Dynamic framework workspaces. */}
            {frameworkWorkspaceRoutes}

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
  if (!window.__reactRoot) {
    window.__reactRoot = createRoot(rootElement);
  }
  window.__reactRoot.render(<App />);
}
