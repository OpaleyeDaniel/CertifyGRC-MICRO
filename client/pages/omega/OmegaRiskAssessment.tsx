import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Shield, ShieldAlert } from "lucide-react";
import {
  OmegaPage,
  OmegaSection,
  OmegaEmptyState,
} from "@/components/omega/OmegaPage";
import { KpiCard } from "@/components/omega/KpiCard";
import { FrameworkFilter } from "@/components/omega/FrameworkFilter";
import { GroupByFramework } from "@/components/omega/GroupByFramework";
import {
  StatusBadge,
  riskTone,
} from "@/components/omega/StatusBadge";
import {
  useAllRisks,
  useFrameworkSummaries,
} from "@/frameworks/useFrameworkSummaries";
import type { FrameworkRiskRecord, RiskLevel } from "@/frameworks/types";
import { cn } from "@/lib/utils";

const LEVEL_ORDER: Record<RiskLevel, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export default function OmegaRiskAssessment() {
  const risks = useAllRisks();
  const entries = useFrameworkSummaries();
  const [frameworkId, setFrameworkId] = useState("all");

  const filtered = useMemo(() => {
    const xs = risks.filter(
      (r) => frameworkId === "all" || r.frameworkId === frameworkId,
    );
    xs.sort(
      (a, b) =>
        LEVEL_ORDER[b.record.residualLevel] - LEVEL_ORDER[a.record.residualLevel],
    );
    return xs;
  }, [risks, frameworkId]);

  const stats = useMemo(() => {
    const buckets = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    let pending = 0;
    let completed = 0;
    filtered.forEach(({ record }) => {
      buckets[record.residualLevel] += 1;
      if (record.status === "pending") pending += 1;
      if (record.status === "completed") completed += 1;
    });
    return { total: filtered.length, buckets, pending, completed };
  }, [filtered]);

  const heatmap = useMemo(() => {
    const grid: number[][] = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => 0),
    );
    filtered.forEach(({ record }) => {
      const l = record.likelihood;
      const i = record.impact;
      if (l && i && l >= 1 && l <= 5 && i >= 1 && i <= 5) {
        grid[5 - i][l - 1] += 1;
      }
    });
    return grid;
  }, [filtered]);

  const frameworkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    risks.forEach((r) => {
      counts[r.frameworkId] = (counts[r.frameworkId] ?? 0) + 1;
    });
    return counts;
  }, [risks]);

  const topConcentrations = useMemo(() => {
    const counts = new Map<string, { count: number; frameworkName: string }>();
    filtered.forEach(({ record, frameworkName }) => {
      const key = record.asset || record.title;
      const existing = counts.get(key);
      counts.set(key, {
        count: (existing?.count ?? 0) + 1,
        frameworkName,
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6);
  }, [filtered]);

  return (
    <OmegaPage
      eyebrow="Omega · Unified risk register"
      title="Risk Assessment"
      description="Unified risk register across frameworks — inherent vs residual, treatment status and heatmap."
      icon={<Shield className="h-5 w-5" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total risks" value={stats.total} icon={Shield} tone="primary" />
        <KpiCard
          label="Critical / high residual"
          value={stats.buckets.CRITICAL + stats.buckets.HIGH}
          tone="danger"
          icon={ShieldAlert}
        />
        <KpiCard label="Pending treatment" value={stats.pending} tone={stats.pending > 0 ? "warning" : "default"} />
        <KpiCard label="Completed" value={stats.completed} tone={stats.completed > 0 ? "success" : "default"} />
      </div>

      <OmegaSection
        title="Risk heatmap"
        description="5×5 likelihood × impact grid across every selected framework."
      >
        <div className="flex flex-wrap items-start gap-6">
          <div className="space-y-2">
            <div className="flex items-stretch gap-2">
              <div className="flex flex-col justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Impact ↑</span>
                <span>5</span>
                <span>4</span>
                <span>3</span>
                <span>2</span>
                <span>1</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {heatmap.map((row, rIdx) =>
                  row.map((count, cIdx) => {
                    const impact = 5 - rIdx;
                    const likelihood = cIdx + 1;
                    const score = impact * likelihood;
                    const bg =
                      score >= 15
                        ? "bg-rose-500/80 text-white"
                        : score >= 9
                          ? "bg-amber-400/80 text-foreground"
                          : "bg-emerald-500/70 text-white";
                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-md text-sm font-semibold shadow-sm",
                          bg,
                          count === 0 && "opacity-30",
                        )}
                        title={`Likelihood ${likelihood} × Impact ${impact} = ${score} · ${count} risk(s)`}
                      >
                        {count || ""}
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
            <div className="ml-8 grid grid-cols-5 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
            <div className="ml-8 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Likelihood →
            </div>
          </div>
          <div className="grow space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="h-3 w-3 rounded-sm bg-rose-500/80" />
              High / critical (score ≥ 15)
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="h-3 w-3 rounded-sm bg-amber-400/80" />
              Medium (score 9–14)
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="h-3 w-3 rounded-sm bg-emerald-500/70" />
              Low (score ≤ 8)
            </div>
            <p className="text-xs text-muted-foreground">
              Based on pre-treatment likelihood × impact from each framework's
              risk module. Empty cells are rendered greyed out.
            </p>
          </div>
        </div>
      </OmegaSection>

      <OmegaSection title="Filter by framework">
        <FrameworkFilter
          frameworks={entries
            .filter((e) => e.summary)
            .map(({ framework }) => framework)}
          value={frameworkId}
          onChange={setFrameworkId}
          counts={frameworkCounts}
        />
      </OmegaSection>

      {topConcentrations.length > 0 && (
        <OmegaSection title="Top concentration areas">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {topConcentrations.map(([label, meta]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {label}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {meta.frameworkName}
                  </div>
                </div>
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {meta.count}
                </span>
              </div>
            ))}
          </div>
        </OmegaSection>
      )}

      <OmegaSection title={`Risk register (${filtered.length})`}>
        <GroupByFramework
          items={filtered}
          emptyState={
            <OmegaEmptyState
              title="No risks yet"
              description="As risk assessments are completed in any framework, they'll appear here."
              icon={<Shield className="h-5 w-5" />}
            />
          }
          groupMeta={(records) => {
            const critical = records.filter(
              (r) =>
                r.residualLevel === "HIGH" || r.residualLevel === "CRITICAL",
            ).length;
            return `${critical} critical/high · ${records.length} total`;
          }}
          renderGroupBody={(records) => (
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Risk</th>
                  <th className="px-4 py-2 text-left font-semibold">Inherent</th>
                  <th className="px-4 py-2 text-left font-semibold">Residual</th>
                  <th className="px-4 py-2 text-left font-semibold">Treatment</th>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                  <th className="px-4 py-2 text-right font-semibold">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {records.slice(0, 80).map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-foreground">
                        {r.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.controlId} · {r.asset ?? r.threat ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {r.inherentLevel ? (
                        <StatusBadge
                          label={r.inherentLevel}
                          tone={riskTone(r.inherentLevel)}
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge
                        label={r.residualLevel}
                        tone={riskTone(r.residualLevel)}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {r.treatmentOption || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs capitalize">
                      {r.status.replace("-", " ")}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        to={r.href}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        Open <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        />
      </OmegaSection>
    </OmegaPage>
  );
}
