/**
 * Reset Assessment Lifecycle Utility
 * 
 * Clears all stored states and persistent data across assessment lifecycle phases:
 * - Evidence: Removes uploaded file references and metadata
 * - Reports: Clears generated summaries and status flags
 * - Comments & Review: Wipes user feedback, timestamps, and approval statuses
 * 
 * Affected localStorage keys:
 * - nist_assessment_answers (assessment answers + evidence files)
 * - nist_assessment_responses (legacy assessment responses)
 * - gap_remediation_data (remediation records + evidence + status)
 * - gap_remediation_evidence (legacy evidence key)
 * - risk_assessment_data (risk assessments + status + timestamps)
 * - auditor_verification_data (review statuses + comments + timestamps)
 */

// All localStorage keys that should be cleared
const STORAGE_KEYS_TO_CLEAR = [
  "nist_assessment_answers",
  "nist_assessment_responses",
  "gap_remediation_data",
  "gap_remediation_evidence",
  "risk_assessment_data",
  "auditor_verification_data",
  // Workflow queue / rework datasets
  "continuous_improvement_data",
  "revision_controls_data",
  "revision_data",
];

/**
 * Clear all localStorage keys related to assessment lifecycle
 */
export const clearAssessmentLocalStorage = (): void => {
  try {
    STORAGE_KEYS_TO_CLEAR.forEach((key) => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`✓ Cleared localStorage key: ${key}`);
      }
    });
    console.log("✓ All assessment lifecycle data cleared from localStorage");

    // Notify same-tab subscribers to sync their in-memory state.
    window.dispatchEvent(new CustomEvent("assessmentDataChanged"));
    window.dispatchEvent(new CustomEvent("gapRemediationDataChanged"));
    window.dispatchEvent(new CustomEvent("riskAssessmentDataChanged"));
    window.dispatchEvent(new CustomEvent("auditorVerificationDataChanged"));
  } catch (error) {
    console.error("Failed to clear localStorage:", error);
  }
};

/**
 * Remove ALL evidence files while preserving assessment data
 * EMERGENCY: Clears evidenceFiles, evidenceUrl, and remediation evidence only
 */
export const clearAllEvidenceFiles = (): void => {
  try {
    // Clear assessment evidence
    const assessmentKey = "nist_assessment_answers";
    const stored = localStorage.getItem(assessmentKey);
    if (stored) {
      const answers = JSON.parse(stored);
      const cleaned = answers.map((answer: any) => ({
        ...answer,
        evidenceUrl: null,
        evidenceFileSize: null,
        evidenceFiles: [], // Empty array for evidence files
      }));
      localStorage.setItem(assessmentKey, JSON.stringify(cleaned));
      console.log(`✓ Cleared all evidence files from assessment answers`);
    }

    // Clear remediation evidence
    const remediationKey = "gap_remediation_data";
    const remediationStored = localStorage.getItem(remediationKey);
    if (remediationStored) {
      const remediations = JSON.parse(remediationStored);
      const cleaned = remediations.map((item: any) => {
        if (Array.isArray(item) && item.length >= 2) {
          // Map format: [questionId, remediationObject]
          return [item[0], { ...item[1], evidenceFiles: [] }];
        }
        return item;
      });
      localStorage.setItem(remediationKey, JSON.stringify(cleaned));
      console.log(`✓ Cleared all evidence files from remediation data`);
    }

    console.log("✓✓✓ ALL EVIDENCE FILES REMOVED ✓✓✓");
  } catch (error) {
    console.error("Failed to clear evidence files:", error);
  }
};

/**
 * Initial state for useAssessmentEngine
 * Used to reset the assessment module to baseline
 * DEEP WIPE: Clears all nested objects and evidence arrays
 */
export const createInitialAssessmentEngineState = () => {
  return {
    allQuestions: [], // Will be populated by createAllQuestions()
    currentView: "dashboard" as const,
    currentFunction: null as string | null,
    currentCategory: null as string | null,
    currentQuestionIndex: 0,
    filteredQuestions: [],
    currentQuestion: null,
    nistFunctions: ["GOVERN", "IDENTIFY", "PROTECT", "DETECT", "RESPOND", "RECOVER"],
  };
};

/**
 * Initial state for useAssessment (legacy hook)
 * Used to reset legacy assessment responses
 */
export const createInitialAssessmentState = () => {
  return {
    responses: {},
    isLoaded: false,
  };
};

/**
 * Initial state for useGapRemediation
 * Used to reset gap remediation records and evidence
 */
export const createInitialGapRemediationState = () => {
  return {
    allRemediations: new Map(),
    isLoaded: false,
  };
};

/**
 * Initial state for useRiskAssessment
 * Used to reset risk assessment records and status
 */
export const createInitialRiskAssessmentState = () => {
  return {
    allRiskAssessments: new Map(),
    isLoaded: false,
  };
};

/**
 * Initial state for useAuditorVerification
 * Used to reset auditor comments, review statuses, and approval timestamps
 */
export const createInitialAuditorVerificationState = () => {
  return {
    verifications: new Map(),
    isLoaded: false,
  };
};

/**
 * Log reset action for audit trail
 */
export const logResetAction = (): void => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔄 RESET: Assessment lifecycle reset to baseline by user`);
};

/**
 * Validate that reset was successful
 */
export const validateResetComplete = (): boolean => {
  let allCleared = true;
  STORAGE_KEYS_TO_CLEAR.forEach((key) => {
    if (localStorage.getItem(key) !== null) {
      console.warn(`⚠️ Warning: Key still present after reset: ${key}`);
      allCleared = false;
    }
  });
  return allCleared;
};

export default {
  STORAGE_KEYS_TO_CLEAR,
  clearAssessmentLocalStorage,
  createInitialAssessmentEngineState,
  createInitialAssessmentState,
  createInitialGapRemediationState,
  createInitialRiskAssessmentState,
  createInitialAuditorVerificationState,
  logResetAction,
  validateResetComplete,
};
