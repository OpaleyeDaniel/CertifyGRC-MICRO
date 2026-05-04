export * from "./types";
export * from "./clauses";
export * from "./annexA";

import type { AnnexControl, AssessmentQuestion, OrganisationProfile } from "./types";
import { getAllClauseQuestions } from "./clauses";
import { getAllAnnexQuestions } from "./annexA";

/**
 * Apply conditional-logic filters to a question list based on the
 * organisation profile. The rules are:
 *
 *   - If `appliesWhen` is provided, the question only shows when at
 *     least one of the keys is truthy on the profile (or equals the
 *     literal "default", which is always true).
 *   - If `hideWhen` is provided, a literal starting with "!" hides the
 *     question unless the negated key is truthy. Otherwise a truthy key
 *     hides the question.
 */
export function isQuestionApplicable(
  question: AssessmentQuestion,
  profile: OrganisationProfile,
): boolean {
  if (question.appliesWhen && question.appliesWhen.length > 0) {
    const matches = question.appliesWhen.some((key) => {
      if (key === "default") return true;
      return Boolean(profile[key as keyof OrganisationProfile]);
    });
    if (!matches) return false;
  }
  if (question.hideWhen && question.hideWhen.length > 0) {
    for (const raw of question.hideWhen) {
      if (raw.startsWith("!")) {
        const key = raw.slice(1) as keyof OrganisationProfile;
        if (!profile[key]) return false;
      } else {
        const key = raw as keyof OrganisationProfile;
        if (profile[key]) return false;
      }
    }
  }
  return true;
}

export function collectAllQuestions(): AssessmentQuestion[] {
  return [...getAllClauseQuestions(), ...getAllAnnexQuestions()];
}

/**
 * Locate the primary "implemented in practice" question for a control.
 * Do not use a fixed index — the question bank may grow over time.
 */
export function getAnnexImplementationQuestion(control: AnnexControl): AssessmentQuestion | undefined {
  return control.questions.find(
    (q) => q.id.endsWith("-implementation") || (q.depth === "implementation" && q.category === "implementation"),
  );
}
