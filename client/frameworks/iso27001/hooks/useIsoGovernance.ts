import { useCallback } from "react";
import {
  nowIso,
  randomId,
  useIsoStore,
  type Finding,
  type InternalAudit,
  type ManagementReview,
  type Comment,
} from "./useIsoStore";

/**
 * useIsoGovernance
 * ------------------
 * Groups all governance-style workspace state — findings (CAPA),
 * internal audits, management reviews, comments & approvals — under
 * one hook so pages can share a consistent API.
 */
export function useIsoGovernance() {
  const { state, update } = useIsoStore();

  /* -------------- Findings / CAPA -------------- */
  const addFinding = useCallback(
    (input: Omit<Finding, "id" | "createdAt" | "updatedAt">) => {
      const id = randomId("finding");
      const now = nowIso();
      update((prev) => ({
        ...prev,
        findings: [...prev.findings, { ...input, id, createdAt: now, updatedAt: now }],
      }));
      return id;
    },
    [update],
  );
  const updateFinding = useCallback(
    (id: string, patch: Partial<Finding>) =>
      update((prev) => ({
        ...prev,
        findings: prev.findings.map((f) => (f.id === id ? { ...f, ...patch, updatedAt: nowIso() } : f)),
      })),
    [update],
  );
  const deleteFinding = useCallback(
    (id: string) => update((prev) => ({ ...prev, findings: prev.findings.filter((f) => f.id !== id) })),
    [update],
  );

  /* -------------- Internal audits -------------- */
  const addAudit = useCallback(
    (input: Omit<InternalAudit, "id" | "createdAt" | "updatedAt">) => {
      const id = randomId("audit");
      const now = nowIso();
      update((prev) => ({
        ...prev,
        internalAudits: [
          ...prev.internalAudits,
          { ...input, id, createdAt: now, updatedAt: now },
        ],
      }));
      return id;
    },
    [update],
  );
  const updateAudit = useCallback(
    (id: string, patch: Partial<InternalAudit>) =>
      update((prev) => ({
        ...prev,
        internalAudits: prev.internalAudits.map((a) =>
          a.id === id ? { ...a, ...patch, updatedAt: nowIso() } : a,
        ),
      })),
    [update],
  );
  const deleteAudit = useCallback(
    (id: string) =>
      update((prev) => ({
        ...prev,
        internalAudits: prev.internalAudits.filter((a) => a.id !== id),
      })),
    [update],
  );

  /* -------------- Management reviews -------------- */
  const addReview = useCallback(
    (input: Omit<ManagementReview, "id" | "createdAt" | "updatedAt">) => {
      const id = randomId("mgmt");
      const now = nowIso();
      update((prev) => ({
        ...prev,
        managementReviews: [
          ...prev.managementReviews,
          { ...input, id, createdAt: now, updatedAt: now },
        ],
      }));
      return id;
    },
    [update],
  );
  const updateReview = useCallback(
    (id: string, patch: Partial<ManagementReview>) =>
      update((prev) => ({
        ...prev,
        managementReviews: prev.managementReviews.map((r) =>
          r.id === id ? { ...r, ...patch, updatedAt: nowIso() } : r,
        ),
      })),
    [update],
  );
  const deleteReview = useCallback(
    (id: string) =>
      update((prev) => ({
        ...prev,
        managementReviews: prev.managementReviews.filter((r) => r.id !== id),
      })),
    [update],
  );

  /* -------------- Comments -------------- */
  const addComment = useCallback(
    (input: Omit<Comment, "id" | "createdAt">) => {
      const id = randomId("cmt");
      update((prev) => ({
        ...prev,
        comments: [...prev.comments, { ...input, id, createdAt: nowIso() }],
      }));
      return id;
    },
    [update],
  );
  const resolveComment = useCallback(
    (id: string) =>
      update((prev) => ({
        ...prev,
        comments: prev.comments.map((c) => (c.id === id ? { ...c, resolved: true } : c)),
      })),
    [update],
  );
  const deleteComment = useCallback(
    (id: string) =>
      update((prev) => ({ ...prev, comments: prev.comments.filter((c) => c.id !== id) })),
    [update],
  );

  return {
    findings: state.findings,
    addFinding,
    updateFinding,
    deleteFinding,
    audits: state.internalAudits,
    addAudit,
    updateAudit,
    deleteAudit,
    reviews: state.managementReviews,
    addReview,
    updateReview,
    deleteReview,
    comments: state.comments,
    addComment,
    resolveComment,
    deleteComment,
  };
}
