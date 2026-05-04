import { Route, Routes } from "react-router-dom";
import IsoAssessmentOverview from "./IsoAssessmentOverview";
import IsoAssessmentClauseHub from "./IsoAssessmentClauseHub";
import IsoAssessmentClauseQuestionFlow from "./IsoAssessmentClauseQuestionFlow";
import IsoAssessmentAnnexHub from "./IsoAssessmentAnnexHub";
import IsoAssessmentAnnexQuestionFlow from "./IsoAssessmentAnnexQuestionFlow";
import NotFound from "@/pages/NotFound";

/**
 * Assessment hierarchy:
 * 1) Overview → 2) Clause/Annex hub → 3) Subcategory modal → 4) Focused question flow
 */
export default function IsoAssessmentShell() {
  return (
    <Routes>
      <Route index element={<IsoAssessmentOverview />} />
      <Route path="clause/:clauseNumber/section/:sectionRef" element={<IsoAssessmentClauseQuestionFlow />} />
      <Route path="clause/:clauseNumber" element={<IsoAssessmentClauseHub />} />
      <Route path="annex/:domain/control/:controlRef" element={<IsoAssessmentAnnexQuestionFlow />} />
      <Route path="annex/:domain" element={<IsoAssessmentAnnexHub />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
