import { useMemo } from "react";
import type {
  FrameworkActivityEntry,
  FrameworkAssessmentRecord,
  FrameworkBlocker,
  FrameworkEvidenceRecord,
  FrameworkGapRecord,
  FrameworkImprovementRecord,
  FrameworkModule,
  FrameworkReviewRecord,
  FrameworkRiskRecord,
  FrameworkSummary,
  FrameworkSummaryEntry,
} from "./types";
import {
  ACTIVE_FRAMEWORKS,
  REGISTERED_FRAMEWORKS,
  getFrameworkById,
} from "./registry";
import { useNistSummary } from "./nist-csf/useNistSummary";
import { useIso27001Summary } from "./iso27001/useIso27001Summary";

/**
 * Aggregates summaries from every active framework.
 *
 * React requires a fixed set of hook calls, so each integrated framework’s
 * `useSummary` is invoked here explicitly. When you **remove** a framework
 * from the platform: delete it from `REGISTERED_FRAMEWORKS` in `registry.ts`
 * and remove its hook import + call + `summariesById` entry below — the rest
 * of the shell stays unchanged.
 */
export function useFrameworkSummaries(): FrameworkSummaryEntry[] {
  const nistSummary = useNistSummary();
  const iso27001Summary = useIso27001Summary();

  return useMemo<FrameworkSummaryEntry[]>(() => {
    const summariesById: Record<string, FrameworkSummary> = {
      "nist-csf": nistSummary,
      iso27001: iso27001Summary,
    };

    return REGISTERED_FRAMEWORKS.map((framework) => ({
      framework,
      summary:
        framework.status === "active"
          ? summariesById[framework.id] ?? null
          : null,
    }));
  }, [nistSummary, iso27001Summary]);
}

export function useFrameworkSummary(id: string): FrameworkSummary | null {
  const entries = useFrameworkSummaries();
  return entries.find((entry) => entry.framework.id === id)?.summary ?? null;
}

/* ------------------------------------------------------------------ */
/* Omega-wide totals                                                   */
/* ------------------------------------------------------------------ */

export interface OmegaTotals {
  totalFrameworks: number;
  activeFrameworks: number;
  frameworksWithActivity: number;
  totalControls: number;
  assessedControls: number;
  openGaps: number;
  pendingRemediations: number;
  overdueRemediations: number;
  evidenceCount: number;
  riskCount: number;
  criticalRisks: number;
  pendingReviews: number;
  averageReadiness: number | null;
  averageProgress: number | null;
  averageEvidenceCoverage: number | null;
  averageMaturity: number | null;
  lastActivityAt: string | null;
}

export function useOmegaTotals(): OmegaTotals {
  const entries = useFrameworkSummaries();

  return useMemo(() => {
    const totals: OmegaTotals = {
      totalFrameworks: entries.length,
      activeFrameworks: ACTIVE_FRAMEWORKS.length,
      frameworksWithActivity: 0,
      totalControls: 0,
      assessedControls: 0,
      openGaps: 0,
      pendingRemediations: 0,
      overdueRemediations: 0,
      evidenceCount: 0,
      riskCount: 0,
      criticalRisks: 0,
      pendingReviews: 0,
      averageReadiness: null,
      averageProgress: null,
      averageEvidenceCoverage: null,
      averageMaturity: null,
      lastActivityAt: null,
    };

    const readiness: number[] = [];
    const progress: number[] = [];
    const coverage: number[] = [];
    const maturity: number[] = [];

    entries.forEach(({ summary }) => {
      if (!summary) return;
      if (summary.hasActivity) totals.frameworksWithActivity += 1;
      totals.totalControls += summary.totalControls;
      totals.assessedControls += summary.assessedControls;
      totals.openGaps += summary.openGaps;
      totals.pendingRemediations += summary.pendingRemediations;
      totals.overdueRemediations += summary.overdueRemediations;
      totals.evidenceCount += summary.evidenceCount;
      totals.riskCount += summary.riskCount;
      totals.criticalRisks += summary.criticalRisks;
      totals.pendingReviews += summary.pendingReviews;

      if (typeof summary.readinessScore === "number")
        readiness.push(summary.readinessScore);
      if (typeof summary.assessmentProgress === "number")
        progress.push(summary.assessmentProgress);
      if (typeof summary.evidenceCoverage === "number")
        coverage.push(summary.evidenceCoverage);
      if (summary.averageMaturity > 0) maturity.push(summary.averageMaturity);

      if (summary.lastActivityAt) {
        const ts = new Date(summary.lastActivityAt).getTime();
        const prev = totals.lastActivityAt
          ? new Date(totals.lastActivityAt).getTime()
          : 0;
        if (ts > prev) totals.lastActivityAt = summary.lastActivityAt;
      }
    });

    const mean = (xs: number[]) =>
      xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : null;

    totals.averageReadiness = readiness.length ? Math.round(mean(readiness)!) : null;
    totals.averageProgress = progress.length ? Math.round(mean(progress)!) : null;
    totals.averageEvidenceCoverage = coverage.length ? Math.round(mean(coverage)!) : null;
    totals.averageMaturity = maturity.length ? Number(mean(maturity)!.toFixed(2)) : null;

    return totals;
  }, [entries]);
}

