import { useMemo } from "react";
import { useIsoWorkspaceStorageSnapshot } from "./hooks/useIsoStore";
import {
  EMPTY_FRAMEWORK_SUMMARY,
  type FrameworkAssessmentRecord,
  type FrameworkAuditReadiness,
  type FrameworkBlocker,
  type FrameworkEvidenceRecord,
  type FrameworkGapRecord,
  type FrameworkImprovementRecord,
  type FrameworkReviewRecord,
  type FrameworkRiskRecord,
  type FrameworkSummary,
  type RiskLevel as OmegaRiskLevel,
} from "@/frameworks/types";
import { getIsoStateSnapshot } from "./hooks/useIsoStore";
import { PROVIDERS_BY_ID } from "@/lib/integrations/providers";
import type { IntegrationProviderId } from "@/lib/integrations/types";
import { ANNEX_A, getAnnexImplementationQuestion, ISO_CLAUSES, isQuestionApplicable } from "./data";
import { implementationScore, implementationStatusFromAnswer } from "./hooks/useIsoAssessment";
import { scoreToLevel } from "./hooks/useIsoRisks";

const ISO_BASE = "/frameworks/iso27001";
const STALE_DAYS = 180;

function readinessLabel(score: number | null): FrameworkAuditReadiness["label"] {
  if (score === null) return "Unknown";
  if (score >= 85) return "Audit-ready";
  if (score >= 65) return "Close";
  if (score >= 35) return "In progress";
  return "Not ready";
}

function mapRiskLevel(level: string): OmegaRiskLevel {
  if (level === "CRITICAL") return "CRITICAL";
  if (level === "HIGH") return "HIGH";
  if (level === "MEDIUM") return "MEDIUM";
  return "LOW";
}

/**
 * Produces the framework summary Omega renders on its dashboard,
 * derived entirely from the persisted ISO 27001 workspace state.
 */

