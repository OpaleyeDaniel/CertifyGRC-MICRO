import { useState, useCallback, useEffect } from "react";
import {
  GapRemediation,
  GapRemediationState,
  createEmptyGapRemediation,
} from "@/lib/gapRemediationTypes";

const STORAGE_KEY = "gap_remediation_data";

// Helper: Check if localStorage is available
const isLocalStorageAvailable = (): boolean => {
  try {
    if (typeof window === "undefined") return false;
    const test = "__test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

// Helper: Save remediation data to localStorage
const saveTStorage = (data: GapRemediationState) => {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Dispatch custom event to notify other components
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('gapRemediationDataChanged'));
    }, 0);
  } catch (error) {
    console.error("Failed to save gap remediation data:", error);
  }
};

// Helper: Load remediation data from localStorage
const loadFromStorage = (): GapRemediationState => {
  if (!isLocalStorageAvailable()) return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to load gap remediation data:", error);
    return {};
  }
};

export const useGapRemediation = () => {
  const [allRemediations, setAllRemediations] = useState<GapRemediationState>(() => {
    const stored = loadFromStorage();
    if (Object.keys(stored).length === 0) {
      console.log("✓ Gap Remediation: Initialized with no remediation records");
    }
    return stored;
  });

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    saveTStorage(allRemediations);
  }, [allRemediations]);

  // Listen for same-tab + cross-tab changes.
  // Important: each component calling useGapRemediation() has its own state,
  // so we sync via storage + a same-tab custom event, with a strict no-op guard
  // to avoid feedback loops (save -> event -> reload -> save).
  useEffect(() => {
    const syncFromStorage = () => {
      const next = loadFromStorage();
      setAllRemediations((prev) => {
        const prevJson = JSON.stringify(prev);
        const nextJson = JSON.stringify(next);
        return prevJson === nextJson ? prev : next;
      });
    };

    const handleCustomEvent = () => syncFromStorage();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) syncFromStorage();
    };

    window.addEventListener("gapRemediationDataChanged", handleCustomEvent);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("gapRemediationDataChanged", handleCustomEvent);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Get or create a remediation record
  const getOrCreateRemediation = useCallback(
    (
      questionId: string,
      nistId: string,
      question: string,
      category: string,
      function_name: string,
      initialMaturityScore?: number | null // Optional: capture initial score from assessment
    ): GapRemediation => {
      if (allRemediations[questionId]) {
        console.log(`✓ getOrCreateRemediation: Using existing remediation for ${nistId}`);
        return allRemediations[questionId];
      }

      console.log(`✓ getOrCreateRemediation: Creating new remediation for ${nistId}`);
      const newRemediation = createEmptyGapRemediation(
        questionId,
        nistId,
        question,
        category,
        function_name,
        initialMaturityScore // Pass initial score to template
      );

      setAllRemediations((prev) => {
        const updated = {
          ...prev,
          [questionId]: newRemediation,
        };
        console.log(`✓ Created remediation for ${nistId}, total remediations:`, Object.keys(updated).length);
        return updated;
      });

      return newRemediation;
    },
    [allRemediations]
  );

  // Get remediation by question ID
  const getRemediation = useCallback(
    (questionId: string): GapRemediation | null => {
      return allRemediations[questionId] || null;
    },
    [allRemediations]
  );

  // Update remediation fields
  const updateRemediation = useCallback(
    (questionId: string, updates: Partial<GapRemediation>) => {
      console.log(`🔧 updateRemediation called for ${questionId}:`, updates);
      setAllRemediations((prev) => {
        const existing = prev[questionId];
        if (!existing) {
          console.warn(`updateRemediation: No remediation found for ${questionId}`);
          return prev;
        }
        const updated = {
          ...prev,
          [questionId]: {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        };
        console.log(`✓ remediation updated for ${questionId}, new status:`, updated[questionId].status);
        return updated;
      });
    },
    []
  );

  // Save remediation (marks status as "Draft")
  const saveRemediation = useCallback((questionId: string, newStatus?: string) => {
    setAllRemediations((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        status: (newStatus as any) || "Draft",
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  // Close remediation (marks status as "Treated")
  const closeRemediation = useCallback((questionId: string) => {
    setAllRemediations((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        status: "Treated",
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  return {
    allRemediations,
    getOrCreateRemediation,
    getRemediation,
    updateRemediation,
    saveRemediation,
    closeRemediation,
  };
};
