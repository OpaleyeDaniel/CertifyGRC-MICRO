/**
 * Maturity Score Progression Logic
 * 
 * Handles maturity score progression when remediation is submitted.
 * 
 * Maturity Model:
 * - 1 = Initial (No)
 * - 2 = Repeatable (Partial)
 * - 3 = Defined (Yes)
 * - 4 = Managed (Yes - Managed)
 * - 5 = Optimized (Yes - Optimized)
 * 
 * Progression Rules:
 * - Score 1 (Initial) can progress to 2 (Repeatable) on remediation submit
 * - Score 2 (Repeatable) can progress to 3 (Defined) on remediation submit
 * - Score 3+ does not progress (No automatic jumps)
 * - Progression only happens on successful remediation submission
 */

/**
 * Get the next maturity level after remediation completion
 * @param currentScore - Current maturity score (1-5 or null)
 * @returns Next possible score, or null if no progression possible
 */
export const getNextMaturityLevel = (currentScore: number | null): number | null => {
  if (currentScore === null) return null;
  if (currentScore === 1) return 2; // Initial → Repeatable
  if (currentScore === 2) return 3; // Repeatable → Defined
  // No progression for 3, 4, 5
  return null;
};

/**
 * Get maturity label for a score
 */
export const getMaturityLabelForScore = (score: number | null): string => {
  switch (score) {
    case 1:
      return "Initial";
    case 2:
      return "Repeatable";
    case 3:
      return "Defined";
    case 4:
      return "Managed";
    case 5:
      return "Optimized";
    default:
      return "Not Answered";
  }
};

/**
 * Determine if a maturity score can be promoted
 * @param currentScore - Current maturity score
 * @returns True if score can be promoted to next level
 */
export const canPromoteMaturityScore = (currentScore: number | null): boolean => {
  return currentScore === 1 || currentScore === 2;
};

/**
 * Calculate the maturity progression context for UI display
 * @param currentScore - Current maturity score
 * @returns Object with current level and next level info
 */
export const calculateMaturityContext = (currentScore: number | null) => {
  const nextScore = getNextMaturityLevel(currentScore);
  const canPromote = canPromoteMaturityScore(currentScore);

  return {
    currentScore,
    currentLabel: getMaturityLabelForScore(currentScore),
    nextScore,
    nextLabel: nextScore !== null ? getMaturityLabelForScore(nextScore) : null,
    canPromote,
    promotionMessage:
      currentScore === 1
        ? "Remediation submission will promote this control from Initial → Repeatable"
        : currentScore === 2
          ? "Remediation submission will promote this control from Repeatable → Defined"
          : null,
  };
};

/**
 * Validate that score progression is allowed (no jumps, only specific transitions)
 * @param originalAnswer - Original answer (No/Partial/Yes)
 * @param currentScore - Current maturity score
 * @returns True if the current score matches the original answer
 */
export const isValidMaturityState = (
  originalAnswer: string | null,
  currentScore: number | null
): boolean => {
  // Map answers to expected scores
  const expectedScores: Record<string, number> = {
    No: 1,
    Partial: 2,
    Yes: 3,
  };

  if (!originalAnswer || !expectedScores[originalAnswer]) {
    return true; // Allow unknown answers
  }

  // Current score should be at least the initial score
  if (currentScore === null) {
    return false; // Unanswered questions should have been resolved
  }

  const initialScore = expectedScores[originalAnswer];
  return currentScore >= initialScore;
};

/**
 * Promotion context for remediation completion
 */
export interface MaturityProgressionContext {
  canPromote: boolean;
  currentScore: number | null;
  currentLabel: string;
  nextScore: number | null;
  nextLabel: string | null;
  promotionMessage: string | null;
}

export default {
  getNextMaturityLevel,
  getMaturityLabelForScore,
  canPromoteMaturityScore,
  calculateMaturityContext,
  isValidMaturityState,
};
