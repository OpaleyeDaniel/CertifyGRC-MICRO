import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  clearAssessmentLocalStorage,
  clearAllEvidenceFiles,
  createInitialAssessmentEngineState,
  createInitialAssessmentState,
  createInitialGapRemediationState,
  createInitialRiskAssessmentState,
  createInitialAuditorVerificationState,
  logResetAction,
  validateResetComplete,
} from "@/lib/resetAssessmentLifecycle";

/**
 * Hook to reset the entire assessment lifecycle to baseline
 * 
 * Coordinates:
 * - Clearing all localStorage keys (evidence, reports, comments, reviews)
 * - Resetting state in all modules to initialState
 * - Redirecting to first assessment question
 * 
 * Usage:
 * const { resetAssessmentLifecycle, isResetting } = useResetAssessmentLifecycle();
 * 
 * // With callback to reset state in parent components
 * resetAssessmentLifecycle({
 *   onResetAssessmentEngine: (initialState) => setAllQuestions(initialState.allQuestions),
 *   onResetAuditorVerification: () => setVerifications(new Map()),
 *   // ... other callbacks
 * });
 */

export interface ResetCallbacks {
  // Assessment module reset
  onResetAssessmentEngine?: (initialState: ReturnType<typeof createInitialAssessmentEngineState>) => void;
  
  // Legacy assessment module reset
  onResetAssessment?: (initialState: ReturnType<typeof createInitialAssessmentState>) => void;
  
  // Gap remediation module reset
  onResetGapRemediation?: (initialState: ReturnType<typeof createInitialGapRemediationState>) => void;
  
  // Risk assessment module reset
  onResetRiskAssessment?: (initialState: ReturnType<typeof createInitialRiskAssessmentState>) => void;
  
  // Auditor verification module reset
  onResetAuditorVerification?: (initialState: ReturnType<typeof createInitialAuditorVerificationState>) => void;
}

