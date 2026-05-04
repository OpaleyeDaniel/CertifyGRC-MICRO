import { useCallback, useMemo } from "react";
import {
  nowIso,
  randomId,
  useIsoStore,
  type EvidenceFile,
} from "./useIsoStore";

const STALE_DAYS = 180;

export function useIsoEvidence() {
  const { state, update } = useIsoStore();
  const files = state.evidenceFiles;

  const add = useCallback(
    (input: Omit<EvidenceFile, "id" | "uploadedAt">) => {
      const file: EvidenceFile = {
        ...input,
        id: randomId("ev"),
        uploadedAt: nowIso(),
        reviewStatus: input.reviewStatus ?? "unreviewed",
      };
      update((prev) => ({ ...prev, evidenceFiles: [...prev.evidenceFiles, file] }));
      return file.id;
    },
    [update],
  );

  const updateFile = useCallback(
    (id: string, patch: Partial<EvidenceFile>) => {
      update((prev) => ({
        ...prev,
        evidenceFiles: prev.evidenceFiles.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      }));
    },
    [update],
  );

  const remove = useCallback(
    (id: string) =>
      update((prev) => ({
        ...prev,
        evidenceFiles: prev.evidenceFiles.filter((f) => f.id !== id),
      })),
    [update],
  );

  const linkToQuestion = useCallback(
    (id: string, questionId: string) => {
      update((prev) => ({
        ...prev,
        evidenceFiles: prev.evidenceFiles.map((f) => {
          if (f.id !== id) return f;
          const linkedQuestions = f.linkedQuestions.includes(questionId)
            ? f.linkedQuestions
            : [...f.linkedQuestions, questionId];
          return { ...f, linkedQuestions };
        }),
        questions: {
          ...prev.questions,
          [questionId]: {
            ...prev.questions[questionId],
            evidence: [
              ...(prev.questions[questionId]?.evidence ?? []),
              { evidenceId: id },
            ],
            updatedAt: nowIso(),
          },
        },
      }));
    },
    [update],
  );

  const unlinkFromQuestion = useCallback(
    (id: string, questionId: string) => {
      update((prev) => ({
        ...prev,
        evidenceFiles: prev.evidenceFiles.map((f) =>
          f.id === id
            ? { ...f, linkedQuestions: f.linkedQuestions.filter((q) => q !== questionId) }
            : f,
        ),
        questions: {
          ...prev.questions,
          [questionId]: {
            ...prev.questions[questionId],
            evidence: (prev.questions[questionId]?.evidence ?? []).filter(
              (ref) => ref.evidenceId !== id,
            ),
            updatedAt: nowIso(),
          },
        },
      }));
    },
    [update],
  );

  const linkToControl = useCallback(
    (id: string, controlRef: string) => {
      update((prev) => ({
        ...prev,
        evidenceFiles: prev.evidenceFiles.map((f) => {
          if (f.id !== id) return f;
          const linkedControls = f.linkedControls.includes(controlRef)
            ? f.linkedControls
            : [...f.linkedControls, controlRef];
          return { ...f, linkedControls };
        }),
      }));
    },
    [update],
  );

  const metrics = useMemo(() => {
    const now = Date.now();
    const stale = files.filter((f) => now - new Date(f.uploadedAt).getTime() > STALE_DAYS * 24 * 60 * 60 * 1000).length;
    const unreviewed = files.filter((f) => f.reviewStatus === "unreviewed").length;
    const rejected = files.filter((f) => f.reviewStatus === "rejected").length;
    const totalBytes = files.reduce((s, f) => s + (f.sizeBytes || 0), 0);
    const unlinked = files.filter((f) => f.linkedQuestions.length === 0 && f.linkedControls.length === 0).length;
    return { total: files.length, stale, unreviewed, rejected, totalBytes, unlinked };
  }, [files]);

  return { files, add, updateFile, remove, linkToQuestion, unlinkFromQuestion, linkToControl, metrics };
}
