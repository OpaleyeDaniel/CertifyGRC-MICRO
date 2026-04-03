import { useState, useCallback, useEffect } from "react";

/**
 * Status of a continuous improvement item
 * - revision_required: Auditor requested revision, waiting for implementation to start
 * - in_progress: Implementer has started work on the revision
 * - resubmitted: Implementer completed rework and resubmitted for auditing
 */
export type CIStatus = "revision_required" | "in_progress" | "resubmitted";

/**
 * Continuous Improvement Record
 * Tracks controls that were not approved and need rework
 * Tied to the real control record but with its own lifecycle
 * All controls resume from Gap Analysis and continue through the normal workflow
 */
export interface ContinuousImprovementItem {
  // Link to original control
  controlId: string; // Assessment Question ID
  nistId: string;
  controlTitle: string; // The full question text
  category: string; // NIST Category
  function: string; // NIST Function (GOVERN, IDENTIFY, etc.)

  // Revision details
  auditorComment?: string; // Legacy aggregate comment
  auditorOverallComment?: string; // Auditor's overall comment
  auditorInitialComment?: string; // Auditor comment for Initial Assessment (A)
  auditorGapComment?: string; // Auditor comment for Gap & Remediation
  auditorRiskComment?: string; // Auditor comment for Risk Assessment
  auditorScore?: number; // Legacy overall score
  auditorOverallScore?: number; // Auditor overall score (1-5)

  // Section-specific auditor scores (preserved for context)
  initialAuditorScore?: number;
  remediationAuditorScore?: number;
  riskAuditorScore?: number;

  // Status tracking
  status: CIStatus;

  // Metadata
  reviewedBy?: string; // Auditor's name/ID (optional)
  reviewDate?: string; // ISO date when revision was requested
  createdAt: string;
  updatedAt: string;
  lastResumedAt?: string; // When implementer last resumed work
}

/**
 * Container for all CI items
 */
export interface ContinuousImprovementState {
  [controlId: string]: ContinuousImprovementItem;
}

const STORAGE_KEY = "continuous_improvement_data";

/**
 * Hook to manage Continuous Improvement records
 * These records track controls that need revision after auditor review
 */
