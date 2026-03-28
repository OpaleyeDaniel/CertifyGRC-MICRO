import { useState, useCallback, useEffect } from "react";
import { GapRemediation } from "@/lib/gapRemediationTypes";

/**
 * Status of a revision record
 * - pending: Control in revision, waiting for user to start rework
 * - in_progress: User has started reworking the revision
 * - completed: User finished reworking and control moved to treated gaps
 */
export type RevisionStatus = "pending" | "in_progress" | "completed";

/**
 * Revision Record
 * Tracks controls returned for revision from Continuous Improvement
 * Preserves old gap/remediation data and auditor context
 */
export interface RevisionRecord {
  // Link to original control
  controlId: string; // Assessment Question ID
  nistId: string;
  controlTitle: string; // The full question text
  category: string; // NIST Category
  function: string; // NIST Function (GOVERN, IDENTIFY, etc.)

  // Revision context from auditor
  auditorComment?: string; // Why the auditor requested revision
  auditorScore?: number; // Auditor's score (1-5) at the time of revision
  reviewDate?: string; // ISO date when revision was requested

  // Old gap/remediation data to preserve (prefilled in Revision tab)
  oldGapData?: {
    rootCause?: string;
    currentState?: number;
    targetState?: number;
    severity?: string;
  };
  oldRemediationData?: GapRemediation;

  // Status tracking
  status: RevisionStatus;

  // Metadata
  createdAt: string;
  updatedAt: string;
  startedAt?: string; // When user started reworking
}

/**
 * Container for all revision records
 */
export interface RevisionState {
  [controlId: string]: RevisionRecord;
}

const STORAGE_KEY = "revision_data";
const CHANGE_EVENT = "revisionDataChanged";

/**
 * Hook to manage Revision records
 * These records track controls returned for revision and preserve old gap/remediation data
 */
export function useRevision() {
  const [items, setItems] = useState<Map<string, RevisionRecord>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    console.log("📂 Loading Revision records from localStorage:", { stored, key: STORAGE_KEY });
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (Array.isArray(data) && data.length > 0) {
          console.log(`  ✓ Loaded ${data.length} Revision records`);
          const map = new Map(data);
          setItems(map);
        } else {
          console.log("  ℹ No stored Revision data found");
        }
      } catch (e) {
        console.error("❌ Failed to load Revision data:", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (isLoaded) {
      const entries = Array.from(items.entries());
      console.log("💾 Saving Revision records to localStorage:", { count: entries.length, key: STORAGE_KEY });
      if (entries.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
    }
  }, [items, isLoaded]);

  // Sync when other components clear/update revision storage.
  useEffect(() => {
    const syncFromStorage = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setItems((prev) => (prev.size === 0 ? prev : new Map()));
        return;
      }
      try {
        const data = JSON.parse(stored);
        if (Array.isArray(data)) {
          const next = new Map<string, RevisionRecord>(data);
          setItems((prev) => {
            const prevJson = JSON.stringify(Array.from(prev.entries()));
            const nextJson = JSON.stringify(Array.from(next.entries()));
            return prevJson === nextJson ? prev : next;
          });
        }
      } catch (e) {
        console.error("Failed to reload Revision data:", e);
      }
    };

    const handleCustom = () => syncFromStorage();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) syncFromStorage();
    };

    window.addEventListener(CHANGE_EVENT, handleCustom as any);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, handleCustom as any);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  /**
   * Create a revision record when a control is parsed from Continuous Improvement
   * Preserves old gap and remediation data for prefilling
   */
  const createRevisionRecord = useCallback(
    (
      controlId: string,
      nistId: string,
      controlTitle: string,
      category: string,
      function_: string,
      auditorComment?: string,
      auditorScore?: number,
      reviewDate?: string,
      oldGapData?: any,
      oldRemediationData?: GapRemediation
    ) => {
      const now = new Date().toISOString();

      setItems((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(controlId);

        if (!existing) {
          const newRecord: RevisionRecord = {
            controlId,
            nistId,
            controlTitle,
            category,
            function: function_,
            auditorComment,
            auditorScore,
            reviewDate,
            oldGapData,
            oldRemediationData,
            status: "pending",
            createdAt: now,
            updatedAt: now,
          };
          updated.set(controlId, newRecord);
          console.log(`✅ Created Revision record for ${nistId}`);
        } else {
          // Update existing revision record if it already exists
          existing.auditorComment = auditorComment;
          existing.auditorScore = auditorScore;
          existing.reviewDate = reviewDate;
          existing.oldGapData = oldGapData;
          existing.oldRemediationData = oldRemediationData;
          existing.status = "pending";
          existing.updatedAt = now;
          console.log(`✏️ Updated Revision record for ${nistId}`);
        }
        return updated;
      });
    },
    []
  );

  /**
   * Mark a revision record as "in_progress" when user starts reworking
   */
  const markAsInProgress = useCallback((controlId: string) => {
    setItems((prev) => {
      const updated = new Map(prev);
      const item = updated.get(controlId);
      if (item) {
        item.status = "in_progress";
        item.startedAt = new Date().toISOString();
        item.updatedAt = new Date().toISOString();
        console.log(`🔄 Marked Revision record ${item.nistId} as in_progress`);
      }
      return updated;
    });
  }, []);

  /**
   * Mark a revision record as "completed" when user finishes reworking
   * This removes it from the Revision tab
   */
  const markAsCompleted = useCallback((controlId: string) => {
    setItems((prev) => {
      const updated = new Map(prev);
      const item = updated.get(controlId);
      if (item) {
        item.status = "completed";
        item.updatedAt = new Date().toISOString();
        console.log(`✅ Marked Revision record ${item.nistId} as completed`);
      }
      return updated;
    });
  }, []);

  /**
   * Get a specific revision record by control ID
   */
  const getRevisionRecord = useCallback(
    (controlId: string): RevisionRecord | undefined => {
      return items.get(controlId);
    },
    [items]
  );

  /**
   * Get all pending revision records
   */
  const getPendingRevisions = useCallback((): RevisionRecord[] => {
    return Array.from(items.values()).filter((item) => item.status === "pending");
  }, [items]);

  /**
   * Get all revision records for a specific function
   */
  const getRevisionsByFunction = useCallback(
    (function_: string | "All"): RevisionRecord[] => {
      const pending = getPendingRevisions();
      if (function_ === "All") {
        return pending;
      }
      return pending.filter((item) => item.function === function_);
    },
    [getPendingRevisions]
  );

  /**
   * Get all revision records (all statuses)
   */
  const getAllRevisions = useCallback((): RevisionRecord[] => {
    return Array.from(items.values());
  }, [items]);

  /**
   * Delete a revision record (for cleanup)
   */
  const deleteRevisionRecord = useCallback((controlId: string) => {
    setItems((prev) => {
      const updated = new Map(prev);
      updated.delete(controlId);
      return updated;
    });
  }, []);

  return {
    // Creation & updates
    createRevisionRecord,
    markAsInProgress,
    markAsCompleted,

    // Queries
    getRevisionRecord,
    getPendingRevisions,
    getRevisionsByFunction,
    getAllRevisions,

    // Cleanup
    deleteRevisionRecord,

    // State
    isLoaded,
  };
}
