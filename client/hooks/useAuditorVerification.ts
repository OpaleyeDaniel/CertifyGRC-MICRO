import { useState, useCallback, useMemo, useEffect } from "react";

export interface CommentBubble {
  id: string;
  text: string;
  timestamp: string;
  section: "evidence" | "gap" | "risk";
}

export interface AuditorVerification {
  questionId: string;
  nistId: string;
  status: "pending" | "approved" | "revision_requested";
  isSubmittedForAuditing?: boolean;
  reviewStatus?: "Pending Review" | null; // Trigger from Report Modal "Submit for Review"
  // Separate comment tracking for each evidence section
  assessmentEvidenceComments: CommentBubble[]; // Initial Assessment evidence
  remediationEvidenceComments: CommentBubble[]; // Remediation/Gap evidence
  gapComments: CommentBubble[]; // Gap Analysis comments (for backward compat)
  riskComments: CommentBubble[];
  approvedAt?: string;
  revisionRequestedAt?: string;
  submittedForReviewAt?: string; // Timestamp when submitted for review
  auditorMaturityScore?: number; // Auditor-selected maturity score (1-5) for this control during review
  auditorComment?: string; // Auditor's comment when requesting revision
  // Section-specific auditor maturity scores
  initialAuditorScore?: number; // Auditor score for Initial Assessment section
  remediationAuditorScore?: number; // Auditor score for Gap Analysis & Remediation section
  riskAuditorScore?: number; // Auditor score for Risk Assessment section
}

const STORAGE_KEY = "auditor_verification_data";
const CHANGE_EVENT = "auditorVerificationDataChanged";

export function useAuditorVerification() {
  const [verifications, setVerifications] = useState<Map<string, AuditorVerification>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    console.log("📂 Loading auditor verification from localStorage:", { stored, key: STORAGE_KEY });
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Only load if data is non-empty and valid
        if (Array.isArray(data) && data.length > 0) {
          console.log(`  ✓ Loaded ${data.length} verification records`);
          const map = new Map(data);
          setVerifications(map);
        } else {
          // Clear invalid or empty data
          console.log("  ⚠ Empty or invalid data, clearing localStorage");
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.error("❌ Failed to load auditor verification data:", e);
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      console.log("  ℹ No stored verification data found");
    }
    setIsLoaded(true);
  }, []);

  //my code to load from localStorage on mount.

  

  // Save to localStorage whenever verifications change
  // useEffect(() => {
  //   if (isLoaded) {
  //     const entries = Array.from(verifications.entries());
  //     console.log("💾 Saving to localStorage:", { count: entries.length, key: STORAGE_KEY });
  //     localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  //     // Dispatch custom event to notify other components
  //     window.dispatchEvent(new CustomEvent('auditorVerificationDataChanged'));
  //   }
  // }, [verifications, isLoaded]);

  //re-written codes for Save to localstorage whenever verification change .....unusual

  useEffect(() => {
    if (!isLoaded) return;

    if (verifications.size === 0) {
      console.log("🗑 Removing empty auditor verification storage");
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
      return;
    }

    const entries = Array.from(verifications.entries());
    console.log("💾 Saving to localStorage:", { count: entries.length, key: STORAGE_KEY });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }, [verifications, isLoaded]);

