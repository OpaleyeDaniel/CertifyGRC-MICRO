import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Filter,
  Flame,
} from "lucide-react";
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
  gapStatusTone,
  severityTone,
} from "@/components/omega/StatusBadge";
import {
  useAllGaps,
  useFrameworkSummaries,
} from "@/frameworks/useFrameworkSummaries";
import type { FrameworkGapRecord } from "@/frameworks/types";

type SeverityFilter = "all" | FrameworkGapRecord["severity"];
type StatusFilter = "all" | FrameworkGapRecord["status"];

const SEV_ORDER: Record<FrameworkGapRecord["severity"], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function fmt(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString() : "—";
}

export default function OmegaGapAnalysis() {
  const gaps = useAllGaps();
  const entries = useFrameworkSummaries();
  const [frameworkId, setFrameworkId] = useState("all");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const xs = gaps.filter((g) => {
      if (frameworkId !== "all" && g.frameworkId !== frameworkId) return false;
      if (severity !== "all" && g.record.severity !== severity) return false;
      if (status !== "all" && g.record.status !== status) return false;
      return true;
    });
    xs.sort(
      (a, b) => SEV_ORDER[b.record.severity] - SEV_ORDER[a.record.severity],
    );
    return xs;
  }, [gaps, frameworkId, severity, status]);

  const stats = useMemo(() => {
    const total = gaps.length;
    const open = gaps.filter((g) => g.record.status === "open").length;
    const inProgress = gaps.filter(
      (g) => g.record.status === "in-progress",
    ).length;
    const treated = gaps.filter((g) => g.record.status === "treated").length;
    const overdue = gaps.filter((g) => g.record.overdue).length;
    const critical = gaps.filter(
      (g) => g.record.severity === "critical" || g.record.severity === "high",
    ).length;
    return { total, open, inProgress, treated, overdue, critical };
  }, [gaps]);

  const recurring = useMemo(() => {
    const counts = new Map<string, number>();
    gaps.forEach(({ record, frameworkName }) => {
      const key = `${frameworkName} · ${record.domain}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [gaps]);

  const frameworkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    gaps.forEach((g) => {
      counts[g.frameworkId] = (counts[g.frameworkId] ?? 0) + 1;
    });
    return counts;
  }, [gaps]);

  return (
    <OmegaPage
      eyebrow="Omega · Cross-framework"
      title="Gap Analysis"
      description="Every gap surfaced by any framework — severity, remediation status, age and recurring problem areas."
      icon={<AlertTriangle className="h-5 w-5" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total gaps" value={stats.total} tone="primary" icon={AlertTriangle} />
        <KpiCard
          label="Open"
          value={stats.open}
          tone={stats.open > 0 ? "danger" : "default"}
        />
        <KpiCard
          label="In progress"
          value={stats.inProgress}
          tone={stats.inProgress > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Treated"
          value={stats.treated}
          tone={stats.treated > 0 ? "success" : "default"}
        />
        <KpiCard
          label="Overdue"
          value={stats.overdue}
          hint="Past expected completion"
          icon={Flame}
          tone={stats.overdue > 0 ? "danger" : "default"}
        />
        <KpiCard
          label="High / critical"
          value={stats.critical}
          hint="Top severity buckets"
          tone={stats.critical > 0 ? "danger" : "default"}
        />
      </div>

      <OmegaSection title="Biggest problem areas">
        {recurring.length === 0 ? (
          <OmegaEmptyState
            title="No gaps yet"
            description="Once assessments flag 'No' or 'Partial' answers, the problem areas will surface here."
            icon={<AlertTriangle className="h-5 w-5" />}
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recurring.map(([label, count]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3 shadow-sm"
              >
                <span className="truncate text-sm font-medium text-foreground">
                  {label}
                </span>
                <span className="ml-2 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-600">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </OmegaSection>

      <OmegaSection title="Filter">
        <div className="flex flex-wrap items-center gap-3">
          <FrameworkFilter
            frameworks={entries
              .filter((e) => e.summary)
              .map(({ framework }) => framework)}
            value={frameworkId}
            onChange={setFrameworkId}
            counts={frameworkCounts}
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {(["all", "critical", "high", "medium", "low"] as SeverityFilter[]).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    severity === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {s === "all" ? "All severities" : s}
                </button>
              ),
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "open", "in-progress", "treated"] as StatusFilter[]).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    status === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {s === "all" ? "All statuses" : s.replace("-", " ")}
                </button>
              ),
            )}
          </div>
        </div>
      </OmegaSection>

      <OmegaSection title={`Gaps (${filtered.length})`}>
        <GroupByFramework
          items={filtered}
          emptyState={
            <OmegaEmptyState
              title="Nothing matches your filters"
              icon={<AlertTriangle className="h-5 w-5" />}
            />
          }
          groupMeta={(records) => {
            const open = records.filter((r) => r.status === "open").length;
            const overdue = records.filter((r) => r.overdue).length;
            return `${open} open · ${overdue} overdue`;
          }}
          renderGroupBody={(records) => (
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Control</th>
                  <th className="px-4 py-2 text-left font-semibold">Severity</th>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                  <th className="px-4 py-2 text-left font-semibold">Age</th>
                  <th className="px-4 py-2 text-left font-semibold">Due</th>
                  <th className="px-4 py-2 text-right font-semibold">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {records.slice(0, 80).map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-xs">
                      <div className="font-semibold text-foreground">
                        {r.controlId}
                      </div>
                      <div className="truncate font-sans text-[11px] text-muted-foreground">
                        {r.title}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge
                        label={r.severity}
                        tone={severityTone(r.severity)}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge
                        label={r.status}
                        tone={gapStatusTone(r.status)}
                      />
                      {r.overdue && (
                        <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
                          <Flame className="h-2.5 w-2.5" /> overdue
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-xs text-muted-foreground">
                      {r.ageDays > 0 ? `${r.ageDays}d` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {fmt(r.expectedCompletionDate)}
                      </span>
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
