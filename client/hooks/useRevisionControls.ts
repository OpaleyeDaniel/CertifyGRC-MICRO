import { useState, useCallback, useEffect } from "react";
import { GapRemediation } from "@/lib/gapRemediationTypes";

/**
 * Revision Control Record
 * Represents a control that was returned for revision from Continuous Improvement
 */
export interface RevisionControl {
  controlId: string; // Assessment Question ID
  nistId: string;
  controlTitle: string; // The full question text
  category: string; // NIST Category
  function: string; // NIST Function (GOVERN, IDENTIFY, etc.)
  auditorComment?: string; // Why the auditor requested revision
  auditorScore?: number; // Auditor's score (1-5) at the time of revision
  reviewDate?: string; // ISO date when revision was requested
  gapData?: {
    rootCause?: string;
    currentState?: number;
    targetState?: number;
    severity?: string;
  };
  remediationData?: GapRemediation; // Old remediation data prefilled
}

/**
 * Container for all revision controls
 */
export interface RevisionControlsState {
  [controlId: string]: RevisionControl;
}

const STORAGE_KEY = "revision_controls_data";
const CHANGE_EVENT = "revisionControlsUpdated";

/**
 * Hook to manage the shared revisionControls dataset
 * This is a simple localStorage-backed dataset that stores controls
 * returned for revision from Continuous Improvement
 */
export function useRevisionControls() {
  const [controls, setControls] = useState<Map<string, RevisionControl>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (Array.isArray(data) && data.length > 0) {
          console.log(`✓ Loaded ${data.length} revision controls from localStorage`);
          const map = new Map(data);
          setControls(map);
        }
        if (Array.isArray(data) && data.length === 0) {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.error("❌ Failed to load revision controls:", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      setControls(new Map());
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever controls change
  useEffect(() => {
    if (isLoaded) {
      const entries = Array.from(controls.entries());
      if (entries.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      console.log(`💾 Saved ${entries.length} revision controls to localStorage`);
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
    }
  }, [controls, isLoaded]);

  // Sync when other components update/clear revision controls (same-tab + cross-tab).
  useEffect(() => {
    if (!isLoaded) return;

    const loadFromStorage = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setControls((prev) => (prev.size === 0 ? prev : new Map()));
        return;
      }
      try {
        const data = JSON.parse(stored);
        const next = Array.isArray(data) ? new Map<string, RevisionControl>(data) : new Map();
        setControls((prev) => {
          const prevJson = JSON.stringify(Array.from(prev.entries()));
          const nextJson = JSON.stringify(Array.from(next.entries()));
          return prevJson === nextJson ? prev : next;
        });
      } catch (e) {
        console.error("Failed to reload revision controls:", e);
      }
    };

    const handleCustom = () => loadFromStorage();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) loadFromStorage();
    };

    window.addEventListener(CHANGE_EVENT, handleCustom as any);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, handleCustom as any);
      window.removeEventListener("storage", handleStorage);
    };
  }, [isLoaded]);

  /**
   * Add or update a control in the revisionControls dataset
   * Called when user clicks "Resume Rework" in Continuous Improvement
   */
  const addRevisionControl = useCallback(
    (control: RevisionControl) => {
      setControls((prev) => {
        const updated = new Map(prev);
        updated.set(control.controlId, control);
        console.log(`✅ Added revision control: ${control.nistId}`);
        return updated;
      });
    },
    []
  );

  /**
   * Remove a control from the revisionControls dataset
   * Called when user submits remediation from a Revision control
   */
  const removeRevisionControl = useCallback((controlId: string) => {
    setControls((prev) => {
      const updated = new Map(prev);
      if (updated.has(controlId)) {
        const nistId = updated.get(controlId)?.nistId;
        updated.delete(controlId);
        console.log(`✅ Removed revision control: ${nistId}`);
      }
      return updated;
    });
  }, []);

  /**
   * Get a specific revision control by ID
   */
  const getRevisionControl = useCallback(
    (controlId: string): RevisionControl | undefined => {
      return controls.get(controlId);
    },
    [controls]
  );

  /**
   * Get all revision controls
   */
  const getAllRevisionControls = useCallback((): RevisionControl[] => {
    return Array.from(controls.values());
  }, [controls]);

  /**
   * Get revision controls for a specific function
   */
  const getRevisionControlsByFunction = useCallback(
    (function_: string | "All"): RevisionControl[] => {
      const all = Array.from(controls.values());
      if (function_ === "All") {
        return all;
      }
      return all.filter((control) => control.function === function_);
    },
    [controls]
  );

  /**
   * Check if a control is in revision
   */
  const isControlInRevision = useCallback(
    (controlId: string): boolean => {
      return controls.has(controlId);
    },
    [controls]
  );

  return {
    // Mutations
    addRevisionControl,
    removeRevisionControl,

    // Queries
    getRevisionControl,
    getAllRevisionControls,
    getRevisionControlsByFunction,
    isControlInRevision,

    // State
    isLoaded,
  };
}
