import { useMemo } from "react";
import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";
import { useGapRemediation } from "@/hooks/useGapRemediation";
import { useRiskAssessment } from "@/hooks/useRiskAssessment";
import { useRemediationEvidence } from "@/hooks/useRemediationEvidence";
import { useAuditorVerification } from "@/hooks/useAuditorVerification";
import { useContinuousImprovement } from "@/hooks/useContinuousImprovement";
import type {
  FrameworkActivityEntry,
  FrameworkAssessmentRecord,
  FrameworkAuditReadiness,
  FrameworkBlocker,
  FrameworkEvidenceRecord,
  FrameworkGapRecord,
  FrameworkImprovementRecord,
  FrameworkReviewRecord,
  FrameworkRiskRecord,
  FrameworkSummary,
  RiskLevel,
} from "@/frameworks/types";

const NIST_BASE = "/frameworks/nist-csf";
const STALE_EVIDENCE_DAYS = 180;

function daysBetween(from: string | undefined, to: number) {
  if (!from) return 0;
  const ts = new Date(from).getTime();
  if (!Number.isFinite(ts)) return 0;
  return Math.floor((to - ts) / 86_400_000);
}

function normaliseRiskLevel(level: string | undefined): RiskLevel {
  const upper = (level || "").toUpperCase();
  if (upper === "CRITICAL") return "CRITICAL";
  if (upper === "HIGH") return "HIGH";
  if (upper === "MEDIUM") return "MEDIUM";
  return "LOW";
}

function readinessLabel(
  score: number | null,
): FrameworkAuditReadiness["label"] {
  if (score === null) return "Unknown";
  if (score >= 85) return "Audit-ready";
  if (score >= 65) return "Close";
  if (score >= 35) return "In progress";
  return "Not ready";
}

/**
 * Derives Omega's complete summary view of the NIST-CSF framework
 * from the framework's existing localStorage-backed hooks. Every
 * normalized record Omega renders on its global pages is computed
 * here — there is no other hand-off between root and framework.
 */