//re-written codes ends here...

  // Listen for changes from other components
  // useEffect(() => {
  //   const handleDataChange = () => {
  //     const stored = localStorage.getItem(STORAGE_KEY);
  //     console.log("🔄 Auditor verification data changed event received");
  //     if (stored) {
  //       try {
  //         const data = JSON.parse(stored);
  //         if (Array.isArray(data) && data.length > 0) {
  //           const map = new Map(data);
  //           setVerifications(map);
  //         }
  //       } catch (e) {
  //         console.error("Failed to reload auditor verification data:", e);
  //       }
  //     }
  //   };

  //   window.addEventListener('auditorVerificationDataChanged', handleDataChange);
  //   return () => window.removeEventListener('auditorVerificationDataChanged', handleDataChange);
  // }, []);
  // Sync when other components (same-tab) update auditor verification storage.
  // Each caller of this hook has its own state instance; without this, the Review page
  // won’t reflect updates made elsewhere until reload.
  useEffect(() => {
    const loadFromStorage = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setVerifications((prev) => (prev.size === 0 ? prev : new Map()));
        return;
      }
      try {
        const data = JSON.parse(stored);
        if (Array.isArray(data)) {
          const next = new Map<string, AuditorVerification>(data);
          setVerifications((prev) => {
            const prevJson = JSON.stringify(Array.from(prev.entries()));
            const nextJson = JSON.stringify(Array.from(next.entries()));
            return prevJson === nextJson ? prev : next;
          });
        }
      } catch (e) {
        console.error("Failed to reload auditor verification data:", e);
      }
    };

    const handleCustomEvent = () => loadFromStorage();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) loadFromStorage();
    };

    window.addEventListener(CHANGE_EVENT, handleCustomEvent as any);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, handleCustomEvent as any);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  //EVERY ADJUSTED CODE ABOVE IS FOR LOCALSTORAGE HANDLING AND CROSS-COMPONENT SYNCING ENDS HERE




  // Get or create verification record
  const getOrCreateVerification = useCallback(
    (questionId: string, nistId: string, isSubmittedForAuditing: boolean = false): AuditorVerification => {
      const existing = verifications.get(questionId);
      if (existing) return existing;

      const newVerification: AuditorVerification = {
        questionId,
        nistId,
        status: "pending",
        isSubmittedForAuditing,
        assessmentEvidenceComments: [],
        remediationEvidenceComments: [],
        gapComments: [],
        riskComments: [],
      };

      // Important: only create during explicit action flows, never during render.
      setVerifications((prev) => {
        if (prev.has(questionId)) return prev;
        return new Map(prev).set(questionId, newVerification);
      });
      return newVerification;
    },
    [verifications]
  );

  // Approve a control
  const approveControl = useCallback(
    (questionId: string) => {
      setVerifications((prev) => {
        const updated = new Map(prev);
        const verification = updated.get(questionId);
        if (!verification) return updated;

        updated.set(questionId, {
          ...verification,
          status: "approved",
          approvedAt: new Date().toISOString(),
          revisionRequestedAt: undefined,
          // Remove from Comment & Review queue
          reviewStatus: null,
          isSubmittedForAuditing: false,
        });
        return updated;
      });
    },
    []
  );

  // Request revision
  const requestRevision = useCallback(
    (questionId: string, comment: string = "") => {
      setVerifications((prev) => {
        const updated = new Map(prev);
        const verification = updated.get(questionId);
        if (!verification) return updated;

        updated.set(questionId, {
          ...verification,
          status: "revision_requested",
          auditorComment: comment,
          revisionRequestedAt: new Date().toISOString(),
          // Remove from Comment & Review queue
          reviewStatus: null,
          isSubmittedForAuditing: false,
        });
        return updated;
      });
    },
    []
  );

  // Add a comment bubble to a section
  const addCommentBubble = useCallback(
    (questionId: string, section: "assessmentEvidence" | "remediationEvidence" | "gap" | "risk", text: string) => {
      if (!text.trim()) return;

      setVerifications((prev) => {
        const updated = new Map(prev);
        const verification = updated.get(questionId);
        if (!verification) return updated;

        const bubble: CommentBubble = {
          id: `${Date.now()}-${Math.random()}`,
          text: text.trim(),
          timestamp: new Date().toISOString(),
          section: section as any,
        };

        if (section === "assessmentEvidence") {
          updated.set(questionId, {
            ...verification,
            assessmentEvidenceComments: [...verification.assessmentEvidenceComments, bubble],
          });
        } else if (section === "remediationEvidence") {
          updated.set(questionId, {
            ...verification,
            remediationEvidenceComments: [...verification.remediationEvidenceComments, bubble],
          });
        } else if (section === "gap") {
          updated.set(questionId, {
            ...verification,
            gapComments: [...verification.gapComments, bubble],
          });
        } else if (section === "risk") {
          updated.set(questionId, {
            ...verification,
            riskComments: [...verification.riskComments, bubble],
          });
        }
        return updated;
      });
    },
    []
  );

  // Remove a comment bubble
  const removeCommentBubble = useCallback(
    (questionId: string, section: "assessmentEvidence" | "remediationEvidence" | "gap" | "risk", commentId: string) => {
      setVerifications((prev) => {
        const updated = new Map(prev);
        const verification = updated.get(questionId);
        if (!verification) return updated;

        if (section === "assessmentEvidence") {
          updated.set(questionId, {
            ...verification,
            assessmentEvidenceComments: verification.assessmentEvidenceComments.filter((c) => c.id !== commentId),
          });
        } else if (section === "remediationEvidence") {
          updated.set(questionId, {
            ...verification,
            remediationEvidenceComments: verification.remediationEvidenceComments.filter((c) => c.id !== commentId),
          });
        } else if (section === "gap") {
          updated.set(questionId, {
            ...verification,
            gapComments: verification.gapComments.filter((c) => c.id !== commentId),
          });
        } else if (section === "risk") {
          updated.set(questionId, {
            ...verification,
            riskComments: verification.riskComments.filter((c) => c.id !== commentId),
          });
        }
        return updated;
      });
    },
    []
  );

  // Mark control as submitted for auditing
  const markAsSubmittedForAuditing = useCallback(
    (questionId: string) => {
      setVerifications((prev) => {
        const updated = new Map(prev);
        const verification = updated.get(questionId);
        if (!verification) return updated;
        updated.set(questionId, { ...verification, isSubmittedForAuditing: true });
        return updated;
      });
    },
    []
  );

  // Submit control for review from Report Modal
  const submitForReview = useCallback(
    (questionId: string, nistId: string) => {
      console.log("💾 submitForReview called:", { questionId, nistId });
      setVerifications((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(questionId);

        // Create verification if it doesn't exist
        if (!existing) {
          console.log("  Creating new verification record");
          const verification: AuditorVerification = {
            questionId,
            nistId,
            status: "pending",
            isSubmittedForAuditing: true,
            reviewStatus: "Pending Review",
            submittedForReviewAt: new Date().toISOString(),
            assessmentEvidenceComments: [],
            remediationEvidenceComments: [],
            gapComments: [],
            riskComments: [],
          };
          updated.set(questionId, verification);
        } else {
          // Update existing verification
          console.log("  Updating existing verification record");
          updated.set(questionId, {
            ...existing,
            reviewStatus: "Pending Review",
            isSubmittedForAuditing: true,
            submittedForReviewAt: new Date().toISOString(),
          });
        }
        console.log("  Final verification:", updated.get(questionId));
        return updated;
      });
    },
    []
  );

  // Clear all verification data (for fresh start)
  const clearAllVerifications = useCallback(() => {
    setVerifications(new Map());
    localStorage.removeItem(STORAGE_KEY);
  }, []);
  //this is to delete a control- unusual
  const deleteVerification = useCallback((questionId: string) => {
  setVerifications((prev) => {
    if (!prev.has(questionId)) return prev;

    const updated = new Map(prev);
    updated.delete(questionId);
    return updated;
  });
}, []);

