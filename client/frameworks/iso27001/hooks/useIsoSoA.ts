import { useCallback, useMemo } from "react";
import { nowIso, useIsoStore, type SoAEntry, type ReviewStatus } from "./useIsoStore";
import { ANNEX_A, getAnnexImplementationQuestion, type Applicability, type ImplementationStatus } from "../data";
import { scoreControl, implementationStatusFromAnswer } from "./useIsoAssessment";

/**
 * Derive a complete SoA view from the Annex A catalogue plus the
 * persisted state. If an entry doesn't exist in state yet, a default
 * "applicable / not-implemented" stub is returned with the derived
 * implementation status based on the question answers.
 */
export function useIsoSoA() {
  const { state, update } = useIsoStore();

  const entries = useMemo(() => {
    return ANNEX_A.flatMap((group) =>
      group.controls.map((control) => {
        const existing = state.soa[control.reference];
        const score = scoreControl(control, state.organisation, state.questions);

        const implQ = getAnnexImplementationQuestion(control);
        const implementationAnswer = implQ ? state.questions[implQ.id]?.answer : undefined;
        const derivedStatus: ImplementationStatus = implementationStatusFromAnswer(implementationAnswer);

        const base: SoAEntry = {
          controlRef: control.reference,
          applicability: control.defaultApplicability,
          status: derivedStatus,
          owner: undefined,
          linkedPolicies: [],
          linkedRisks: [],
          linkedProcedures: [],
          reviewStatus: "draft",
          updatedAt: nowIso(),
        };
        const merged: SoAEntry = { ...base, ...(existing ?? {}) };
        return {
          control,
          group,
          entry: merged,
          score,
        };
      }),
    );
  }, [state.soa, state.questions, state.organisation]);

  const setEntry = useCallback(
    (controlRef: string, patch: Partial<SoAEntry>) => {
      update((prev) => {
        const current = prev.soa[controlRef] ?? ({
          controlRef,
          applicability: "applicable",
          status: "not-implemented",
          reviewStatus: "draft",
          updatedAt: nowIso(),
        } as SoAEntry);
        return {
          ...prev,
          soa: {
            ...prev.soa,
            [controlRef]: { ...current, ...patch, updatedAt: nowIso() },
          },
        };
      });
    },
    [update],
  );

  const setApplicability = useCallback(
    (controlRef: string, applicability: Applicability, justification?: string) =>
      setEntry(controlRef, { applicability, justification }),
    [setEntry],
  );

  const setStatus = useCallback(
    (controlRef: string, status: ImplementationStatus) => setEntry(controlRef, { status }),
    [setEntry],
  );

  const setReviewStatus = useCallback(
    (controlRef: string, reviewStatus: ReviewStatus) => setEntry(controlRef, { reviewStatus }),
    [setEntry],
  );

  const approve = useCallback(
    (controlRef: string, approvedBy: string) =>
      setEntry(controlRef, {
        reviewStatus: "approved",
        approvedBy,
        approvedAt: nowIso(),
      }),
    [setEntry],
  );

  return { entries, setEntry, setApplicability, setStatus, setReviewStatus, approve };
}
