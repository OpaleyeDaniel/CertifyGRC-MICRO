import { Navigate, Route, Routes } from "react-router-dom";
import { IsoStoreProvider } from "./hooks/useIsoStore";
import IsoOverview from "@/pages/frameworks/iso27001/IsoOverview";
import IsoAssessmentShell from "@/pages/frameworks/iso27001/assessment/IsoAssessmentShell";
import IsoSoA from "@/pages/frameworks/iso27001/IsoSoA";
import IsoGapAnalysis from "@/pages/frameworks/iso27001/IsoGapAnalysis";
import IsoRiskAssessment from "@/pages/frameworks/iso27001/IsoRiskAssessment";
import IsoRiskTreatment from "@/pages/frameworks/iso27001/IsoRiskTreatment";
import IsoEvidence from "@/pages/frameworks/iso27001/IsoEvidence";
import IsoInternalAudit from "@/pages/frameworks/iso27001/IsoInternalAudit";
import IsoManagementReview from "@/pages/frameworks/iso27001/IsoManagementReview";
import IsoCorrectiveActions from "@/pages/frameworks/iso27001/IsoCorrectiveActions";
import IsoReports from "@/pages/frameworks/iso27001/IsoReports";
import IsoCommentsReview from "@/pages/frameworks/iso27001/IsoCommentsReview";
import IsoContinuousImprovement from "@/pages/frameworks/iso27001/IsoContinuousImprovement";
import IsoSettings from "@/pages/frameworks/iso27001/IsoSettings";
import NotFound from "@/pages/NotFound";

const ISO_BASE = "/frameworks/iso27001";

/**
 * Internal routing tree of the ISO 27001:2022 framework module.
 * All routes are rendered under `/frameworks/iso27001/*`. Every page is
 * wrapped by the IsoStoreProvider so state (assessment answers, SoA,
 * risks, evidence, audits, findings, reviews, comments) is shared
 * across the workspace.
 */
export default function Iso27001Routes() {
  return (
    <IsoStoreProvider>
      <Routes>
        <Route index element={<IsoOverview />} />
        <Route path="dashboard" element={<IsoOverview />} />
        <Route path="assessment/*" element={<IsoAssessmentShell />} />
        <Route path="soa" element={<IsoSoA />} />
        <Route path="gap-analysis" element={<IsoGapAnalysis />} />
        <Route path="risk-assessment" element={<IsoRiskAssessment />} />
        <Route path="risk-treatment" element={<IsoRiskTreatment />} />
        <Route path="evidence" element={<IsoEvidence />} />
        <Route path="internal-audit" element={<IsoInternalAudit />} />
        <Route path="management-review" element={<IsoManagementReview />} />
        <Route path="corrective-actions" element={<IsoCorrectiveActions />} />
        <Route path="report" element={<IsoReports />} />
        <Route path="review" element={<IsoCommentsReview />} />
        <Route path="improvement" element={<IsoContinuousImprovement />} />
        <Route path="reports" element={<Navigate to={`${ISO_BASE}/report`} replace />} />
        <Route path="comments-review" element={<Navigate to={`${ISO_BASE}/review`} replace />} />
        <Route path="continuous-improvement" element={<Navigate to={`${ISO_BASE}/improvement`} replace />} />
        <Route path="settings" element={<IsoSettings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </IsoStoreProvider>
  );
}