//ends here


  // Get verification for a control
  const getVerification = useCallback(
    (questionId: string) => {
      return verifications.get(questionId);
    },
    [verifications]
  );

  // Get all verifications
  const getAllVerifications = useCallback(() => {
    return Array.from(verifications.values());
  }, [verifications]);

  // Update auditor maturity score for a control
  const updateAuditorMaturityScore = useCallback(
    (questionId: string, score: number) => {
      // Validate score is between 1 and 5
      if (score < 1 || score > 5 || !Number.isInteger(score)) {
        console.error("Invalid auditor maturity score:", score);
        return;
      }

      setVerifications((prev) => {
        const updated = new Map(prev);
        const verification = updated.get(questionId);
        if (!verification) return updated;
        updated.set(questionId, { ...verification, auditorMaturityScore: score });
        return updated;
      });
    },
    []
  );

  // Update section-specific auditor maturity score
  const updateSectionAuditorScore = useCallback(
    (questionId: string, section: "initial" | "remediation" | "risk", score: number) => {
      // Validate score is between 1 and 5
      if (score < 1 || score > 5 || !Number.isInteger(score)) {
        console.error("Invalid section auditor maturity score:", score);
        return;
      }

      setVerifications((prev) => {
        const updated = new Map(prev);
        const verification = updated.get(questionId);
        if (!verification) return updated;

        if (section === "initial") {
          updated.set(questionId, { ...verification, initialAuditorScore: score });
        } else if (section === "remediation") {
          updated.set(questionId, { ...verification, remediationAuditorScore: score });
        } else if (section === "risk") {
          updated.set(questionId, { ...verification, riskAuditorScore: score });
        }
        return updated;
      });
    },
    []
  );

  // Calculate verification metrics
  const metrics = useMemo(() => {
    const all = Array.from(verifications.values());
    const approved = all.filter((v) => v.status === "approved").length;
    const revisionRequested = all.filter((v) => v.status === "revision_requested").length;
    const pending = all.filter((v) => v.status === "pending").length;

    return {
      totalVerified: approved,
      totalPending: pending,
      totalRevisionRequested: revisionRequested,
      verificationPercentage:
        all.length > 0 ? Math.round((approved / all.length) * 100) : 0,
    };
  }, [verifications]);

  return {
    getOrCreateVerification,
    approveControl,
    requestRevision,
    addCommentBubble,
    removeCommentBubble,
    markAsSubmittedForAuditing,
    submitForReview,
    clearAllVerifications,
    deleteVerification,
    getVerification,
    getAllVerifications,
    updateAuditorMaturityScore,
    updateSectionAuditorScore,
    metrics,
    isLoaded, // Export to allow components to wait for localStorage to load
  };
}