export function useNistSummary(): FrameworkSummary {
  const { allQuestions } = useAssessmentEngine();
  const { allRemediations } = useGapRemediation();
  const { allRiskAssessments } = useRiskAssessment();
  const { remediations: remediationEvidence } = useRemediationEvidence();
  const { getAllVerifications } = useAuditorVerification();
  const { getAllItems } = useContinuousImprovement();

  return useMemo<FrameworkSummary>(() => {
    const now = Date.now();
    const verifications = getAllVerifications();
    const verificationByQuestionId = new Map(
      verifications.map((v) => [v.questionId, v]),
    );
    const ciItems = getAllItems();

    /* ------------- Assessments ------------- */
    const assessments: FrameworkAssessmentRecord[] = allQuestions.map((q) => {
      const verification = verificationByQuestionId.get(q.id);
      let status: FrameworkAssessmentRecord["status"] = "not-started";
      if (verification?.status === "approved") status = "approved";
      else if (q.userAnswer) status = "answered";
      else if (q.comment || (q.evidenceFiles?.length ?? 0) > 0) status = "in-progress";

      return {
        id: q.id,
        controlId: q.nist_id,
        title: q.question,
        domain: q.function,
        category: q.category,
        status,
        answer: q.userAnswer ?? null,
        maturityScore: q.maturityScore ?? null,
        owner: undefined,
        dueDate: null,
        updatedAt: verification?.approvedAt ?? verification?.submittedForReviewAt,
        href: `${NIST_BASE}/assessment?tab=assessment&nist=${encodeURIComponent(q.nist_id)}`,
      };
    });

    const totalControls = assessments.length;
    const assessedControls = assessments.filter(
      (a) => a.status !== "not-started",
    ).length;
    const assessmentProgress =
      totalControls === 0 ? null : Math.round((assessedControls / totalControls) * 100);

    /* ------------- Gaps ------------- */
    const gaps: FrameworkGapRecord[] = [];
    allQuestions.forEach((q) => {
      if (q.userAnswer !== "No" && q.userAnswer !== "Partial") return;
      const remediation = allRemediations[q.id];
      const status: FrameworkGapRecord["status"] =
        !remediation || remediation.status === "Open"
          ? "open"
          : remediation.status === "Treated"
            ? "treated"
            : "in-progress";
      const priority = remediation?.priority ?? "Medium";
      const severity: FrameworkGapRecord["severity"] =
        priority === "Critical"
          ? "critical"
          : priority === "High"
            ? "high"
            : priority === "Low"
              ? "low"
              : "medium";
      const ageDays = daysBetween(remediation?.createdAt, now);
      const overdue =
        status !== "treated" &&
        !!remediation?.expectedCompletionDate &&
        new Date(remediation.expectedCompletionDate).getTime() < now;

      gaps.push({
        id: q.id,
        controlId: q.nist_id,
        title: q.question,
        domain: q.function,
        severity,
        priority,
        status,
        expectedCompletionDate: remediation?.expectedCompletionDate ?? null,
        ageDays,
        overdue,
        updatedAt: remediation?.updatedAt,
        href: `${NIST_BASE}/gap-analysis?controlId=${encodeURIComponent(q.id)}`,
      });
    });

    const openGaps = gaps.filter((g) => g.status === "open").length;
    const pendingRemediations = gaps.filter(
      (g) => g.status === "open" || g.status === "in-progress",
    ).length;
    const overdueRemediations = gaps.filter((g) => g.overdue).length;

    /* ------------- Risks ------------- */
    const risks: FrameworkRiskRecord[] = Object.values(allRiskAssessments).map(
      (r) => ({
        id: r.riskId,
        controlId: r.nistId,
        title: r.gapDescription || `${r.nistId} risk`,
        asset: r.riskDescription.asset || undefined,
        threat: r.riskDescription.threat || undefined,
        vulnerability: r.riskDescription.vulnerability || undefined,
        inherentLevel: normaliseRiskLevel(r.inherentRiskLevel),
        residualLevel: normaliseRiskLevel(r.postTreatmentRiskLevel),
        likelihood: r.preTreatmentAssessment.likelihood,
        impact: r.preTreatmentAssessment.impact,
        status:
          r.status === "Completed"
            ? "completed"
            : r.status === "In Progress"
              ? "in-progress"
              : "pending",
        owner: r.riskDescription.riskOwner || undefined,
        treatmentOption: r.treatmentPlan.treatmentOption || undefined,
        updatedAt: r.updatedAt,
        href: `${NIST_BASE}/risk-assessment?questionId=${encodeURIComponent(r.questionId)}&nist=${encodeURIComponent(r.nistId)}`,
      }),
    );

    const criticalRisks = risks.filter(
      (r) => r.residualLevel === "HIGH" || r.residualLevel === "CRITICAL",
    ).length;

    /* ------------- Evidence ------------- */
    const evidence: FrameworkEvidenceRecord[] = [];
    allQuestions.forEach((q) => {
      (q.evidenceFiles ?? []).forEach((f, idx) => {
        const uploadedAt = f.attachedAt ?? new Date().toISOString();
        const isCloud = f.sourceKind === "cloud";
        evidence.push({
          id: `ev-a-${q.id}-${idx}`,
          name: f.name,
          type: undefined,
          sizeBytes: f.size,
          source: isCloud ? "external" : "assessment",
          controlId: q.nist_id,
          controlTitle: q.question,
          uploadedAt,
          stale: false,
          href: `${NIST_BASE}/evidence?q=${encodeURIComponent(f.name || q.nist_id)}`,
          cloudProviderId: f.providerId,
          cloudProviderLabel: f.providerId?.replace(/_/g, " "),
          evidenceMode: f.storageMode,
        });
      });
      if (q.evidenceUrl && (!q.evidenceFiles || q.evidenceFiles.length === 0)) {
        evidence.push({
          id: `ev-a-${q.id}-legacy`,
          name: q.evidenceUrl,
          source: "assessment",
          controlId: q.nist_id,
          controlTitle: q.question,
          uploadedAt: new Date().toISOString(),
          stale: false,
          href: `${NIST_BASE}/evidence`,
        });
      }
    });
    remediationEvidence.forEach((r) => {
      (r.evidenceFiles ?? []).forEach((f, idx) => {
        const uploadedAt = f.uploadedAt ?? new Date().toISOString();
        const stale = daysBetween(uploadedAt, now) > STALE_EVIDENCE_DAYS;
        const isCloud = f.sourceKind === "cloud";
        evidence.push({
          id: `ev-r-${r.questionId}-${idx}`,
          name: f.name,
          type: f.type,
          sizeBytes: f.size,
          source: isCloud ? "external" : "remediation",
          controlId: r.nistId,
          controlTitle: r.question,
          uploadedAt,
          stale,
          href: `${NIST_BASE}/evidence?q=${encodeURIComponent(f.name || r.nistId)}`,
          cloudProviderId: f.providerId,
          cloudProviderLabel: f.providerId?.replace(/_/g, " "),
          evidenceMode: f.storageMode,
        });
      });
    });

    const controlsWithEvidence = new Set(
      evidence.map((e) => e.controlId).filter((id): id is string => !!id),
    );
    const evidenceCoverage =
      totalControls === 0
        ? null
        : Math.round((controlsWithEvidence.size / totalControls) * 100);

    /* ------------- Reviews ------------- */
    const reviews: FrameworkReviewRecord[] = verifications.map((v) => {
      const question = allQuestions.find((q) => q.id === v.questionId);
      const commentCount =
        (v.assessmentEvidenceComments?.length ?? 0) +
        (v.remediationEvidenceComments?.length ?? 0) +
        (v.gapComments?.length ?? 0) +
        (v.riskComments?.length ?? 0);
      const reviewStatus: FrameworkReviewRecord["reviewStatus"] =
        v.status === "approved"
          ? "approved"
          : v.status === "revision_requested"
            ? "revision-requested"
            : "pending";
      return {
        id: v.questionId,
        controlId: v.nistId,
        title: question?.question ?? v.nistId,
        domain: question?.function ?? "—",
        reviewStatus,
        submittedAt: v.submittedForReviewAt ?? null,
        resolvedAt: v.approvedAt ?? v.revisionRequestedAt ?? null,
        commentCount,
        lastComment: v.auditorOverallComment || v.auditorComment,
        updatedAt:
          v.approvedAt || v.revisionRequestedAt || v.submittedForReviewAt,
        href: `${NIST_BASE}/review?q=${encodeURIComponent(v.nistId)}`,
      };
    });
    const pendingReviews = reviews.filter(
      (r) => r.reviewStatus === "pending",
    ).length;
    const approvedReviews = reviews.filter(
      (r) => r.reviewStatus === "approved",
    ).length;

    /* ------------- Improvements ------------- */
    const improvements: FrameworkImprovementRecord[] = ciItems.map((item) => ({
      id: item.controlId,
      controlId: item.nistId,
      title: item.controlTitle,
      domain: item.function,
      status:
        item.status === "revision_required"
          ? "revision-required"
          : item.status === "resubmitted"
            ? "resubmitted"
            : "in-progress",
      auditorComment:
        item.auditorOverallComment ?? item.auditorComment ?? undefined,
      reviewDate: item.reviewDate,
      owner: item.reviewedBy ?? undefined,
      updatedAt: item.updatedAt,
      href: `${NIST_BASE}/improvement?q=${encodeURIComponent(item.nistId)}`,
    }));

    /* ------------- Readiness ------------- */
    const readinessScore =
      totalControls === 0
        ? null
        : Math.round((approvedReviews / totalControls) * 100);

    const missingEvidence = Math.max(
      0,
      assessedControls - controlsWithEvidence.size,
    );

    const blockers: FrameworkBlocker[] = [];
    if (missingEvidence > 0) {
      blockers.push({
        id: "nist-missing-evidence",
        kind: "missing-evidence",
        label: "Assessed controls without evidence",
        count: missingEvidence,
        severity: missingEvidence > 10 ? "high" : "medium",
        href: `${NIST_BASE}/evidence`,
      });
    }
    if (pendingReviews > 0) {
      blockers.push({
        id: "nist-pending-review",
        kind: "pending-review",
        label: "Controls awaiting auditor review",
        count: pendingReviews,
        severity: pendingReviews > 5 ? "high" : "medium",
        href: `${NIST_BASE}/review`,
      });
    }
    if (openGaps > 0) {
      blockers.push({
        id: "nist-open-gaps",
        kind: "open-gap",
        label: "Untriaged gaps",
        count: openGaps,
        severity: openGaps > 5 ? "high" : "medium",
        href: `${NIST_BASE}/gap-analysis`,
      });
    }
    if (criticalRisks > 0) {
      blockers.push({
        id: "nist-critical-risk",
        kind: "open-risk",
        label: "High/critical residual risks",
        count: criticalRisks,
        severity: "critical",
        href: `${NIST_BASE}/risk-assessment`,
      });
    }
    if (overdueRemediations > 0) {
      blockers.push({
        id: "nist-overdue",
        kind: "overdue",
        label: "Overdue remediations",
        count: overdueRemediations,
        severity: "high",
        href: `${NIST_BASE}/gap-analysis`,
      });
    }

    const auditReadiness: FrameworkAuditReadiness = {
      score: readinessScore,
      label: readinessLabel(readinessScore),
      controlsApproved: approvedReviews,
      controlsTotal: totalControls,
      missingEvidence,
      unresolvedComments: reviews.reduce(
        (sum, r) => sum + (r.reviewStatus === "pending" ? r.commentCount : 0),
        0,
      ),
      pendingApprovals: pendingReviews,
      blockers,
    };

    /* ------------- Activity & maturity ------------- */
    const activity: FrameworkActivityEntry[] = [];
    Object.values(allRemediations).forEach((r) => {
      if (!r.updatedAt) return;
      activity.push({
        id: `remediation-${r.questionId}`,
        kind: "gap",
        title: `Remediation updated — ${r.nistId ?? r.questionId}`,
        detail: r.function ? `${r.function} • ${r.status}` : r.status,
        timestamp: r.updatedAt,
        href: `${NIST_BASE}/gap-analysis?controlId=${encodeURIComponent(r.questionId)}`,
      });
    });
    Object.values(allRiskAssessments).forEach((r) => {
      if (!r.updatedAt) return;
      activity.push({
        id: `risk-${r.riskId}`,
        kind: "risk",
        title: `Risk ${r.status.toLowerCase()} — ${r.nistId ?? r.riskId}`,
        detail: r.postTreatmentRiskLevel
          ? `${r.postTreatmentRiskLevel} residual`
          : undefined,
        timestamp: r.updatedAt,
        href: `${NIST_BASE}/risk-assessment?questionId=${encodeURIComponent(r.questionId)}`,
      });
    });
    verifications.forEach((v) => {
      if (v.submittedForReviewAt) {
        activity.push({
          id: `review-submit-${v.questionId}`,
          kind: "review",
          title: `Submitted for review — ${v.nistId}`,
          detail: v.reviewStatus ?? v.status,
          timestamp: v.submittedForReviewAt,
          href: `${NIST_BASE}/review?q=${encodeURIComponent(v.nistId)}`,
        });
      }
      if (v.approvedAt) {
        activity.push({
          id: `review-approve-${v.questionId}`,
          kind: "review",
          title: `Control approved — ${v.nistId}`,
          timestamp: v.approvedAt,
          href: `${NIST_BASE}/review?q=${encodeURIComponent(v.nistId)}`,
        });
      }
    });
    ciItems.forEach((item) => {
      if (!item.updatedAt) return;
      activity.push({
        id: `ci-${item.controlId}`,
        kind: "improvement",
        title: `Continuous improvement — ${item.nistId}`,
        detail: item.status.replace(/_/g, " "),
        timestamp: item.updatedAt,
        href: `${NIST_BASE}/improvement?q=${encodeURIComponent(item.nistId)}`,
      });
    });
    activity.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const lastActivityAt = activity[0]?.timestamp ?? null;

    const maturityValues = allQuestions
      .map((q) => q.maturityScore)
      .filter((score): score is number => typeof score === "number");
    const averageMaturity = maturityValues.length
      ? maturityValues.reduce((s, v) => s + v, 0) / maturityValues.length
      : 0;

    const hasActivity =
      assessedControls > 0 ||
      Object.keys(allRemediations).length > 0 ||
      risks.length > 0 ||
      evidence.length > 0 ||
      reviews.length > 0 ||
      improvements.length > 0;

    return {
      assessmentProgress,
      totalControls,
      assessedControls,
      openGaps,
      pendingRemediations,
      evidenceCount: evidence.length,
      riskCount: risks.length,
      criticalRisks,
      pendingReviews,
      overdueRemediations,
      evidenceCoverage,
      readinessScore,
      averageMaturity,
      extraMetrics: [
        {
          id: "avg-maturity",
          label: "Avg. maturity",
          value: averageMaturity ? averageMaturity.toFixed(1) : "—",
          hint: "Across answered controls",
          tone:
            averageMaturity >= 3
              ? "success"
              : averageMaturity > 0
                ? "warning"
                : "default",
        },
        {
          id: "evidence-coverage",
          label: "Evidence coverage",
          value: evidenceCoverage === null ? "—" : `${evidenceCoverage}%`,
          hint: "Controls with evidence",
          tone: "info",
        },
      ],
      recentActivity: activity.slice(0, 25),
      lastActivityAt,
      hasActivity,
      assessments,
      gaps,
      risks,
      evidence,
      reviews,
      improvements,
      auditReadiness,
    };
  }, [
    allQuestions,
    allRemediations,
    allRiskAssessments,
    remediationEvidence,
    getAllVerifications,
    getAllItems,
  ]);
}
