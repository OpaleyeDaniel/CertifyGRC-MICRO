import { useMemo } from "react";
import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";
import { useGapRemediation } from "@/hooks/useGapRemediation";
import { useRiskAssessment } from "@/hooks/useRiskAssessment";
import { useRemediationEvidence } from "@/hooks/useRemediationEvidence";
import { useAuditorVerification } from "@/hooks/useAuditorVerification";
import { useContinuousImprovement } from "@/hooks/useContinuousImprovement";

/**
 * Produces the numeric badge counts that decorate the NIST-CSF
 * sidebar entries. Keys correspond to `FrameworkNavItem.id`.
 */
export function useNistNavBadges(): Record<string, number> {
  const { allQuestions } = useAssessmentEngine();
  const { allRemediations } = useGapRemediation();
  const { allRiskAssessments } = useRiskAssessment();
  const { remediations } = useRemediationEvidence();
  const { getAllVerifications } = useAuditorVerification();
  const { getRevisionRequiredItems } = useContinuousImprovement();

  return useMemo(() => {
    const assessment = allQuestions.filter((q) => !q.userAnswer).length;

    const gapAnalysis = allQuestions.filter((q) => {
      const hasGap = q.userAnswer === "Partial" || q.userAnswer === "No";
      if (!hasGap) return false;
      const remediation = allRemediations[q.id];
      return !remediation || remediation.status === "Open";
    }).length;

    const completedRiskIds = new Set(
      Object.values(allRiskAssessments)
        .filter((r) => r.status === "Completed")
        .map((r) => r.questionId),
    );
    const riskAssessment = allQuestions.filter((q) => {
      if (q.userAnswer !== "No" && q.userAnswer !== "Partial") return false;
      const remediation = allRemediations[q.id];
      const treated = remediation && remediation.status === "Treated";
      return treated && !completedRiskIds.has(q.id);
    }).length;

    const evidence =
      allQuestions.reduce(
        (count, q) =>
          count +
          (q.evidenceFiles?.length ??
            (q.evidenceUrl ? 1 : 0)),
        0,
      ) +
      remediations.reduce(
        (count, r) => count + (r.evidenceFiles?.length ?? 0),
        0,
      );

    const report = allQuestions.filter((q) => q.userAnswer).length;

    const review = getAllVerifications().filter(
      (v) => v.reviewStatus === "Pending Review",
    ).length;

    const improvement = getRevisionRequiredItems().length;

    return {
      assessment,
      "gap-analysis": gapAnalysis,
      "risk-assessment": riskAssessment,
      evidence,
      report,
      review,
      improvement,
    };
  }, [
    allQuestions,
    allRemediations,
    allRiskAssessments,
    remediations,
    getAllVerifications,
    getRevisionRequiredItems,
  ]);
}
