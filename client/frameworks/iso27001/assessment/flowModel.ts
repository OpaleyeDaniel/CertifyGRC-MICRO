import type {
  AnnexControl,
  AnnexDomainGroup,
  AssessmentQuestion,
  ClauseSection,
  OrganisationProfile,
} from "../data/types";
import { isQuestionApplicable } from "../data";
import type { QuestionState } from "../hooks/useIsoStore";

/** Lexicographic compare for ISO-style refs (4.1, 4.10, A.5.15). */
export function compareIsoRefs(a: string, b: string): number {
  const pa = a.split(/[.-]/).map((x) => parseInt(x, 10) || 0);
  const pb = b.split(/[.-]/).map((x) => parseInt(x, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na !== nb) return na - nb;
  }
  return 0;
}

export interface ClauseStep {
  reference: string;
  questions: AssessmentQuestion[];
}

export function buildClauseSteps(clause: ClauseSection, profile: OrganisationProfile): ClauseStep[] {
  const applicable = clause.questions.filter((q) => isQuestionApplicable(q, profile));
  const byRef = new Map<string, AssessmentQuestion[]>();
  for (const q of applicable) {
    const list = byRef.get(q.reference) ?? [];
    list.push(q);
    byRef.set(q.reference, list);
  }
  return [...byRef.entries()]
    .sort(([ra], [rb]) => compareIsoRefs(ra, rb))
    .map(([reference, questions]) => ({ reference, questions }));
}

export interface AnnexStep {
  control: AnnexControl;
  questions: AssessmentQuestion[];
}

export function buildAnnexSteps(group: AnnexDomainGroup, profile: OrganisationProfile): AnnexStep[] {
  return group.controls
    .map((control) => ({
      control,
      questions: control.questions.filter((q) => isQuestionApplicable(q, profile)),
    }))
    .filter((s) => s.questions.length > 0);
}

export function stepFullyAnswered(
  questions: AssessmentQuestion[],
  states: Record<string, QuestionState>,
): boolean {
  if (questions.length === 0) return true;
  return questions.every((q) => Boolean(states[q.id]?.answer));
}

export function firstIncompleteStepIndex(
  steps: { questions: AssessmentQuestion[] }[],
  states: Record<string, QuestionState>,
): number {
  for (let i = 0; i < steps.length; i++) {
    if (!stepFullyAnswered(steps[i].questions, states)) return i;
  }
  return Math.max(0, steps.length - 1);
}

export type FlowStatus = "not-started" | "in-progress" | "completed";

export function subsectionStatus(
  questions: AssessmentQuestion[],
  states: Record<string, QuestionState>,
): FlowStatus {
  if (questions.length === 0) return "completed";
  const answered = questions.filter((q) => states[q.id]?.answer).length;
  if (answered === 0) return "not-started";
  if (answered === questions.length) return "completed";
  return "in-progress";
}

export function clauseFlowStatus(
  steps: ClauseStep[],
  states: Record<string, QuestionState>,
): FlowStatus {
  if (steps.length === 0) return "completed";
  const total = steps.reduce((n, s) => n + s.questions.length, 0);
  const answered = steps.reduce(
    (n, s) => n + s.questions.filter((q) => Boolean(states[q.id]?.answer)).length,
    0,
  );
  if (answered === 0) return "not-started";
  if (answered === total && steps.every((s) => stepFullyAnswered(s.questions, states))) return "completed";
  return "in-progress";
}

export function annexFlowStatus(
  steps: AnnexStep[],
  states: Record<string, QuestionState>,
): FlowStatus {
  if (steps.length === 0) return "completed";
  const total = steps.reduce((n, s) => n + s.questions.length, 0);
  const answered = steps.reduce(
    (n, s) => n + s.questions.filter((q) => Boolean(states[q.id]?.answer)).length,
    0,
  );
  if (answered === 0) return "not-started";
  if (answered === total && steps.every((s) => stepFullyAnswered(s.questions, states))) return "completed";
  return "in-progress";
}

export function countCompletedSteps(
  steps: { questions: AssessmentQuestion[] }[],
  states: Record<string, QuestionState>,
): number {
  return steps.filter((s) => stepFullyAnswered(s.questions, states)).length;
}

export function findAnnexStepIndexForControl(steps: AnnexStep[], controlRef: string): number {
  const i = steps.findIndex((s) => s.control.reference === controlRef);
  return i >= 0 ? i : 0;
}

export function firstIncompleteQuestionIndex(
  questions: AssessmentQuestion[],
  states: Record<string, QuestionState>,
): number {
  for (let i = 0; i < questions.length; i++) {
    if (!states[questions[i].id]?.answer) return i;
  }
  return Math.max(0, questions.length - 1);
}

export function countAnsweredInList(
  questions: AssessmentQuestion[],
  states: Record<string, QuestionState>,
): number {
  return questions.filter((q) => Boolean(states[q.id]?.answer)).length;
}