export function useIso27001Summary(): FrameworkSummary {
  const isoStorage = useIsoWorkspaceStorageSnapshot();
  return useMemo<FrameworkSummary>(() => {
    void isoStorage;
    const state = getIsoStateSnapshot();
    const profile = state.organisation;

    /* Build flat lists of applicable questions. */
    const clauseQuestions = ISO_CLAUSES.flatMap((c) =>
      c.questions
        .filter((q) => isQuestionApplicable(q, profile))
        .map((q) => ({ q, clause: c, kind: "clause" as const, control: null })),
    );
    const controlQuestions = ANNEX_A.flatMap((g) =>
      g.controls.flatMap((c) =>
        c.questions
          .filter((q) => isQuestionApplicable(q, profile))
          .map((q) => ({ q, clause: null, kind: "control" as const, control: c, domain: g })),
      ),
    );
    const totalControls = controlQuestions.length + clauseQuestions.length;

    let answeredCount = 0;
    let approvedCount = 0;
    let evidenceLinkedCount = 0;
    let totalMaturity = 0;
    let scoredForMaturity = 0;
    let weightedScore = 0;
    let totalWeight = 0;
    const now = Date.now();

    /* ---------- Assessments ---------- */
    const assessments: FrameworkAssessmentRecord[] = [];
    const addAssessment = (
      id: string,
      controlId: string,
      title: string,
      domain: string,
      category: string,
      href: string,
      state_q: ReturnType<typeof getQuestionState>,
    ) => {
      const record: FrameworkAssessmentRecord = {
        id,
        controlId,
        title,
        domain,
        category,
        status:
          state_q.reviewStatus === "approved"
            ? "approved"
            : state_q.answer
              ? "answered"
              : state_q.notes || (state_q.evidence?.length ?? 0) > 0
                ? "in-progress"
                : "not-started",
        answer: state_q.answer ?? null,
        maturityScore:
          typeof state_q.maturity === "number"
            ? state_q.maturity
            : null,
        owner: state_q.owner,
        updatedAt: state_q.updatedAt,
        href,
      };
      assessments.push(record);
    };

    function getQuestionState(id: string) {
      return state.questions[id] ?? {};
    }

    clauseQuestions.forEach(({ q, clause }) => {
      const qs = getQuestionState(q.id);
      const w = q.weight ?? 1;
      totalWeight += w;
      const score = implementationScore({ ...q, state: qs, sectionRef: clause.number, sectionKind: "clause" });
      if (score >= 0) weightedScore += (score / 5) * 100 * w;
      if (qs.answer) answeredCount++;
      if (qs.reviewStatus === "approved") approvedCount++;
      if (typeof qs.maturity === "number") {
        totalMaturity += qs.maturity;
        scoredForMaturity++;
      }
      if ((qs.evidence?.length ?? 0) > 0) evidenceLinkedCount++;
      addAssessment(
        q.id,
        q.reference,
        q.title,
        `Clause ${clause.number}`,
        clause.name,
        `${ISO_BASE}/assessment/clause/${clause.number}`,
        qs,
      );
    });

    controlQuestions.forEach(({ q, control, domain }) => {
      const qs = getQuestionState(q.id);
      const w = q.weight ?? 1;
      totalWeight += w;
      const score = implementationScore({
        ...q,
        state: qs,
        sectionRef: control!.reference,
        controlRef: control!.reference,
        sectionKind: "control",
      });
      if (score >= 0) weightedScore += (score / 5) * 100 * w;
      if (qs.answer) answeredCount++;
      if (qs.reviewStatus === "approved") approvedCount++;
      if (typeof qs.maturity === "number") {
        totalMaturity += qs.maturity;
        scoredForMaturity++;
      }
      if ((qs.evidence?.length ?? 0) > 0) evidenceLinkedCount++;
      addAssessment(
        q.id,
        control!.reference,
        q.title,
        domain!.name,
        control!.name,
        `${ISO_BASE}/assessment/annex/${encodeURIComponent(control!.domain)}/control/${encodeURIComponent(control!.reference)}`,
        qs,
      );
    });

    const assessmentProgress = totalControls
      ? Math.round((answeredCount / totalControls) * 100)
      : null;

    const readinessScore = totalWeight ? Math.round(weightedScore / totalWeight) : null;
    const averageMaturity = scoredForMaturity ? totalMaturity / scoredForMaturity : 0;

    /* ---------- Gaps ---------- */
    const gaps: FrameworkGapRecord[] = [];
    ANNEX_A.forEach((group) => {
      group.controls.forEach((control) => {
        const implementationQ = getAnnexImplementationQuestion(control);
        if (!implementationQ) return;
        const qs = state.questions[implementationQ.id] ?? {};
        const status = implementationStatusFromAnswer(qs.answer);
        if (status !== "partial" && status !== "not-implemented" && status !== "planned") return;
        const age = qs.updatedAt ? Math.max(0, Math.floor((now - new Date(qs.updatedAt).getTime()) / 86_400_000)) : 0;
        const sev: FrameworkGapRecord["severity"] =
          status === "not-implemented" ? "high" : status === "planned" ? "medium" : "medium";
        const priority: FrameworkGapRecord["priority"] =
          status === "not-implemented" ? "High" : status === "planned" ? "Medium" : "Medium";
        gaps.push({
          id: `gap-${control.reference}`,
          controlId: control.reference,
          title: control.name,
          domain: group.name,
          severity: sev,
          priority,
          status: qs.reviewStatus === "approved" ? "treated" : qs.owner ? "in-progress" : "open",
          owner: qs.owner,
          ageDays: age,
          overdue: false,
          updatedAt: qs.updatedAt,
          href: `${ISO_BASE}/gap-analysis`,
        });
      });
    });

    /* ---------- Risks ---------- */
    const risks: FrameworkRiskRecord[] = state.risks.map((r) => ({
      id: r.id,
      controlId: r.linkedControls[0],
      title: r.title,
      asset: r.asset,
      threat: r.threat,
      vulnerability: r.vulnerability,
      inherentLevel: mapRiskLevel(scoreToLevel(r.inherentScore)),
      residualLevel: mapRiskLevel(scoreToLevel(r.residualScore)),
      likelihood: r.residualLikelihood,
      impact: r.residualImpact,
      status:
        r.status === "open" || r.status === "in-progress"
          ? "in-progress"
          : r.status === "treated" || r.status === "closed"
            ? "completed"
            : "pending",
      owner: r.owner,
      treatmentOption: r.treatment,
      updatedAt: r.updatedAt,
      href: `${ISO_BASE}/risk-assessment`,
    }));
    const criticalRisks = risks.filter((r) => r.residualLevel === "CRITICAL" || r.residualLevel === "HIGH").length;

    /* ---------- Evidence ---------- */
    const evidence: FrameworkEvidenceRecord[] = state.evidenceFiles.map((f) => {
      const prov = f.sourceProviderId ? PROVIDERS_BY_ID[f.sourceProviderId as IntegrationProviderId] : undefined;
      return {
        id: f.id,
        name: f.name,
        type: f.type,
        sizeBytes: f.sizeBytes,
        source: f.sourceKind === "cloud" ? "external" : "assessment",
        controlId: f.linkedControls[0],
        uploadedAt: f.uploadedAt,
        stale: now - new Date(f.uploadedAt).getTime() > STALE_DAYS * 86_400_000,
        href: `${ISO_BASE}/evidence`,
        cloudProviderId: f.sourceProviderId,
        cloudProviderLabel: prov?.shortName ?? f.sourceProviderId?.replace(/_/g, " "),
        evidenceMode: f.storageMode,
        accessNote:
          f.accessState === "link_may_be_invalid"
            ? "External link may be invalid if the integration was disconnected"
            : undefined,
      };
    });
    const evidenceCoverage = totalControls
      ? Math.round((evidenceLinkedCount / totalControls) * 100)
      : null;

    /* ---------- Reviews ---------- */
    const reviews: FrameworkReviewRecord[] = [];
    const improvements: FrameworkImprovementRecord[] = [];
    Object.entries(state.questions).forEach(([id, qs]) => {
      if (!qs.reviewStatus) return;
      const title = `Question ${id}`;
      if (qs.reviewStatus === "approved" || qs.reviewStatus === "rejected") {
        // nothing
      }
      if (qs.reviewStatus === "submitted" || qs.reviewStatus === "under-review" || qs.reviewStatus === "changes-requested") {
        reviews.push({
          id,
          controlId: id,
          title,
          domain: "ISO 27001",
          reviewStatus: qs.reviewStatus === "changes-requested" ? "revision-requested" : "pending",
          submittedAt: qs.updatedAt,
          commentCount: qs.reviewerComment ? 1 : 0,
          lastComment: qs.reviewerComment,
          updatedAt: qs.updatedAt,
          href: `${ISO_BASE}/review`,
        });
      }
      if (qs.reviewStatus === "changes-requested") {
        improvements.push({
          id,
          controlId: id,
          title,
          domain: "ISO 27001",
          status: "revision-required",
          auditorComment: qs.reviewerComment,
          owner: qs.owner,
          updatedAt: qs.updatedAt ?? new Date().toISOString(),
          href: `${ISO_BASE}/improvement`,
        });
      }
    });

    /* ---------- Blockers ---------- */
    const missingEvidence = gaps.filter((g) => g.status !== "treated").length;
    const pendingReviews = reviews.length;
    const blockers: FrameworkBlocker[] = [];
    if (missingEvidence > 0) {
      blockers.push({
        id: "missing-evidence",
        kind: "missing-evidence",
        label: "Controls with missing evidence",
        count: missingEvidence,
        severity: "medium",
        href: `${ISO_BASE}/evidence`,
      });
    }
    if (pendingReviews > 0) {
      blockers.push({
        id: "pending-review",
        kind: "pending-review",
        label: "Questions pending review",
        count: pendingReviews,
        severity: "medium",
        href: `${ISO_BASE}/review`,
      });
    }
    if (criticalRisks > 0) {
      blockers.push({
        id: "critical-risks",
        kind: "open-risk",
        label: "High / critical residual risks",
        count: criticalRisks,
        severity: "high",
        href: `${ISO_BASE}/risk-assessment`,
      });
    }

    const auditReadiness: FrameworkAuditReadiness = {
      score: readinessScore,
      label: readinessLabel(readinessScore),
      controlsApproved: approvedCount,
      controlsTotal: totalControls,
      missingEvidence,
      unresolvedComments: state.comments.filter((c) => !c.resolved).length,
      pendingApprovals: pendingReviews,
      blockers,
    };

    const recentActivity = [
      ...Object.entries(state.questions)
        .filter(([, qs]) => qs.updatedAt)
        .map(([id, qs]) => ({
          id: `q-${id}`,
          kind: "assessment" as const,
          title: `Question ${id} updated`,
          timestamp: qs.updatedAt as string,
          href: `${ISO_BASE}/assessment`,
        })),
      ...state.risks.map((r) => ({
        id: `r-${r.id}`,
        kind: "risk" as const,
        title: `Risk: ${r.title}`,
        detail: r.owner,
        timestamp: r.updatedAt,
        href: `${ISO_BASE}/risk-assessment`,
      })),
      ...state.findings.map((f) => ({
        id: `f-${f.id}`,
        kind: "improvement" as const,
        title: `Finding: ${f.title}`,
        detail: f.severity,
        timestamp: f.updatedAt,
        href: `${ISO_BASE}/improvement`,
      })),
    ]
      .filter((a) => a.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    const lastActivityAt = recentActivity[0]?.timestamp ?? null;

    const summary: FrameworkSummary = {
      ...EMPTY_FRAMEWORK_SUMMARY,
      assessmentProgress,
      totalControls,
      assessedControls: answeredCount,
      openGaps: gaps.filter((g) => g.status !== "treated").length,
      pendingRemediations: gaps.filter((g) => g.status === "in-progress").length,
      evidenceCount: evidence.length,
      riskCount: risks.length,
      criticalRisks,
      pendingReviews,
      overdueRemediations: 0,
      evidenceCoverage,
      readinessScore,
      averageMaturity,
      recentActivity,
      lastActivityAt,
      hasActivity: recentActivity.length > 0,
      assessments,
      gaps,
      risks,
      evidence,
      reviews,
      improvements,
      auditReadiness,
    };

    return summary;
  }, [isoStorage]);
}

export function useIso27001NavBadges(): Record<string, number> {
  const isoStorage = useIsoWorkspaceStorageSnapshot();
  return useMemo(() => {
    void isoStorage;
    const state = getIsoStateSnapshot();
    const profile = state.organisation;
    const clauseQs = ISO_CLAUSES.flatMap((c) => c.questions.filter((q) => isQuestionApplicable(q, profile)));
    const controlQs = ANNEX_A.flatMap((g) =>
      g.controls.flatMap((c) => c.questions.filter((q) => isQuestionApplicable(q, profile))),
    );
    const allApplicable = [...clauseQs, ...controlQs];
    const unanswered = allApplicable.filter((q) => !state.questions[q.id]?.answer).length;
    const answered = allApplicable.filter((q) => state.questions[q.id]?.answer).length;

    let gaps = 0;
    ANNEX_A.forEach((group) => {
      group.controls.forEach((control) => {
        const implementationQ = getAnnexImplementationQuestion(control);
        if (!implementationQ) return;
        const answer = state.questions[implementationQ.id]?.answer;
        const status = implementationStatusFromAnswer(answer);
        if (status === "partial" || status === "not-implemented" || status === "planned") gaps++;
      });
    });

    const pendingReviews = Object.values(state.questions).filter(
      (q) => q.reviewStatus === "submitted" || q.reviewStatus === "under-review",
    ).length;

    const openFindings = state.findings.filter((f) => f.status !== "closed").length;
    const openRisks = state.risks.filter((r) => r.status === "open" || r.status === "in-progress").length;
    const openTreatment = state.treatmentActions.filter((a) => a.status !== "done").length;

    return {
      assessment: unanswered,
      "gap-analysis": gaps,
      "risk-assessment": openRisks,
      evidence: state.evidenceFiles.filter((f) => f.reviewStatus === "unreviewed").length,
      report: answered,
      review: pendingReviews,
      improvement: openFindings + openTreatment,
    };
  }, [isoStorage]);
}
