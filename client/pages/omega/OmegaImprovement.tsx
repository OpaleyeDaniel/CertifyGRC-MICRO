import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Filter,
  Lightbulb,
  Repeat,
  TrendingUp,
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
  improvementTone,
} from "@/components/omega/StatusBadge";
import {
  useAllGaps,
  useAllImprovements,
  useFrameworkSummaries,
} from "@/frameworks/useFrameworkSummaries";
import type { FrameworkImprovementRecord } from "@/frameworks/types";

type StatusFilter = "all" | FrameworkImprovementRecord["status"];

const STATUSES: StatusFilter[] = [
  "all",
  "revision-required",
  "in-progress",
  "resubmitted",
  "approved",
];

export default function OmegaImprovement() {
  const improvements = useAllImprovements();
  const allGaps = useAllGaps();
  const entries = useFrameworkSummaries();
  const [frameworkId, setFrameworkId] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    return improvements.filter((i) => {
      if (frameworkId !== "all" && i.frameworkId !== frameworkId) return false;
      if (status !== "all" && i.record.status !== status) return false;
      return true;
    });
  }, [improvements, frameworkId, status]);

  const stats = useMemo(() => {
    const revisionRequired = improvements.filter(
      (i) => i.record.status === "revision-required",
    ).length;
    const inProgress = improvements.filter(
      (i) => i.record.status === "in-progress",
    ).length;
    const resubmitted = improvements.filter(
      (i) => i.record.status === "resubmitted",
    ).length;
    const approved = improvements.filter(
      (i) => i.record.status === "approved",
    ).length;
    return { revisionRequired, inProgress, resubmitted, approved };
  }, [improvements]);

  const recurringGaps = useMemo(() => {
    const domainCounts = new Map<string, number>();
    allGaps.forEach(({ record, frameworkName }) => {
      const key = `${frameworkName} · ${record.domain}`;
      domainCounts.set(key, (domainCounts.get(key) ?? 0) + 1);
    });
    return Array.from(domainCounts.entries())
      .filter(([, v]) => v >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [allGaps]);

  const frameworkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    improvements.forEach((i) => {
      counts[i.frameworkId] = (counts[i.frameworkId] ?? 0) + 1;
    });
    return counts;
  }, [improvements]);

  return (
    <OmegaPage
      eyebrow="Omega · Maturity uplift"
      title="Continuous Improvement"
      description="Remediation backlog, recurring weaknesses and the maturity-uplift roadmap across every framework."
      icon={<TrendingUp className="h-5 w-5" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Revision required"
          value={stats.revisionRequired}
          tone={stats.revisionRequired > 0 ? "danger" : "default"}
        />
        <KpiCard
          label="In progress"
          value={stats.inProgress}
          tone={stats.inProgress > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Resubmitted"
          value={stats.resubmitted}
          tone="info"
        />
        <KpiCard
          label="Approved this cycle"
          value={stats.approved}
          tone="success"
        />
      </div>

      <OmegaSection
        title="Recurring deficiencies"
        description="Domains with 2+ gaps — candidates for strategic improvement."
      >
        {recurringGaps.length === 0 ? (
          <OmegaEmptyState
            title="No recurring deficiencies"
            description="Nothing is repeatedly failing. Great work."
            icon={<Lightbulb className="h-5 w-5" />}
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recurringGaps.map(([label, count]) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-sm"
              >
                <Repeat className="mt-0.5 h-4 w-4 flex-none text-amber-600" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {label}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Repeated deficiency
                  </div>
                </div>
                <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </OmegaSection>

      <OmegaSection title="Improvement roadmap">
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
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  status === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {s === "all" ? "All statuses" : s.replace(/-/g, " ")}
              </button>
            ))}
          </div>
        </div>
      </OmegaSection>

      <OmegaSection title={`Improvement items (${filtered.length})`}>
        <GroupByFramework
          items={filtered}
          emptyState={
            <OmegaEmptyState
              title="Nothing in the improvement backlog"
              description="As auditors request revisions, controls appear here to track rework."
              icon={<TrendingUp className="h-5 w-5" />}
            />
          }
          renderGroupBody={(records) => (
            <ul className="divide-y divide-border/60">
              {records.slice(0, 80).map((r) => (
                <li
                  key={r.id}
                  className="flex items-start gap-4 px-4 py-3 hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {r.controlId}
                      </span>
                      <StatusBadge
                        label={r.status}
                        tone={improvementTone(r.status)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {r.domain}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-foreground">
                      {r.title}
                    </p>
                    {r.auditorComment && (
                      <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground">
                        "{r.auditorComment}"
                      </p>
                    )}
                  </div>
                  <Link
                    to={r.href}
                    className="inline-flex items-center gap-1 self-center text-xs font-medium text-primary hover:underline"
                  >
                    Open <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        />
      </OmegaSection>
    </OmegaPage>
  );
}
