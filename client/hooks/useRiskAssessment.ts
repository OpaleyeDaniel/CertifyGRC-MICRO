import { useState, useCallback, useEffect } from "react";
import {
  RiskAssessment,
  RiskAssessmentState,
  createEmptyRiskAssessment,
} from "@/lib/gapRiskTypes";

const STORAGE_KEY = "risk_assessment_data";

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

// Helper: Save risk assessment data to localStorage
const saveToStorage = (data: RiskAssessmentState) => {
  if (!isLocalStorageAvailable()) return;

  try {
    // Keep storage clean: remove key when there is no data
    if (Object.keys(data).length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('riskAssessmentDataChanged'));
  } catch (error) {
    console.error("Failed to save risk assessment data:", error);
  }
};

// Helper: Load risk assessment data from localStorage
const loadFromStorage = (): RiskAssessmentState => {
  if (!isLocalStorageAvailable()) return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to load risk assessment data:", error);
    return {};
  }
};

export const useRiskAssessment = () => {
  const [allRiskAssessments, setAllRiskAssessments] = useState<RiskAssessmentState>(() => {
    const stored = loadFromStorage();

    // Ensure all completed risk assessments have maturityScore
    if (Object.keys(stored).length > 0) {
      const fixed = Object.entries(stored).reduce((acc, [riskId, risk]: any) => {
        const normalizedStatus =
          risk.status === "completed"
            ? "Completed"
            : risk.status === "pending"
              ? "Pending"
              : risk.status;

        const normalizedRisk = {
          ...risk,
          status: normalizedStatus,
        };

        if (normalizedRisk.status === "Completed" && normalizedRisk.maturityScore === undefined) {
          // Recalculate maturityScore from postTreatmentRiskLevel
          const calculated = (() => {
            switch (normalizedRisk.postTreatmentRiskLevel) {
              case "HIGH": return 2;
              case "MEDIUM": return 3;
              case "LOW": return 4;
              default: return 2;
            }
          })();
          acc[riskId] = { ...normalizedRisk, maturityScore: calculated };
        } else {
          acc[riskId] = normalizedRisk;
        }
        return acc;
      }, {} as RiskAssessmentState);
      return fixed;
    }

    return stored;
  });

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    saveToStorage(allRiskAssessments);
  }, [allRiskAssessments]);

  // Listen for changes from other components
  useEffect(() => {
    const handleDataChange = () => {
      const stored = loadFromStorage();
      setAllRiskAssessments(stored);
    };

    window.addEventListener('riskAssessmentDataChanged', handleDataChange);
    return () => window.removeEventListener('riskAssessmentDataChanged', handleDataChange);
  }, []);

  // Get or create a risk assessment record
  const getOrCreateRiskAssessment = useCallback(
    (
      questionId: string,
      nistId: string,
      gapDescription: string,
      functionName: string = "",
      category: string = ""
    ): RiskAssessment => {
      const existingRisk = Object.values(allRiskAssessments).find(
        (risk) => risk.questionId === questionId
      );

      if (existingRisk) {
        return existingRisk;
      }

      const newRisk = createEmptyRiskAssessment(
        questionId,
        nistId,
        gapDescription,
        functionName,
        category
      );

      setAllRiskAssessments((prev) => ({
        ...prev,
        [newRisk.riskId]: newRisk,
      }));

      return newRisk;
    },
    [allRiskAssessments]
  );

  // Get risk assessment by risk ID
  const getRiskAssessment = useCallback(
    (riskId: string): RiskAssessment | null => {
      return allRiskAssessments[riskId] || null;
    },
    [allRiskAssessments]
  );

  // Get risk assessment by question ID
  const getRiskAssessmentByQuestionId = useCallback(
    (questionId: string): RiskAssessment | null => {
      return (
        Object.values(allRiskAssessments).find((risk) => risk.questionId === questionId) || null
      );
    },
    [allRiskAssessments]
  );

  // Update risk assessment fields
  const updateRiskAssessment = useCallback(
    (riskId: string, updates: Partial<RiskAssessment>) => {
      setAllRiskAssessments((prev) => ({
        ...prev,
        [riskId]: {
          ...prev[riskId],
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      }));
    },
    []
  );

  // Save complete risk assessment (moves to Risk Register)
  const saveRiskAssessment = useCallback((riskId: string) => {
    setAllRiskAssessments((prev) => ({
      ...prev,
      [riskId]: {
        ...prev[riskId],
        status: "Completed",
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  // Reset a completed risk back to "Pending" for revision rework
  // Preserves all existing data — the user edits in place
  const resetToPending = useCallback((questionId: string) => {
    setAllRiskAssessments((prev) => {
      const entry = Object.values(prev).find((r) => r.questionId === questionId);
      if (!entry) return prev;
      return {
        ...prev,
        [entry.riskId]: {
          ...entry,
          status: "Pending",
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }, []);

  // Get pending risk assessments
  const getPendingRisks = useCallback((): RiskAssessment[] => {
    return Object.values(allRiskAssessments).filter((risk) => risk.status === "Pending");
  }, [allRiskAssessments]);

  // Get completed risk assessments (Risk Register)
  const getCompletedRisks = useCallback((): RiskAssessment[] => {
    return Object.values(allRiskAssessments).filter((risk) => risk.status === "Completed");
  }, [allRiskAssessments]);

  return {
    allRiskAssessments,
    getOrCreateRiskAssessment,
    getRiskAssessment,
    getRiskAssessmentByQuestionId,
    updateRiskAssessment,
    saveRiskAssessment,
    resetToPending,
    getPendingRisks,
    getCompletedRisks,
  };
};
