import { ANNEX_A, getAnnexImplementationQuestion, ISO_CLAUSES, isQuestionApplicable } from "@/frameworks/iso27001/data";
import type { OrganisationProfile } from "@/frameworks/iso27001/data";
import { implementationStatusFromAnswer } from "@/frameworks/iso27001/hooks/useIsoAssessment";
import type { QuestionState } from "@/frameworks/iso27001/hooks/useIsoStore";

export interface IsoGapItem {
  id: string;
  source: "clause" | "control";
  reference: string;
  name: string;
  domain: string;
  severity: "critical" | "major" | "minor";
  status: string;
  owner?: string;
  notes?: string;
  recommendation: string;
  auditImpact: string;
  answer?: string;
  updatedAt?: string;
}

/**
 * Derives gap candidates from assessment answers (clauses 4–10 and Annex A
 * implementation posture). Logic is standards-aligned at a workflow level:
 * partial / not implemented / planned implementation and low maturity indicate
 * improvement need — not a substitute for a formal audit opinion.
 */
export function buildIsoGapRegister(
  questions: Record<string, QuestionState>,
  profile: OrganisationProfile,
): IsoGapItem[] {
  const results: IsoGapItem[] = [];

  ISO_CLAUSES.forEach((clause) => {
    clause.questions
      .filter((q) => isQuestionApplicable(q, profile))
      .forEach((q) => {
        const qs = questions[q.id];
        if (!qs?.answer) return;
        const status = implementationStatusFromAnswer(qs.answer);
        const isGap =
          status === "not-implemented" ||
          status === "partial" ||
          status === "planned" ||
          (q.answerType === "maturity" && typeof qs.maturity === "number" && qs.maturity < 3);
        if (!isGap) return;
        results.push({
          id: `gap-${q.id}`,
          source: "clause",
          reference: q.reference,
          name: q.title,
          domain: `Clause ${clause.number}`,
          severity: status === "not-implemented" ? "major" : status === "planned" ? "minor" : "minor",
          status: qs.reviewStatus ?? "open",
          owner: qs.owner,
          notes: qs.notes,
          recommendation: `Address ${q.title}. Expected artefacts include: ${q.evidence.map((e) => e.label).join(", ")}.`,
          auditImpact: q.whyItMatters ?? "May indicate distance from documented ISMS requirements for this topic.",
          answer: qs.answer ?? undefined,
          updatedAt: qs.updatedAt,
        });
      });
  });

  ANNEX_A.forEach((group) => {
    group.controls.forEach((control) => {
      const implementationQ = getAnnexImplementationQuestion(control);
      if (!implementationQ) return;
      if (!isQuestionApplicable(implementationQ, profile)) return;
      const qs = questions[implementationQ.id];
      if (!qs?.answer) return;
      const status = implementationStatusFromAnswer(qs.answer);
      if (status !== "partial" && status !== "not-implemented" && status !== "planned") return;
      const severity: IsoGapItem["severity"] =
        status === "not-implemented"
          ? control.linkedRiskAreas.some((r) => ["access", "data-protection", "cloud", "privacy"].includes(r))
            ? "critical"
            : "major"
          : "minor";
      results.push({
        id: `gap-${control.reference}`,
        source: "control",
        reference: control.reference,
        name: control.name,
        domain: group.name,
        severity,
        status: qs.reviewStatus ?? "open",
        owner: qs.owner,
        notes: qs.notes,
        recommendation: control.guidance,
        auditImpact: control.objective,
        answer: qs.answer ?? undefined,
        updatedAt: qs.updatedAt,
      });
    });
  });

  return results;
}