export const useResetAssessmentLifecycle = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  /**
   * Execute full reset of assessment lifecycle with deep wipe
   * DEEP WIPE: Ensures all nested objects (arrays, comments, evidence) are cleared
   */
  const resetAssessmentLifecycle = useCallback(async (callbacks?: ResetCallbacks) => {
    try {
      console.log("🔄 Starting assessment lifecycle reset (DEEP WIPE)...");
      logResetAction();

      // Step 1: Clear all localStorage keys (complete wipe)
      console.log("📝 Step 1/6: Deep wiping persistent storage...");
      clearAssessmentLocalStorage();

      // Verify all keys are truly removed
      const STORAGE_KEYS = [
        "nist_assessment_answers",
        "nist_assessment_responses",
        "gap_remediation_data",
        "gap_remediation_evidence",
        "risk_assessment_data",
        "auditor_verification_data",
        "continuous_improvement_data",
        "revision_controls_data",
        "revision_data",
      ];

      STORAGE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
        if (localStorage.getItem(key) === null) {
          console.log(`  ✓ Confirmed cleared: ${key}`);
        } else {
          console.warn(`  ⚠ Failed to clear: ${key}`);
        }
      });

      // Step 2: Reset Assessment Engine state (clear all nested objects)
      console.log("📝 Step 2/6: Deep wiping assessment module...");
      const assessmentEngineInitialState = createInitialAssessmentEngineState();
      callbacks?.onResetAssessmentEngine?.(assessmentEngineInitialState);

      // Step 3: Reset Legacy Assessment state
      console.log("📝 Step 3/6: Deep wiping legacy assessment module...");
      const assessmentInitialState = createInitialAssessmentState();
      callbacks?.onResetAssessment?.(assessmentInitialState);

      // Step 4: Reset Gap Remediation state (clear all evidence arrays and nested objects)
      console.log("📝 Step 4/6: Deep wiping remediation module (evidence, comments)...");
      const gapRemediationInitialState = createInitialGapRemediationState();
      callbacks?.onResetGapRemediation?.(gapRemediationInitialState);

      // Step 5: Reset Risk Assessment state (clear all nested assessment data)
      console.log("📝 Step 5/6: Deep wiping risk assessment module...");
      const riskAssessmentInitialState = createInitialRiskAssessmentState();
      callbacks?.onResetRiskAssessment?.(riskAssessmentInitialState);

      // Step 6: Reset Auditor Verification state (clear all comments, reviews, timestamps)
      console.log("📝 Step 6/6: Deep wiping auditor verification (comments, reviews, timestamps)...");
      const auditorVerificationInitialState = createInitialAuditorVerificationState();
      callbacks?.onResetAuditorVerification?.(auditorVerificationInitialState);

      // Validate reset was successful
      const isValid = validateResetComplete();
      if (!isValid) {
        console.warn("⚠️ Some keys may not have been cleared properly - performing fallback cleanup");
        STORAGE_KEYS.forEach((key) => {
          localStorage.removeItem(key);
        });
      }

      // Navigate to first assessment page
      console.log("📝 Redirecting to assessment (fresh start)...");
      navigate("/assessment");

      // Show success toast
      toast({
        title: "Assessment Reset Complete",
        description: "✓ All data cleared: Evidence, Reports, Comments, Reviews. Starting fresh assessment.",
        variant: "default",
      });

      console.log("✓ Assessment lifecycle DEEP WIPE completed successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to reset assessment lifecycle:", error);
      toast({
        title: "Reset Failed",
        description: "An error occurred while resetting the assessment. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [navigate, toast]);

  /**
   * Reset specific modules (granular control)
   */
  const resetModule = useCallback(
    (moduleType: "assessment" | "remediation" | "risk" | "auditor", callbacks?: ResetCallbacks) => {
      try {
        console.log(`🔄 Resetting ${moduleType} module...`);

        switch (moduleType) {
          case "assessment":
            clearAssessmentLocalStorage();
            const assessmentState = createInitialAssessmentEngineState();
            callbacks?.onResetAssessmentEngine?.(assessmentState);
            break;

          case "remediation":
            localStorage.removeItem("gap_remediation_data");
            localStorage.removeItem("gap_remediation_evidence");
            const remediationState = createInitialGapRemediationState();
            callbacks?.onResetGapRemediation?.(remediationState);
            break;

          case "risk":
            localStorage.removeItem("risk_assessment_data");
            const riskState = createInitialRiskAssessmentState();
            callbacks?.onResetRiskAssessment?.(riskState);
            break;

          case "auditor":
            localStorage.removeItem("auditor_verification_data");
            const auditorState = createInitialAuditorVerificationState();
            callbacks?.onResetAuditorVerification?.(auditorState);
            break;
        }

        toast({
          title: `${moduleType.charAt(0).toUpperCase() + moduleType.slice(1)} Reset`,
          description: `${moduleType.charAt(0).toUpperCase() + moduleType.slice(1)} module has been reset.`,
          variant: "default",
        });

        return true;
      } catch (error) {
        console.error(`Failed to reset ${moduleType} module:`, error);
        toast({
          title: "Reset Failed",
          description: `Failed to reset ${moduleType} module.`,
          variant: "destructive",
        });
        return false;
      }
    },
    [toast]
  );

  /**
   * EMERGENCY: Clear all evidence files only (preserve assessment data)
   */
  const clearEvidenceOnly = useCallback(async () => {
    try {
      console.log("🗑️ CLEARING ALL EVIDENCE FILES...");
      clearAllEvidenceFiles();

      // Refresh page to reload clean data
      toast({
        title: "Evidence Cleared",
        description: "All evidence files have been removed. Refreshing...",
        variant: "default",
      });

      // Reload after a brief delay to allow user to see the toast
      setTimeout(() => {
        window.location.reload();
      }, 1500);

      return true;
    } catch (error) {
      console.error("Failed to clear evidence:", error);
      toast({
        title: "Clear Failed",
        description: "An error occurred while clearing evidence.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  return {
    resetAssessmentLifecycle,
    resetModule,
    clearEvidenceOnly,
  };
};

export default useResetAssessmentLifecycle;
