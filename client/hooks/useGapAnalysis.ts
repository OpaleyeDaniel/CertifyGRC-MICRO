import { useState, useCallback, useMemo } from "react";
import {
  GapRecord,
  GapAuditEntry,
  GapAnalysisMetrics,
  GapsByFunction,
} from "@/lib/gapAnalysisTypes";
import { AssessmentQuestion } from "@/lib/assessmentQuestions";

const NIST_FUNCTIONS = ["GOVERN", "IDENTIFY", "PROTECT", "DETECT", "RESPOND", "RECOVER"];

/**
 * useGapAnalysis Hook
 * 
 * Manages gap derivation from assessment data and mutations while
 * maintaining GRC compliance rules:
 * - Source assessment data is READ-ONLY
 * - Gap records store derived + editable fields
 * - Full audit trail maintained
 * - Validation enforced for completeness
 */
export const useGapAnalysis = (allQuestions: AssessmentQuestion[]) => {
  const [gapRecords, setGapRecords] = useState<GapRecord[]>([]);

  /**
   * Derive gaps from assessment questions
   * Gap exists when: question answered AND maturityScore < 3
   */
  const deriveGapsFromAssessment = useCallback((): GapRecord[] => {
    const now = new Date().toISOString();
    const derivedGaps: GapRecord[] = [];

    allQuestions.forEach((question) => {
      // Only create gap if question is answered and score is below 3 (i.e., "No" or "Partial")
      if (question.userAnswer && question.maturityScore !== null && question.maturityScore < 3) {
        const gapId = `GAP-${question.nist_id}`;

        // Check if gap already exists
        const existingGap = gapRecords.find((g) => g.id === gapId);

        if (existingGap) {
          derivedGaps.push(existingGap);
        } else {
          // Create new gap record
          const newGap: GapRecord = {
            id: gapId,
            nist_id: question.nist_id,
            nist_function: question.function,
            nist_category: question.category,

            // Source data (READ-ONLY)
            sourceQuestionText: question.question,
            sourceAnswer: question.userAnswer,
            sourceMaturityScore: question.maturityScore,

            // Derived fields
            gap_flag: true,
            currentState: question.maturityScore,

            // Editable fields (default empty)
            targetState: 0,
            severity: "Medium",
            gapDescription: "",

            // Auto-calculated status
            gapStatus: "Open",
            isComplete: false,

            // Metadata
            createdAt: now,
            lastModified: now,

            // Audit trail
            auditLog: [
              {
                timestamp: now,
                action: "created",
                changedBy: "system",
                newValue: `Gap derived from assessment (score: ${question.maturityScore})`,
              },
            ],
          };

          derivedGaps.push(newGap);
        }
      }
    });

    return derivedGaps;
  }, [allQuestions, gapRecords]);

  /**
   * Initialize/sync gaps from assessment
   * Called when assessment data changes
   */
  const syncGapsFromAssessment = useCallback(() => {
    const derivedGaps = deriveGapsFromAssessment();
    setGapRecords(derivedGaps);
  }, [deriveGapsFromAssessment]);

  /**
   * Validate gap completeness
   * GRC Rule: Cannot submit incomplete gaps
   */
  const validateGap = useCallback((gap: GapRecord): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!gap.targetState || gap.targetState <= gap.currentState) {
      errors.push(`Target state must be greater than current state (${gap.currentState})`);
    }

    if (!gap.gapDescription || gap.gapDescription.trim().length === 0) {
      errors.push("Gap description is required");
    }

    if (!gap.severity) {
      errors.push("Severity must be assigned");
    }

    if (!gap.assignedTo || gap.assignedTo.trim().length === 0) {
      errors.push("Gap must be assigned to an owner");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }, []);

  /**
   * Update gap severity (editable field)
   * GRC Rule: Maintains audit trail
   */
  const updateGapSeverity = useCallback(
    (gapId: string, severity: "Low" | "Medium" | "High" | "Critical") => {
      setGapRecords((prev) =>
        prev.map((gap) => {
          if (gap.id === gapId) {
            const oldValue = gap.severity;
            const now = new Date().toISOString();

            return {
              ...gap,
              severity,
              lastModified: now,
              auditLog: [
                ...gap.auditLog,
                {
                  timestamp: now,
                  action: "field_updated",
                  field: "severity",
                  oldValue,
                  newValue: severity,
                  changedBy: "user",
                },
              ],
            };
          }
          return gap;
        })
      );
    },
    []
  );

  /**
   * Update gap target state (editable field)
   * GRC Rule: Maintains audit trail
   */
  const updateGapTargetState = useCallback((gapId: string, targetState: number) => {
    setGapRecords((prev) =>
      prev.map((gap) => {
        if (gap.id === gapId) {
          const oldValue = gap.targetState.toString();
          const now = new Date().toISOString();

          return {
            ...gap,
            targetState,
            lastModified: now,
            auditLog: [
              ...gap.auditLog,
              {
                timestamp: now,
                action: "field_updated",
                field: "targetState",
                oldValue,
                newValue: targetState.toString(),
                changedBy: "user",
              },
            ],
          };
        }
        return gap;
      })
    );
  }, []);

  /**
   * Update gap description (editable field)
   * GRC Rule: Maintains audit trail
   */
  const updateGapDescription = useCallback((gapId: string, description: string) => {
    setGapRecords((prev) =>
      prev.map((gap) => {
        if (gap.id === gapId) {
          const now = new Date().toISOString();

          return {
            ...gap,
            gapDescription: description,
            lastModified: now,
            auditLog: [
              ...gap.auditLog,
              {
                timestamp: now,
                action: "field_updated",
                field: "gapDescription",
                changedBy: "user",
              },
            ],
          };
        }
        return gap;
      })
    );
  }, []);

  /**
   * Update gap owner/assignee (editable field)
   * GRC Rule: Maintains audit trail
   */
  const updateGapAssignment = useCallback((gapId: string, assignedTo: string) => {
    setGapRecords((prev) =>
      prev.map((gap) => {
        if (gap.id === gapId) {
          const oldValue = gap.assignedTo || "unassigned";
          const now = new Date().toISOString();

          return {
            ...gap,
            assignedTo,
            lastModified: now,
            auditLog: [
              ...gap.auditLog,
              {
                timestamp: now,
                action: "field_updated",
                field: "assignedTo",
                oldValue,
                newValue: assignedTo,
                changedBy: "user",
              },
            ],
          };
        }
        return gap;
      })
    );
  }, []);

  /**
   * Close a gap (change status to Closed)
   * GRC Rule: Can only close if gap is complete
   */
  const closeGap = useCallback((gapId: string): { success: boolean; errors: string[] } => {
    const gap = gapRecords.find((g) => g.id === gapId);
    if (!gap) {
      return { success: false, errors: ["Gap not found"] };
    }

    const validation = validateGap(gap);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    setGapRecords((prev) =>
      prev.map((g) => {
        if (g.id === gapId) {
          const now = new Date().toISOString();

          return {
            ...g,
            gapStatus: "Closed",
            isComplete: true,
            lastModified: now,
            auditLog: [
              ...g.auditLog,
              {
                timestamp: now,
                action: "status_changed",
                oldValue: "Open",
                newValue: "Closed",
                changedBy: "user",
              },
            ],
          };
        }
        return g;
      })
    );

    return { success: true, errors: [] };
  }, [gapRecords, validateGap]);

  /**
   * Re-open a gap
   * GRC Rule: Maintains audit trail
   */
  const reopenGap = useCallback((gapId: string) => {
    setGapRecords((prev) =>
      prev.map((gap) => {
        if (gap.id === gapId) {
          const now = new Date().toISOString();

          return {
            ...gap,
            gapStatus: "Open",
            isComplete: false,
            lastModified: now,
            auditLog: [
              ...gap.auditLog,
              {
                timestamp: now,
                action: "status_changed",
                oldValue: "Closed",
                newValue: "Open",
                changedBy: "user",
              },
            ],
          };
        }
        return gap;
      })
    );
  }, []);

  /**
   * Calculate global gap metrics
   */
  const getGlobalMetrics = useCallback((): GapAnalysisMetrics => {
    const totalGaps = gapRecords.length;
    const openGaps = gapRecords.filter((g) => g.gapStatus === "Open").length;
    const closedGaps = gapRecords.filter((g) => g.gapStatus === "Closed").length;
    const criticalGaps = gapRecords.filter((g) => g.severity === "Critical").length;
    const highGaps = gapRecords.filter((g) => g.severity === "High").length;

    const completeGaps = gapRecords.filter((g) => {
      const validation = validateGap(g);
      return validation.valid;
    }).length;

    const completionRate = totalGaps > 0 ? Math.round((completeGaps / totalGaps) * 100) : 0;

    return {
      totalGaps,
      openGaps,
      closedGaps,
      criticalGaps,
      highGaps,
      completionRate,
    };
  }, [gapRecords, validateGap]);

  /**
   * Get gaps grouped by function
   */
  const getGapsByFunction = useCallback((): GapsByFunction[] => {
    return NIST_FUNCTIONS.map((func) => {
      const functionGaps = gapRecords.filter((g) => g.nist_function === func);
      const openGaps = functionGaps.filter((g) => g.gapStatus === "Open").length;
      const criticalGaps = functionGaps.filter((g) => g.severity === "Critical").length;
      const highGaps = functionGaps.filter((g) => g.severity === "High").length;

      return {
        function: func,
        gaps: functionGaps,
        metrics: {
          total: functionGaps.length,
          open: openGaps,
          critical: criticalGaps,
          high: highGaps,
        },
      };
    }).filter((g) => g.gaps.length > 0);
  }, [gapRecords]);

  /**
   * Check if all gaps are complete
   * Used to auto-trigger Risk Assessment phase
   */
  const areAllGapsComplete = useCallback((): boolean => {
    if (gapRecords.length === 0) return false;
    return gapRecords.every((gap) => {
      const validation = validateGap(gap);
      return validation.valid && gap.gapStatus === "Closed";
    });
  }, [gapRecords, validateGap]);

  return {
    // State
    gapRecords,

    // Derivation & Sync
    syncGapsFromAssessment,
    deriveGapsFromAssessment,

    // Mutations (GRC-compliant)
    updateGapSeverity,
    updateGapTargetState,
    updateGapDescription,
    updateGapAssignment,
    closeGap,
    reopenGap,

    // Validation
    validateGap,
    areAllGapsComplete,

    // Metrics
    getGlobalMetrics,
    getGapsByFunction,
  };
};
