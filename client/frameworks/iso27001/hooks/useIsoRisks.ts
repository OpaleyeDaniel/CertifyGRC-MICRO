import { useCallback, useMemo } from "react";
import {
  nowIso,
  randomId,
  useIsoStore,
  type RiskEntry,
  type TreatmentAction,
} from "./useIsoStore";

export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export function scoreToLevel(score: number): RiskLevel {
  if (score >= 20) return "CRITICAL";
  if (score >= 12) return "HIGH";
  if (score >= 6) return "MEDIUM";
  return "LOW";
}

export function useIsoRisks() {
  const { state, update } = useIsoStore();

  const risks = state.risks;
  const treatmentActions = state.treatmentActions;

  const addRisk = useCallback(
    (input: Omit<RiskEntry, "id" | "createdAt" | "updatedAt" | "inherentScore" | "residualScore">) => {
      const id = randomId("risk");
      const now = nowIso();
      const risk: RiskEntry = {
        ...input,
        id,
        inherentScore: input.likelihood * input.impact,
        residualScore: input.residualLikelihood * input.residualImpact,
        createdAt: now,
        updatedAt: now,
      };
      update((prev) => ({ ...prev, risks: [...prev.risks, risk] }));
      return id;
    },
    [update],
  );

  const updateRisk = useCallback(
    (id: string, patch: Partial<RiskEntry>) => {
      update((prev) => ({
        ...prev,
        risks: prev.risks.map((r) => {
          if (r.id !== id) return r;
          const next: RiskEntry = { ...r, ...patch, updatedAt: nowIso() };
          next.inherentScore = next.likelihood * next.impact;
          next.residualScore = next.residualLikelihood * next.residualImpact;
          return next;
        }),
      }));
    },
    [update],
  );

  const deleteRisk = useCallback(
    (id: string) => update((prev) => ({ ...prev, risks: prev.risks.filter((r) => r.id !== id) })),
    [update],
  );

  const addTreatmentAction = useCallback(
    (input: Omit<TreatmentAction, "id" | "createdAt" | "updatedAt">) => {
      const id = randomId("ta");
      const now = nowIso();
      const action: TreatmentAction = { ...input, id, createdAt: now, updatedAt: now };
      update((prev) => ({ ...prev, treatmentActions: [...prev.treatmentActions, action] }));
      return id;
    },
    [update],
  );

  const updateTreatmentAction = useCallback(
    (id: string, patch: Partial<TreatmentAction>) => {
      update((prev) => ({
        ...prev,
        treatmentActions: prev.treatmentActions.map((a) =>
          a.id === id ? { ...a, ...patch, updatedAt: nowIso() } : a,
        ),
      }));
    },
    [update],
  );

  const deleteTreatmentAction = useCallback(
    (id: string) =>
      update((prev) => ({
        ...prev,
        treatmentActions: prev.treatmentActions.filter((a) => a.id !== id),
      })),
    [update],
  );

  const metrics = useMemo(() => {
    const total = risks.length;
    const byResidualLevel = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<RiskLevel, number>;
    risks.forEach((r) => {
      byResidualLevel[scoreToLevel(r.residualScore)]++;
    });
    const open = risks.filter((r) => r.status === "open" || r.status === "in-progress").length;
    const treated = risks.filter((r) => r.status === "treated" || r.status === "closed").length;
    return { total, byResidualLevel, open, treated };
  }, [risks]);

  return {
    risks,
    treatmentActions,
    addRisk,
    updateRisk,
    deleteRisk,
    addTreatmentAction,
    updateTreatmentAction,
    deleteTreatmentAction,
    metrics,
  };
}
