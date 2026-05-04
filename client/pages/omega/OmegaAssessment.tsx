import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Calendar,
  User,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import {
  OmegaPage,
  OmegaSection,
  OmegaEmptyState,
} from "@/components/omega/OmegaPage";
import { KpiCard } from "@/components/omega/KpiCard";
import { FrameworkFilter } from "@/components/omega/FrameworkFilter";
import {
  GroupByFramework,
  type WithFramework,
} from "@/components/omega/GroupByFramework";
import {
  StatusBadge,
  assessmentTone,
} from "@/components/omega/StatusBadge";
import { ProgressBar } from "@/components/omega/ProgressBar";
import {
  useAllAssessments,
  useFrameworkSummaries,
  useOmegaTotals,
} from "@/frameworks/useFrameworkSummaries";
import type { FrameworkAssessmentRecord } from "@/frameworks/types";

type StatusFilter = "all" | FrameworkAssessmentRecord["status"];

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "All statuses",
  "not-started": "Not started",
  "in-progress": "In progress",
  answered: "Answered",
  approved: "Approved",
};

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString() : "—";
}

export default function OmegaAssessment() {
  const totals = useOmegaTotals();
  const entries = useFrameworkSummaries();
  const assessments = useAllAssessments();
  const [frameworkId, setFrameworkId] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    return assessments.filter((a) => {
      if (frameworkId !== "all" && a.frameworkId !== frameworkId) return false;
      if (status !== "all" && a.record.status !== status) return false;
      return true;
    });
  }, [assessments, frameworkId, status]);

  const frameworkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    assessments.forEach((a) => {
      counts[a.frameworkId] = (counts[a.frameworkId] ?? 0) + 1;
    });
    return counts;
  }, [assessments]);

  return (
    <OmegaPage
      eyebrow="Omega · Cross-framework"
      title="Assessment"
      description="Every control assessment across every connected framework — grouped, filterable and ranked by progress."
      icon={<ClipboardList className="h-5 w-5" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Controls assessed"
          value={`${totals.assessedControls}/${totals.totalControls}`}
          hint="Across all frameworks"
          tone="info"
          footer={<ProgressBar value={totals.averageProgress ?? 0} tone="info" />}
        />
        <KpiCard
          label="Avg. progress"
          value={
            totals.averageProgress === null ? "—" : `${totals.averageProgress}%`
          }
          hint={`Across ${entries.filter((e) => e.summary).length} active framework(s)`}
          tone="primary"
        />
        <KpiCard
          label="Avg. maturity"
          value={totals.averageMaturity?.toFixed(1) ?? "—"}
          hint="Scored controls (1–5)"
          tone="success"
        />
        <KpiCard
          label="Pending reviews"
          value={totals.pendingReviews}
          hint="Awaiting auditor action"
          tone={totals.pendingReviews > 0 ? "warning" : "default"}
        />
      </div>

      <OmegaSection
        title="Filter"
        description="Narrow down by framework and assessment status."
      >
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
            {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  status === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </OmegaSection>

      <OmegaSection
        title={`Assessments (${filtered.length})`}
        description="Grouped by framework. Click any row to open the control in its framework workspace."
      >
        <GroupByFramework
          items={filtered as WithFramework<FrameworkAssessmentRecord>[]}
          emptyState={
            <OmegaEmptyState
              title="No assessments match your filters"
              description="Try clearing a filter or starting an assessment inside a framework."
              icon={<ClipboardList className="h-5 w-5" />}
            />
          }
          groupMeta={(records) => {
            const assessed = records.filter(
              (r) => r.status !== "not-started",
            ).length;
            const pct =
              records.length === 0
                ? 0
                : Math.round((assessed / records.length) * 100);
            return `${assessed}/${records.length} assessed · ${pct}%`;
          }}
          renderGroupBody={(records) => (
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Control</th>
                  <th className="px-4 py-2 text-left font-semibold">Domain</th>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                  <th className="px-4 py-2 text-left font-semibold">Maturity</th>
                  <th className="px-4 py-2 text-left font-semibold">Owner</th>
                  <th className="px-4 py-2 text-left font-semibold">Due</th>
                  <th className="px-4 py-2 text-right font-semibold">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {records.slice(0, 50).map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground">
                      <div className="font-semibold">{r.controlId}</div>
                      <div className="truncate font-sans text-[11px] text-muted-foreground">
                        {r.title}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {r.domain}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge
                        label={r.status}
                        tone={assessmentTone(r.status)}
                      />
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">
                      {r.maturityScore ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {r.owner ? (
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {r.owner}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {fmtDate(r.dueDate)}
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
                {records.length > 50 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-3 text-center text-xs text-muted-foreground"
                    >
                      Showing first 50 of {records.length}. Refine filters to
                      narrow further.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        />
      </OmegaSection>
    </OmegaPage>
  );
}