/* ------------------------------------------------------------------ */
/* Aggregated record selectors used by the Omega global pages          */
/* ------------------------------------------------------------------ */

export interface WithFramework<T> {
  frameworkId: string;
  frameworkName: string;
  framework: FrameworkModule;
  record: T;
}

function flatten<T>(
  entries: FrameworkSummaryEntry[],
  pick: (s: FrameworkSummary) => T[],
): WithFramework<T>[] {
  const out: WithFramework<T>[] = [];
  entries.forEach(({ framework, summary }) => {
    if (!summary) return;
    pick(summary).forEach((record) => {
      out.push({
        frameworkId: framework.id,
        frameworkName: framework.name,
        framework,
        record,
      });
    });
  });
  return out;
}

export function useAllAssessments(): WithFramework<FrameworkAssessmentRecord>[] {
  const entries = useFrameworkSummaries();
  return useMemo(() => flatten(entries, (s) => s.assessments), [entries]);
}

export function useAllGaps(): WithFramework<FrameworkGapRecord>[] {
  const entries = useFrameworkSummaries();
  return useMemo(() => flatten(entries, (s) => s.gaps), [entries]);
}

export function useAllRisks(): WithFramework<FrameworkRiskRecord>[] {
  const entries = useFrameworkSummaries();
  return useMemo(() => flatten(entries, (s) => s.risks), [entries]);
}

export function useAllEvidence(): WithFramework<FrameworkEvidenceRecord>[] {
  const entries = useFrameworkSummaries();
  return useMemo(() => flatten(entries, (s) => s.evidence), [entries]);
}

export function useAllReviews(): WithFramework<FrameworkReviewRecord>[] {
  const entries = useFrameworkSummaries();
  return useMemo(() => flatten(entries, (s) => s.reviews), [entries]);
}

export function useAllImprovements(): WithFramework<FrameworkImprovementRecord>[] {
  const entries = useFrameworkSummaries();
  return useMemo(() => flatten(entries, (s) => s.improvements), [entries]);
}

export function useAllBlockers(): WithFramework<FrameworkBlocker>[] {
  const entries = useFrameworkSummaries();
  return useMemo(
    () => flatten(entries, (s) => s.auditReadiness.blockers),
    [entries],
  );
}

export interface AggregatedActivityEntry extends FrameworkActivityEntry {
  frameworkId: string;
  frameworkName: string;
  frameworkShort: string;
}

export function useAggregatedActivity(limit = 30): AggregatedActivityEntry[] {
  const entries = useFrameworkSummaries();
  return useMemo(() => {
    const out: AggregatedActivityEntry[] = [];
    entries.forEach(({ framework, summary }) => {
      if (!summary) return;
      summary.recentActivity.forEach((entry) =>
        out.push({
          ...entry,
          frameworkId: framework.id,
          frameworkName: framework.name,
          frameworkShort: framework.shortCode,
        }),
      );
    });
    out.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return out.slice(0, limit);
  }, [entries, limit]);
}

/* Backward compatibility — keep the old Tower naming as aliases.
 * The Omega variants above are the canonical API. */
export const useTowerTotals = useOmegaTotals;
export type TowerTotals = OmegaTotals;

export { getFrameworkById };
