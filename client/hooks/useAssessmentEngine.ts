import { useState, useCallback, useMemo, useEffect } from "react";
import { AssessmentQuestion, createAllQuestions } from "@/lib/assessmentQuestions";

export interface AssessmentMetrics {
  total: number;
  completed: number;
  gaps: number;
  completionRate: number;
  readinessScore: number;
}

export interface FunctionMetric {
  function: string;
  total: number;
  completed: number;
  gaps: number;
}

export type AssessmentView = "dashboard" | "category-list" | "focus-mode";

const STORAGE_KEY = "nist_assessment_answers";

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

// Helper: Save answers to localStorage
const saveAnswersToStorage = (questions: AssessmentQuestion[]) => {
  if (!isLocalStorageAvailable()) return;

  try {
    const answers = questions.map((q) => ({
      nist_id: q.nist_id,
      userAnswer: q.userAnswer,
      maturityScore: q.maturityScore,
      comment: q.comment,
      evidenceUrl: q.evidenceUrl,
      evidenceFileSize: q.evidenceFileSize,
      evidenceFiles: q.evidenceFiles, // NEW: save multiple files
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('assessmentDataChanged'));
  } catch (error) {
    console.error("Failed to save assessment answers:", error);
  }
};

// Helper: Load answers from localStorage
const loadAnswersFromStorage = (): Record<string, any> => {
  if (!isLocalStorageAvailable()) return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};

    const answers = JSON.parse(stored);
    const map: Record<string, any> = {};
    answers.forEach((answer: any) => {
      map[answer.nist_id] = answer;
    });
    return map;
  } catch (error) {
    console.error("Failed to load assessment answers:", error);
    return {};
  }
};

