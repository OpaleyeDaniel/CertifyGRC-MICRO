import { Route, Routes } from "react-router-dom";
import NistDashboard from "@/pages/Dashboard";
import Assessment from "@/pages/Assessment";
import GapAnalysis from "@/pages/GapAnalysis";
import RiskAssessment from "@/pages/RiskAssessment";
import Evidence from "@/pages/Evidence";
import Report from "@/pages/Report";
import Review from "@/pages/Review";
import Improvement from "@/pages/Improvement";
import NotFound from "@/pages/NotFound";

/**
 * Internal routing tree of the NIST-CSF framework module.
 *
 * These routes are rendered under `basePath` (`/frameworks/nist-csf`)
 * by the shell. Each page continues to live in `client/pages/*` so
 * existing components keep working — this file is the framework's
 * authoritative entry point.
 */
export default function NistCsfRoutes() {
  return (
    <Routes>
      <Route index element={<NistDashboard />} />
      <Route path="dashboard" element={<NistDashboard />} />
      <Route path="assessment" element={<Assessment />} />
      <Route path="gap-analysis" element={<GapAnalysis />} />
      <Route path="risk-assessment" element={<RiskAssessment />} />
      <Route path="evidence" element={<Evidence />} />
      <Route path="report" element={<Report />} />
      <Route path="review" element={<Review />} />
      <Route path="improvement" element={<Improvement />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
