import { useState, useEffect } from "react";

export interface AssessmentResponse {
  nist_id: string;
  score: number;
  comment?: string;
  timestamp?: string;
}

export interface AssessmentState {
  responses: { [key: string]: AssessmentResponse };
  lastUpdated?: string;
}

const STORAGE_KEY = "nist_assessment_responses";

export function useAssessment() {
  const [responses, setResponses] = useState<{ [key: string]: AssessmentResponse }>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load responses from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setResponses(parsed);
      }
    } catch (error) {
      console.error("Failed to load assessment responses:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save response
  const saveResponse = (nist_id: string, score: number, comment?: string) => {
    const newResponse: AssessmentResponse = {
      nist_id,
      score,
      comment: comment || undefined,
      timestamp: new Date().toISOString(),
    };

    const updatedResponses = {
      ...responses,
      [nist_id]: newResponse,
    };

    setResponses(updatedResponses);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedResponses));
    } catch (error) {
      console.error("Failed to save assessment response:", error);
    }
  };

  // Get response by NIST ID
  const getResponse = (nist_id: string): AssessmentResponse | undefined => {
    return responses[nist_id];
  };

  // Get all responses
  const getAllResponses = (): AssessmentResponse[] => {
    return Object.values(responses);
  };

  // Get responses by function
  const getResponsesByFunction = (functionName: string, questionIds: string[]): AssessmentResponse[] => {
    return questionIds
      .map((id) => responses[id])
      .filter((r): r is AssessmentResponse => r !== undefined);
  };

  // Calculate function maturity
  const calculateFunctionMaturity = (questionIds: string[]): number => {
    const functionResponses = questionIds
      .map((id) => responses[id])
      .filter((r): r is AssessmentResponse => r !== undefined && r.score !== null && r.score !== undefined);

    if (functionResponses.length === 0) return 0;

    const total = functionResponses.reduce((sum, r) => sum + (r.score || 0), 0);
    return Math.round((total / functionResponses.length) * 10) / 10;
  };

  // Get overall maturity
  const getOverallMaturity = (allQuestionIds: string[]): number => {
    const allResponses = allQuestionIds
      .map((id) => responses[id])
      .filter((r): r is AssessmentResponse => r !== undefined && r.score !== null && r.score !== undefined);

    if (allResponses.length === 0) return 0;

    const total = allResponses.reduce((sum, r) => sum + (r.score || 0), 0);
    return Math.round((total / allResponses.length) * 10) / 10;
  };

  // Get completion stats
  const getCompletionStats = (questionIds: string[]): { completed: number; total: number; percentage: number } => {
    const total = questionIds.length;
    const completed = questionIds.filter((id) => responses[id] !== undefined).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { completed, total, percentage };
  };

  // Clear all responses
  const clearAllResponses = () => {
    setResponses({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear assessment responses:", error);
    }
  };

  // Export responses as JSON
  const exportResponses = (functionName?: string): string => {
    let toExport = responses;
    if (functionName) {
      toExport = Object.fromEntries(
        Object.entries(responses).filter(([key]) =>
          key.startsWith(functionName.split(" ")[0])
        )
      );
    }
    return JSON.stringify(toExport, null, 2);
  };

  return {
    responses,
    isLoaded,
    saveResponse,
    getResponse,
    getAllResponses,
    getResponsesByFunction,
    calculateFunctionMaturity,
    getOverallMaturity,
    getCompletionStats,
    clearAllResponses,
    exportResponses,
  };
}