export const useAssessmentEngine = () => {
  // Initialize with fresh questions, then apply stored answers
  const [allQuestions, setAllQuestions] = useState<AssessmentQuestion[]>(() => {
    const fresh = createAllQuestions();
    const stored = loadAnswersFromStorage();

    if (Object.keys(stored).length === 0) {
      console.log(`✓ Assessment Engine: Loaded ${fresh.length} fresh questions (no saved answers)`);
    }

    return fresh.map((q) =>
      stored[q.nist_id]
        ? { ...q, ...stored[q.nist_id] }
        : q
    );
  });
  const [currentView, setCurrentView] = useState<AssessmentView>("dashboard");
  const [currentFunction, setCurrentFunction] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // Save answers to localStorage whenever they change
  useEffect(() => {
    saveAnswersToStorage(allQuestions);
  }, [allQuestions]);

  // Listen for changes from other components
  useEffect(() => {
    const handleDataChange = () => {
      const stored = loadAnswersFromStorage();
      // If storage was cleared, we must also clear in-memory answers; otherwise
      // the autosave effect will immediately rehydrate cleared data.
      if (Object.keys(stored).length === 0) {
        setAllQuestions(createAllQuestions());
        return;
      }

      setAllQuestions((prev) =>
        prev.map((q) =>
          stored[q.nist_id] ? { ...q, ...stored[q.nist_id] } : q
        )
      );
    };

    window.addEventListener('assessmentDataChanged', handleDataChange);
    return () => window.removeEventListener('assessmentDataChanged', handleDataChange);
  }, []);

  // NIST Functions in order
  const nistFunctions = ["GOVERN", "IDENTIFY", "PROTECT", "DETECT", "RESPOND", "RECOVER"];

  // Filter questions by function
  const getQuestionsByFunction = useCallback(
    (functionName: string): AssessmentQuestion[] => {
      return allQuestions.filter((q) => q.function === functionName);
    },
    [allQuestions]
  );

  // Filter questions by function and category
  const getQuestionsByFunctionAndCategory = useCallback(
    (functionName: string, categoryName: string): AssessmentQuestion[] => {
      return allQuestions.filter(
        (q) => q.function === functionName && q.category === categoryName
      );
    },
    [allQuestions]
  );

  // Get unique categories for a function
  const getCategoriesForFunction = useCallback(
    (functionName: string): string[] => {
      const categories = new Set<string>();
      allQuestions
        .filter((q) => q.function === functionName)
        .forEach((q) => categories.add(q.category));
      return Array.from(categories).sort();
    },
    [allQuestions]
  );

  // Compute gap_flag for questions (true if answer is 'Partial' or 'No')
  const computeGapFlag = useCallback((question: AssessmentQuestion): boolean => {
    if (!question.userAnswer) return false;
    return question.userAnswer === "Partial" || question.userAnswer === "No";
  }, []);

  // Get currently filtered questions based on view
  const filteredQuestions = useMemo(() => {
    if (currentView === "focus-mode" && currentFunction && currentCategory) {
      return getQuestionsByFunctionAndCategory(currentFunction, currentCategory);
    }
    if (currentView === "category-list" && currentFunction) {
      return getQuestionsByFunction(currentFunction);
    }
    return allQuestions;
  }, [currentView, currentFunction, currentCategory, allQuestions, getQuestionsByFunctionAndCategory, getQuestionsByFunction]);

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  // Get questions with computed gap_flag
  const getQuestionsWithGapFlag = useCallback((): AssessmentQuestion[] => {
    return allQuestions.map((q) => ({
      ...q,
      gap_flag: computeGapFlag(q),
    }));
  }, [allQuestions, computeGapFlag]);

  // Get global metrics across ALL questions
  // REAL-TIME COUNTER: Re-calculates immediately on any question state change
  const getGlobalMetrics = useCallback((): AssessmentMetrics => {
    const completed = allQuestions.filter((q) => q.userAnswer !== null).length;
    const gaps = allQuestions.filter((q) => {
      const hasGap = computeGapFlag(q) || (q.maturityScore !== null && q.maturityScore < 3);
      return hasGap && q.userAnswer !== null;
    }).length;
    const totalQuestions = allQuestions.length;

    // Calculate readiness score (average of all maturity scores for answered questions)
    const answeredQuestions = allQuestions.filter((q) => q.userAnswer !== null && q.maturityScore !== null);
    const readinessScore = answeredQuestions.length > 0
      ? Math.round((answeredQuestions.reduce((sum, q) => sum + (q.maturityScore || 0), 0) / answeredQuestions.length) * 100) / 100
      : 0;

    // Debug: Log metric changes for real-time verification
    if (process.env.NODE_ENV === 'development') {
      console.log("📊 REAL-TIME METRICS UPDATE:", {
        total: totalQuestions,
        completed,
        gaps,
        completionRate: totalQuestions > 0 ? Math.round((completed / totalQuestions) * 100) : 0,
        readinessScore,
      });
    }

    return {
      total: totalQuestions,
      completed,
      gaps,
      completionRate: totalQuestions > 0 ? Math.round((completed / totalQuestions) * 100) : 0,
      readinessScore,
    };
  }, [allQuestions, computeGapFlag]);

  // Get metrics for current function
  const getFunctionMetrics = useCallback(
    (functionName: string): FunctionMetric => {
      const questions = getQuestionsByFunction(functionName);
      const completed = questions.filter((q) => q.userAnswer !== null).length;
      const gaps = questions.filter((q) => q.maturityScore !== null && q.maturityScore < 3).length;

      return {
        function: functionName,
        total: questions.length,
        completed,
        gaps,
      };
    },
    [getQuestionsByFunction]
  );

  // Get metrics for a specific category
  const getCategoryMetrics = useCallback(
    (functionName: string, categoryName: string) => {
      const questions = getQuestionsByFunctionAndCategory(functionName, categoryName);
      const completed = questions.filter((q) => q.userAnswer !== null).length;

      return {
        total: questions.length,
        completed,
      };
    },
    [getQuestionsByFunctionAndCategory]
  );

  // Update a question's answer
  const updateQuestionAnswer = useCallback(
    (nist_id: string, userAnswer: string | null, maturityScore: number | null) => {
      setAllQuestions((prev) =>
        prev.map((q) =>
          q.nist_id === nist_id
            ? { ...q, userAnswer, maturityScore }
            : q
        )
      );
    },
    []
  );

  // Update a question's comment
  const updateQuestionComment = useCallback(
    (nist_id: string, comment: string) => {
      setAllQuestions((prev) =>
        prev.map((q) =>
          q.nist_id === nist_id
            ? { ...q, comment }
            : q
        )
      );
    },
    []
  );

  // Update evidence URL
  const updateQuestionEvidence = useCallback(
    (nist_id: string, evidenceUrl: string | null) => {
      setAllQuestions((prev) =>
        prev.map((q) =>
          q.nist_id === nist_id
            ? { ...q, evidenceUrl }
            : q
        )
      );
    },
    []
  );

  // Update evidence file size
  const updateQuestionEvidenceFileSize = useCallback(
    (nist_id: string, fileSize: number | null) => {
      setAllQuestions((prev) =>
        prev.map((q) =>
          q.nist_id === nist_id
            ? { ...q, evidenceFileSize: fileSize }
            : q
        )
      );
    },
    []
  );

  // Add a new evidence file to a question
  const addEvidenceFile = useCallback(
    (nist_id: string, file: { url: string; name: string; size: number }) => {
      setAllQuestions((prev) =>
        prev.map((q) =>
          q.nist_id === nist_id
            ? {
                ...q,
                evidenceFiles: [...q.evidenceFiles, file],
                // Also update legacy evidenceUrl for backward compatibility
                evidenceUrl: file.url,
                evidenceFileSize: file.size,
              }
            : q
        )
      );
    },
    []
  );

  // Remove an evidence file from a question by URL
  const removeEvidenceFile = useCallback(
    (nist_id: string, fileUrl: string) => {
      setAllQuestions((prev) =>
        prev.map((q) =>
          q.nist_id === nist_id
            ? {
                ...q,
                evidenceFiles: q.evidenceFiles.filter((f) => f.url !== fileUrl),
                // Update legacy fields if this was the only file
                evidenceUrl: q.evidenceFiles.length === 1 ? null : q.evidenceUrl,
                evidenceFileSize: q.evidenceFiles.length === 1 ? null : q.evidenceFileSize,
              }
            : q
        )
      );
    },
    []
  );

  // Navigate to next question
  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [currentQuestionIndex, filteredQuestions.length]);

  // Navigate to previous question
  const previousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  // Enter focus mode for a category
  const enterFocusMode = useCallback((functionName: string, categoryName: string) => {
    setCurrentFunction(functionName);
    setCurrentCategory(categoryName);
    setCurrentQuestionIndex(0);
    setCurrentView("focus-mode");
  }, []);

  // Exit focus mode (back to category list)
  const exitFocusMode = useCallback(() => {
    setCurrentQuestionIndex(0);
    setCurrentCategory(null);
    setCurrentView("category-list");
  }, []);

  // Select a function (go to category list)
  const selectFunction = useCallback((functionName: string) => {
    setCurrentFunction(functionName);
    setCurrentQuestionIndex(0);
    setCurrentCategory(null);
    setCurrentView("category-list");
  }, []);

  // Return to dashboard
  const returnToDashboard = useCallback(() => {
    setCurrentView("dashboard");
    setCurrentFunction(null);
    setCurrentCategory(null);
    setCurrentQuestionIndex(0);
  }, []);

  // Get recent assessment progress for Continue Assessment dashboard
  const getRecentAssessmentProgress = useCallback(() => {
    // Find the last answered question (most recent update)
    let lastAnsweredQuestion: AssessmentQuestion | null = null;
    for (let i = allQuestions.length - 1; i >= 0; i--) {
      if (allQuestions[i].userAnswer !== null) {
        lastAnsweredQuestion = allQuestions[i];
        break;
      }
    }

    // If no questions have been answered yet, suggest starting with the first question
    if (!lastAnsweredQuestion) {
      const firstQuestion = allQuestions[0];
      return {
        hasProgress: false,
        currentNistId: firstQuestion.nist_id,
        currentFunction: firstQuestion.function,
        currentCategory: firstQuestion.category,
        categoryProgress: { total: 0, completed: 0 },
        nextAction: "Start Assessment",
        message: "Begin your NIST CSF 2.0 Assessment",
      };
    }

    const currentFunction = lastAnsweredQuestion.function;
    const currentCategory = lastAnsweredQuestion.category;

    // Get all questions in the current category
    const categoryQuestions = getQuestionsByFunctionAndCategory(
      currentFunction,
      currentCategory
    );
    const categoryProgress = getCategoryMetrics(currentFunction, currentCategory);

    // Check if category is fully completed
    const isCategoryComplete =
      categoryProgress.completed === categoryProgress.total;

    // Find next action
    let nextNistId = lastAnsweredQuestion.nist_id;
    let nextFunction = currentFunction;
    let nextCategory = currentCategory;
    let nextAction = "Continue Assessment";

    if (isCategoryComplete) {
      // Find the next category
      const currentFunctionIndex = nistFunctions.indexOf(currentFunction);
      const categoriesInFunction = getCategoriesForFunction(currentFunction);
      const currentCategoryIndex = categoriesInFunction.indexOf(currentCategory);

      if (currentCategoryIndex < categoriesInFunction.length - 1) {
        // Next category in same function
        nextCategory = categoriesInFunction[currentCategoryIndex + 1];
      } else if (currentFunctionIndex < nistFunctions.length - 1) {
        // Next function
        nextFunction = nistFunctions[currentFunctionIndex + 1];
        const categoriesInNextFunction = getCategoriesForFunction(nextFunction);
        nextCategory = categoriesInNextFunction[0];
      } else {
        // All functions completed
        nextAction = "Assessment Complete";
        nextNistId = lastAnsweredQuestion.nist_id;
        return {
          hasProgress: true,
          currentNistId: nextNistId,
          currentFunction: nextFunction,
          currentCategory: nextCategory,
          categoryProgress,
          nextAction,
          message: "All assessments completed!",
          isAssessmentComplete: true,
        };
      }

      // Get the first question in the next category
      const nextCategoryQuestions = getQuestionsByFunctionAndCategory(
        nextFunction,
        nextCategory
      );
      if (nextCategoryQuestions.length > 0) {
        nextNistId = nextCategoryQuestions[0].nist_id;
      }
      nextAction = `Start ${nextCategory}`;
    } else {
      // Continue in current category - find first unanswered question
      const unanswereddQuestion = categoryQuestions.find(
        (q) => q.userAnswer === null
      );
      if (unanswereddQuestion) {
        nextNistId = unanswereddQuestion.nist_id;
      }
    }

    return {
      hasProgress: true,
      currentNistId: nextNistId,
      currentFunction: nextFunction,
      currentCategory: nextCategory,
      categoryProgress,
      nextAction,
      lastAnsweredNistId: lastAnsweredQuestion.nist_id,
      completionPercentage: categoryProgress.total > 0
        ? Math.round((categoryProgress.completed / categoryProgress.total) * 100)
        : 0,
    };
  }, [
    allQuestions,
    nistFunctions,
    getQuestionsByFunctionAndCategory,
    getCategoryMetrics,
    getCategoriesForFunction,
  ]);

  // Check if at final question
  const isAtFinalQuestion = currentQuestionIndex === filteredQuestions.length - 1;
  const isAtFirstQuestion = currentQuestionIndex === 0;

  return {
    // State
    allQuestions,
    currentView,
    currentFunction,
    currentCategory,
    currentQuestionIndex,
    filteredQuestions,
    currentQuestion,
    nistFunctions,

    // Setters
    setCurrentQuestionIndex,

    // Question updates
    updateQuestionAnswer,
    updateQuestionComment,
    updateQuestionEvidence,
    updateQuestionEvidenceFileSize,

    // File management
    addEvidenceFile,
    removeEvidenceFile,

    // Navigation
    nextQuestion,
    previousQuestion,
    selectFunction,
    enterFocusMode,
    exitFocusMode,
    returnToDashboard,

    // Metrics
    getGlobalMetrics,
    getFunctionMetrics,
    getCategoryMetrics,
    getCategoriesForFunction,
    getQuestionsByFunction,
    getQuestionsByFunctionAndCategory,
    getQuestionsWithGapFlag,
    getRecentAssessmentProgress,

    // Status
    isAtFinalQuestion,
    isAtFirstQuestion,
  };
};
