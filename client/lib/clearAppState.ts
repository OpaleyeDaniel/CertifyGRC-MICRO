/**
 * Clear all application state and localStorage data
 * This resets the app to a completely clean state
 */
export const clearAllAppState = () => {
  const knownStorageKeys = [
    "nist_assessment_answers",      // Assessment answers from useAssessmentEngine
    "gap_remediation_data",         // Remediation records from useGapRemediation
    "risk_assessment_data",         // Risk assessments from useRiskAssessment
    "nist_assessment_responses",    // Legacy assessment responses from useAssessment
    "gap_remediation_evidence",     // Evidence data (if any)
    "auditor_verification_data",    // Comment & Review queue
    "continuous_improvement_data",  // Continuous Improvement queue
    "revision_controls_data",       // Gap Analysis Revision tab
    "revision_data",                // Revision records
    "certifygrc_user_integrations_v1",
    "certifygrc_integration_audit_v1",
  ];

  try {
    // Clear known keys
    knownStorageKeys.forEach((key) => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`  ✓ Cleared: ${key}`);
      }
    });

    // Also check for and clear any keys containing patterns
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes("nist") || key.includes("gap") || key.includes("risk") || key.includes("assessment") || key.includes("evidence"))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      console.log(`  ✓ Cleared: ${key}`);
    });

    console.log("✓ All application state cleared successfully");
    return true;
  } catch (error) {
    console.error("Failed to clear application state:", error);
    return false;
  }
};

/**
 * Clear and reload the application to reset to initial state
 */
export const resetApplicationCompletely = () => {
  if (clearAllAppState()) {
    // Reload the page to reinitialize with fresh data
    window.location.href = "/";
  }
};
