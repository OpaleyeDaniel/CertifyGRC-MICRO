import { useCallback, useMemo } from "react";
import {
  nowIso,
  useIsoStore,
  type QuestionState,
  type ReviewStatus,
} from "./useIsoStore";
import {
  ISO_CLAUSES,
  ANNEX_A,
  isQuestionApplicable,
  type AssessmentQuestion,
  type OrganisationProfile,
  type ImplementationStatus,
  type ClauseSection,
  type AnnexControl,
  type AnnexDomainGroup,
} from "../data";

export interface QuestionWithState extends AssessmentQuestion {
  state: QuestionState;
  sectionRef: string;
  sectionKind: "clause" | "control";
  controlRef?: string;
}

export function useIsoAssessment() {
  const { state, update } = useIsoStore();
  const profile = state.organisation;

  const allClauseQuestions = useMemo(() => {
    return ISO_CLAUSES.flatMap((section) =>
      section.questions.map<QuestionWithState>((q) => ({
        ...q,
        sectionRef: section.number,
        sectionKind: "clause",
        state: state.questions[q.id] ?? {},
      })),
    );
  }, [state.questions]);

  const allControlQuestions = useMemo(() => {
    return ANNEX_A.flatMap((group) =>
      group.controls.flatMap((control) =>
        control.questions.map<QuestionWithState>((q) => ({
          ...q,
          sectionRef: control.reference,
          controlRef: control.reference,
          sectionKind: "control",
          state: state.questions[q.id] ?? {},
        })),
      ),
    );
  }, [state.questions]);

  const applicableClauseQuestions = useMemo(
    () => allClauseQuestions.filter((q) => isQuestionApplicable(q, profile)),
    [allClauseQuestions, profile],
  );
  const applicableControlQuestions = useMemo(
    () => allControlQuestions.filter((q) => isQuestionApplicable(q, profile)),
    [allControlQuestions, profile],
  );

  const allApplicableQuestions = useMemo(
    () => [...applicableClauseQuestions, ...applicableControlQuestions],
    [applicableClauseQuestions, applicableControlQuestions],
  );

  const answerQuestion = useCallback(
    (questionId: string, patch: Partial<QuestionState>) => {
      update((prev) => ({
        ...prev,
        questions: {
          ...prev.questions,
          [questionId]: {
            ...prev.questions[questionId],
            ...patch,
            updatedAt: nowIso(),
          },
        },
      }));
    },
    [update],
  );

  const setReviewStatus = useCallback(
    (questionId: string, reviewStatus: ReviewStatus, reviewerComment?: string) => {
      update((prev) => ({
        ...prev,
        questions: {
          ...prev.questions,
          [questionId]: {
            ...prev.questions[questionId],
            reviewStatus,
            reviewerComment: reviewerComment ?? prev.questions[questionId]?.reviewerComment,
            updatedAt: nowIso(),
          },
        },
      }));
    },
    [update],
  );

  const updateOrganisation = useCallback(
    (patch: Partial<OrganisationProfile>) => {
      update((prev) => ({ ...prev, organisation: { ...prev.organisation, ...patch } }));
    },
    [update],
  );

  return {
    profile,
    updateOrganisation,
    clauses: ISO_CLAUSES,
    annex: ANNEX_A,
    allClauseQuestions,
    allControlQuestions,
    applicableClauseQuestions,
    applicableControlQuestions,
    allApplicableQuestions,
    answerQuestion,
    setReviewStatus,
  };
}

/* -------------------------------------------------------------------- */
/* Scoring helpers                                                       */
/* -------------------------------------------------------------------- */

export function implementationScore(q: QuestionWithState): number {
  const answer = (q.state.answer || "").toLowerCase();
  if (!answer) return 0;
  if (answer.includes("implemented") && !answer.includes("not") && !answer.includes("partial")) {
    return 5;
  }
  if (answer.includes("partial")) return 2;
  if (answer.includes("planned")) return 1;
  if (answer.includes("not implemented")) return 0;
  if (answer === "yes") return 5;
  if (answer === "no") return 0;
  if (answer.includes("not applicable") || answer === "n/a") return -1;
  const m = q.state.maturity;
  if (typeof m === "number") return m;
  if (answer.match(/^\d+$/)) return Math.min(5, Math.max(0, Number(answer)));
  return 2;
}

export function scoreClause(section: ClauseSection, profile: OrganisationProfile, states: Record<string, QuestionState>): {
  percent: number;
  answered: number;
  total: number;
  weighted: number;
} {
  const active = section.questions.filter((q) => isQuestionApplicable(q, profile));
  let totalWeight = 0;
  let totalScore = 0;
  let answered = 0;
  active.forEach((q) => {
    const w = q.weight ?? 1;
    totalWeight += w;
    const qs: QuestionWithState = { ...q, state: states[q.id] ?? {}, sectionRef: section.number, sectionKind: "clause" };
    const score = implementationScore(qs);
    const normalised = score < 0 ? null : (score / 5) * 100;
    if (qs.state.answer) answered += 1;
    if (normalised !== null) totalScore += (normalised * w);
  });
  const percent = totalWeight ? Math.round(totalScore / totalWeight) : 0;
  return { percent, answered, total: active.length, weighted: totalScore };
}

export function scoreControl(control: AnnexControl, profile: OrganisationProfile, states: Record<string, QuestionState>): {
  percent: number;
  answered: number;
  total: number;
} {
  const active = control.questions.filter((q) => isQuestionApplicable(q, profile));
  let totalWeight = 0;
  let totalScore = 0;
  let answered = 0;
  active.forEach((q) => {
    const w = q.weight ?? 1;
    totalWeight += w;
    const qs: QuestionWithState = {
      ...q,
      state: states[q.id] ?? {},
      sectionRef: control.reference,
      controlRef: control.reference,
      sectionKind: "control",
    };
    const score = implementationScore(qs);
    const normalised = score < 0 ? null : (score / 5) * 100;
    if (qs.state.answer) answered += 1;
    if (normalised !== null) totalScore += normalised * w;
  });
  const percent = totalWeight ? Math.round(totalScore / totalWeight) : 0;
  return { percent, answered, total: active.length };
}

export function scoreDomain(
  group: AnnexDomainGroup,
  profile: OrganisationProfile,
  states: Record<string, QuestionState>,
) {
  const controlScores = group.controls.map((c) => scoreControl(c, profile, states));
  const percent = controlScores.length
    ? Math.round(controlScores.reduce((sum, c) => sum + c.percent, 0) / controlScores.length)
    : 0;
  const answered = controlScores.reduce((sum, c) => sum + c.answered, 0);
  const total = controlScores.reduce((sum, c) => sum + c.total, 0);
  return { percent, answered, total };
}

export function implementationStatusFromAnswer(answer: string | null | undefined): ImplementationStatus {
  if (!answer) return "not-implemented";
  const lower = answer.toLowerCase();
  if (lower.includes("not applicable")) return "not-applicable";
  if (lower === "implemented" || lower === "yes") return "implemented";
  if (lower.includes("partial")) return "partial";
  if (lower.includes("planned")) return "planned";
  return "not-implemented";
}