export function useContinuousImprovement() {
  const [items, setItems] = useState<Map<string, ContinuousImprovementItem>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    console.log("📂 Loading CI records from localStorage:", { stored, key: STORAGE_KEY });
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (Array.isArray(data) && data.length > 0) {
          console.log(`  ✓ Loaded ${data.length} CI records`);
          const map = new Map(data);
          setItems(map);
        } else {
          console.log("  ℹ No stored CI data found");
        }
      } catch (e) {
        console.error("❌ Failed to load CI data:", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (isLoaded) {
      const entries = Array.from(items.entries());
      console.log("💾 Saving CI records to localStorage:", { count: entries.length, key: STORAGE_KEY });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('continuousImprovementDataChanged'));
    }
  }, [items, isLoaded]);

  // Listen for changes from other components
  // useEffect(() => {
  //   const handleDataChange = () => {
  //     const stored = localStorage.getItem(STORAGE_KEY);
  //     console.log("🔄 Continuous improvement data changed event received");
  //     if (stored) {
  //       try {
  //         const data = JSON.parse(stored);
  //         if (Array.isArray(data) && data.length > 0) {
  //           const map = new Map(data);
  //           setItems(map);
  //         }
  //       } catch (e) {
  //         console.error("Failed to reload CI data:", e);
  //       }
  //     }
  //   };

  //   window.addEventListener('continuousImprovementDataChanged', handleDataChange);
  //   return () => window.removeEventListener('continuousImprovementDataChanged', handleDataChange);
  // }, []);


  useEffect(() => {
  const handleDataChange = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    console.log("🔄 Continuous improvement data changed event received");

    let nextMap = new Map<string, ContinuousImprovementItem>();

    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (Array.isArray(data) && data.length > 0) {
          nextMap = new Map(data);
        }
      } catch (e) {
        console.error("Failed to reload CI data:", e);
      }
    }

    setItems((prev) => {
      const prevJson = JSON.stringify(Array.from(prev.entries()));
      const nextJson = JSON.stringify(Array.from(nextMap.entries()));
      return prevJson === nextJson ? prev : nextMap;
    });
  };

  window.addEventListener("continuousImprovementDataChanged", handleDataChange);
  return () => {
    window.removeEventListener("continuousImprovementDataChanged", handleDataChange);
  };
}, []);

  /**
   * Create or update a CI record when auditor requests revision
   * This is called from the Review page when "Request Revision" is clicked
   * All controls resume from Gap Analysis and continue through the normal workflow
   */
  const createOrUpdateCIRecord = useCallback(
    (
      controlId: string,
      nistId: string,
      controlTitle: string,
      category: string,
      function_: string,
      auditorOverallComment: string,
      auditorOverallScore?: number,
      auditorInitialComment?: string,
      auditorGapComment?: string,
      auditorRiskComment?: string,
      initialAuditorScore?: number,
      remediationAuditorScore?: number,
      riskAuditorScore?: number
    ) => {
      const now = new Date().toISOString();

      setItems((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(controlId);

        if (existing) {
          // Update existing CI record with new revision request
          existing.auditorComment = auditorOverallComment;
          existing.auditorOverallComment = auditorOverallComment;
          existing.auditorInitialComment = auditorInitialComment;
          existing.auditorGapComment = auditorGapComment;
          existing.auditorRiskComment = auditorRiskComment;
          existing.auditorScore = auditorOverallScore;
          existing.auditorOverallScore = auditorOverallScore;
          existing.initialAuditorScore = initialAuditorScore;
          existing.remediationAuditorScore = remediationAuditorScore;
          existing.riskAuditorScore = riskAuditorScore;
          existing.status = "revision_required";
          existing.reviewDate = now;
          existing.updatedAt = now;
          console.log(`✏️ Updated CI record for ${nistId}`);
        } else {
          // Create new CI record
          const newItem: ContinuousImprovementItem = {
            controlId,
            nistId,
            controlTitle,
            category,
            function: function_,
            auditorComment: auditorOverallComment,
            auditorOverallComment,
            auditorInitialComment,
            auditorGapComment,
            auditorRiskComment,
            auditorScore: auditorOverallScore,
            auditorOverallScore,
            initialAuditorScore,
            remediationAuditorScore,
            riskAuditorScore,
            status: "revision_required",
            reviewDate: now,
            createdAt: now,
            updatedAt: now,
          };
          updated.set(controlId, newItem);
          console.log(`✅ Created CI record for ${nistId}`);
        }
        return updated;
      });
    },
    []
  );

  /**
   * Mark a CI record as "in_progress" when implementer starts rework
   * Called when "Resume Rework" button is clicked
   */
  const markAsInProgress = useCallback((controlId: string) => {
    setItems((prev) => {
      const updated = new Map(prev);
      const item = updated.get(controlId);
      if (item) {
        item.status = "in_progress";
        item.lastResumedAt = new Date().toISOString();
        item.updatedAt = new Date().toISOString();
        console.log(`🔄 Marked CI record ${item.nistId} as in_progress`);
      }
      return updated;
    });
  }, []);

  /**
   * Mark a CI record as "resubmitted" when implementer completes rework
   * This happens when they submit the control again for auditing
   */
  const markAsResubmitted = useCallback((controlId: string) => {
    setItems((prev) => {
      const updated = new Map(prev);
      const item = updated.get(controlId);
      if (item) {
        item.status = "resubmitted";
        item.updatedAt = new Date().toISOString();
        console.log(`✅ Marked CI record ${item.nistId} as resubmitted`);
      }
      return updated;
    });
  }, []);

  /**
   * Get a specific CI record by control ID
   */
  const getCIRecord = useCallback(
    (controlId: string): ContinuousImprovementItem | undefined => {
      return items.get(controlId);
    },
    [items]
  );

  /**
   * Get all CI records that require revision (status = revision_required)
   */
  const getRevisionRequiredItems = useCallback((): ContinuousImprovementItem[] => {
    return Array.from(items.values()).filter(
      (item) => item.status === "revision_required" || item.status === "in_progress"
    );
  }, [items]);

  /**
   * Get all CI records with a specific status
   */
  const getItemsByStatus = useCallback(
    (status: CIStatus): ContinuousImprovementItem[] => {
      return Array.from(items.values()).filter((item) => item.status === status);
    },
    [items]
  );

  /**
   * Get all CI records for a specific function/category
   */
  const getItemsByFunction = useCallback(
    (function_: string | "All"): ContinuousImprovementItem[] => {
      if (function_ === "All") {
        return getRevisionRequiredItems();
      }
      return getRevisionRequiredItems().filter((item) => item.function === function_);
    },
    [getRevisionRequiredItems]
  );

  /**
   * Get all available CI items (all statuses)
   */
  const getAllItems = useCallback((): ContinuousImprovementItem[] => {
    return Array.from(items.values());
  }, [items]);

  /**
   * Delete a CI record (for cleanup, shouldn't normally be used)
   */
  const deleteCIRecord = useCallback((controlId: string) => {
    setItems((prev) => {
      const updated = new Map(prev);
      updated.delete(controlId);
      return updated;
    });
  }, []);

  return {
    // Creation & updates
    createOrUpdateCIRecord,
    markAsInProgress,
    markAsResubmitted,

    // Queries
    getCIRecord,
    getRevisionRequiredItems,
    getItemsByStatus,
    getItemsByFunction,
    getAllItems,

    // Cleanup
    deleteCIRecord,

    // State
    isLoaded,
  };
}
