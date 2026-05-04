import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileStack,
  FolderOpen,
  Gauge,
  GitCompareArrows,
  Layers,
  LibraryBig,
  MessageSquare,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  useAggregatedActivity,
  useAllBlockers,
  useAllGaps,
  useAllImprovements,
  useAllRisks,
  useFrameworkSummaries,
  useOmegaTotals,
} from "@/frameworks/useFrameworkSummaries";
import type {
  FrameworkActivityEntry,
  FrameworkModule,
  FrameworkSummary,
} from "@/frameworks/types";
import { KpiCard } from "@/components/omega/KpiCard";
import { OmegaPage, OmegaSection, OmegaEmptyState } from "@/components/omega/OmegaPage";
import { FrameworkPill } from "@/components/omega/FrameworkPill";
import { ProgressBar } from "@/components/omega/ProgressBar";
import { StatusBadge, severityTone } from "@/components/omega/StatusBadge";
import { FrameworkComparisonChart } from "@/components/omega/FrameworkComparisonChart";

function pct(value: number | null | undefined): string {
  return typeof value === "number" ? `${value}%` : "—";
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "No activity yet";
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return "—";
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const month = Math.floor(day / 30);
  return `${month}mo ago`;
}

const activityIcon: Record<FrameworkActivityEntry["kind"], typeof Activity> = {
  assessment: ClipboardList,
  gap: AlertTriangle,
  risk: ShieldAlert,
  evidence: FolderOpen,
  review: MessageSquare,
  improvement: TrendingUp,
  other: Activity,
};

export default function OmegaDashboard() {
  const totals = useOmegaTotals();
  const entries = useFrameworkSummaries();
  const activity = useAggregatedActivity(25);
  const blockers = useAllBlockers();
  const allGaps = useAllGaps();
  const allRisks = useAllRisks();
  const improvements = useAllImprovements();

  const hasAnyActivity = totals.frameworksWithActivity > 0;

  /* ---------------- Cross-framework analytics ---------------- */
  const analyticsByFramework = useMemo(() => {
    return entries
      .filter((e) => e.summary)
      .map(({ framework, summary }) => ({
        framework,
        summary: summary as FrameworkSummary,
      }));
  }, [entries]);

  const riskDistribution = useMemo(() => {
    const buckets = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    allRisks.forEach(({ record }) => {
      buckets[record.residualLevel] += 1;
    });
    return buckets;
  }, [allRisks]);

  const gapSeverity = useMemo(() => {
    const buckets = { critical: 0, high: 0, medium: 0, low: 0 };
    allGaps.forEach(({ record }) => {
      if (record.status !== "treated") buckets[record.severity] += 1;
    });
    return buckets;
  }, [allGaps]);

  /* ---------------- Bottlenecks ---------------- */
  const bottlenecks = useMemo(() => {
    return [
      {
        id: "awaiting-evidence",
        label: "Assessed controls missing evidence",
        value: analyticsByFramework.reduce(
          (sum, e) => sum + e.summary.auditReadiness.missingEvidence,
          0,
        ),
        href: "/evidence",
        icon: FolderOpen,
      },
      {
        id: "awaiting-review",
        label: "Awaiting auditor review",
        value: totals.pendingReviews,
        href: "/review",
        icon: MessageSquare,
      },
      {
        id: "awaiting-remediation",
        label: "Gaps awaiting remediation",
        value: totals.pendingRemediations,
        href: "/gap-analysis",
        icon: AlertTriangle,
      },
      {
        id: "high-risk",
        label: "High / critical residual risks",
        value: totals.criticalRisks,
        href: "/risk",
        icon: ShieldAlert,
      },
      {
        id: "overdue",
        label: "Overdue remediation actions",
        value: totals.overdueRemediations,
        href: "/gap-analysis?status=overdue",
        icon: AlertTriangle,
      },
      {
        id: "inactive-frameworks",
        label: "Inactive / unstarted frameworks",
        value: totals.activeFrameworks - totals.frameworksWithActivity,
        href: "/frameworks",
        icon: Layers,
      },
    ].filter((b) => b.value > 0);
  }, [analyticsByFramework, totals]);

  /* ---------------- Continuous improvement insights ---------------- */
  const ciInsights = useMemo(() => {
    const domainCounts = new Map<string, number>();
    improvements.forEach(({ record, frameworkName }) => {
      const key = `${frameworkName} · ${record.domain}`;
      domainCounts.set(key, (domainCounts.get(key) ?? 0) + 1);
    });
    return Array.from(domainCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [improvements]);

  return (
    <OmegaPage
      eyebrow="Omega · GRC Operating System"
      title="Compliance command center"
      description="Unified view across every connected framework — assessments, gaps, risks, evidence, reviews and audit readiness."
      icon={<Sparkles className="h-5 w-5" />}
      actions={
        <Link
          to="/frameworks"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          <Layers className="h-4 w-4" />
          Manage frameworks
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      }
    >
      {/* ---------- 1. Executive summary cards ---------- */}
      <OmegaSection
        title="Executive summary"
        description="Headline metrics rolled up across every active framework."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <KpiCard
            label="Active frameworks"
            value={`${totals.frameworksWithActivity}/${totals.activeFrameworks || totals.totalFrameworks}`}
            hint={`${totals.totalFrameworks} total registered`}
            icon={Layers}
            tone="primary"
          />
          <KpiCard
            label="Compliance progress"
            value={pct(totals.averageProgress)}
            hint={`${totals.assessedControls}/${totals.totalControls} controls assessed`}
            icon={Gauge}
            tone="info"
            footer={
              <ProgressBar value={totals.averageProgress ?? 0} tone="info" />
            }
          />
          <KpiCard
            label="Audit readiness"
            value={pct(totals.averageReadiness)}
            hint={`Avg. across ${totals.frameworksWithActivity} framework${totals.frameworksWithActivity === 1 ? "" : "s"}`}
            icon={CheckCircle2}
            tone={
              (totals.averageReadiness ?? 0) >= 70
                ? "success"
                : (totals.averageReadiness ?? 0) >= 40
                  ? "warning"
                  : "danger"
            }
            footer={
              <ProgressBar
                value={totals.averageReadiness ?? 0}
                tone={
                  (totals.averageReadiness ?? 0) >= 70
                    ? "success"
                    : (totals.averageReadiness ?? 0) >= 40
                      ? "warning"
                      : "danger"
                }
              />
            }
          />
          <KpiCard
            label="Open gaps"
            value={totals.openGaps}
            hint={`${totals.pendingRemediations} remediation${totals.pendingRemediations === 1 ? "" : "s"} pending`}
            icon={AlertTriangle}
            tone={totals.openGaps > 0 ? "warning" : "default"}
          />
          <KpiCard
            label="Critical risks"
            value={totals.criticalRisks}
            hint={`${totals.riskCount} total risks tracked`}
            icon={ShieldAlert}
            tone={totals.criticalRisks > 0 ? "danger" : "success"}
          />
          <KpiCard
            label="Pending reviews"
            value={totals.pendingReviews}
            hint="Controls awaiting auditor"
            icon={MessageSquare}
            tone={totals.pendingReviews > 0 ? "warning" : "default"}
          />
          <KpiCard
            label="Evidence coverage"
            value={pct(totals.averageEvidenceCoverage)}
            hint={`${totals.evidenceCount} artefacts catalogued`}
            icon={FolderOpen}
            tone="info"
          />
          <KpiCard
            label="Overdue remediations"
            value={totals.overdueRemediations}
            hint="Past expected date"
            icon={Activity}
            tone={totals.overdueRemediations > 0 ? "danger" : "default"}
          />
          <KpiCard
            label="Avg. maturity"
            value={totals.averageMaturity?.toFixed(1) ?? "—"}
            hint="Across scored controls (1–5)"
            icon={TrendingUp}
            tone="primary"
          />
          <KpiCard
            label="Controls assessed"
            value={`${totals.assessedControls}/${totals.totalControls}`}
            hint="Across all frameworks"
            icon={ClipboardList}
          />
        </div>
      </OmegaSection>

      {/* ---------- 2. Framework performance overview ---------- */}
      <OmegaSection
        title="Framework performance"
        description="Status, progress and pulse for each connected framework."
      >
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <FrameworkPerformanceCard
              key={entry.framework.id}
              framework={entry.framework}
              summary={entry.summary}
            />
          ))}
        </div>
      </OmegaSection>

      {analyticsByFramework.length > 0 && (
        <OmegaSection
          title="Framework scorecard"
          description="Side-by-side assessment progress and audit readiness — same data as the table below, in one chart."
        >
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <FrameworkComparisonChart rows={analyticsByFramework} />
          </div>
        </OmegaSection>
      )}

      {/* ---------- 3. Cross-framework analytics ---------- */}
      <OmegaSection
        title="Cross-framework analytics"
        description="Compare posture across the connected frameworks."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <AnalyticsBarCard
            title="Assessment completion"
            icon={Gauge}
            rows={analyticsByFramework.map(({ framework, summary }) => ({
              framework,
              value: summary.assessmentProgress ?? 0,
              sub: `${summary.assessedControls}/${summary.totalControls} controls`,
              tone: "info" as const,
            }))}
          />
          <AnalyticsBarCard
            title="Audit readiness"
            icon={CheckCircle2}
            rows={analyticsByFramework.map(({ framework, summary }) => ({
              framework,
              value: summary.readinessScore ?? 0,
              sub: `${summary.auditReadiness.controlsApproved}/${summary.auditReadiness.controlsTotal} approved`,
              tone:
                (summary.readinessScore ?? 0) >= 70
                  ? ("success" as const)
                  : (summary.readinessScore ?? 0) >= 40
                    ? ("warning" as const)
                    : ("danger" as const),
            }))}
          />
          <AnalyticsBarCard
            title="Evidence coverage"
            icon={FolderOpen}
            rows={analyticsByFramework.map(({ framework, summary }) => ({
              framework,
              value: summary.evidenceCoverage ?? 0,
              sub: `${summary.evidenceCount} artefacts`,
              tone: "info" as const,
            }))}
          />
          <DistributionCard
            title="Residual risk distribution"
            icon={Shield}
            buckets={[
              { label: "Critical", value: riskDistribution.CRITICAL, tone: "danger" },
              { label: "High", value: riskDistribution.HIGH, tone: "warning" },
              { label: "Medium", value: riskDistribution.MEDIUM, tone: "info" },
              { label: "Low", value: riskDistribution.LOW, tone: "success" },
            ]}
            link="/risk"
          />
          <DistributionCard
            title="Gap severity"
            icon={AlertTriangle}
            buckets={[
              { label: "Critical", value: gapSeverity.critical, tone: "danger" },
              { label: "High", value: gapSeverity.high, tone: "warning" },
              { label: "Medium", value: gapSeverity.medium, tone: "info" },
              { label: "Low", value: gapSeverity.low, tone: "success" },
            ]}
            link="/gap-analysis"
          />
          <AnalyticsBarCard
            title="Avg. maturity (1–5)"
            icon={TrendingUp}
            rows={analyticsByFramework.map(({ framework, summary }) => ({
              framework,
              value: Math.round((summary.averageMaturity / 5) * 100),
              sub: summary.averageMaturity
                ? summary.averageMaturity.toFixed(2)
                : "—",
              tone: "info" as const,
            }))}
          />
        </div>
      </OmegaSection>

      {/* ---------- 4 & 5. Activity + bottlenecks ---------- */}
      <div className="grid gap-4 lg:grid-cols-3">
        <OmegaSection
          className="lg:col-span-2"
          title="Global activity center"
          description="Latest actions from every framework, most recent first."
          actions={
            <Link
              to="/notifications"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all →
            </Link>
          }
        >
          <div className="rounded-xl border border-border/60 bg-card shadow-sm">
            {activity.length === 0 ? (
              <OmegaEmptyState
                title="No activity yet"
                description="As soon as assessments, gaps, risks or reviews move in a framework, they'll appear here."
                icon={<Activity className="h-5 w-5" />}
              />
            ) : (
              <ul className="divide-y divide-border/60">
                {activity.slice(0, 10).map((item) => {
                  const Icon = activityIcon[item.kind] ?? Activity;
                  return (
                    <li key={`${item.frameworkId}-${item.id}`} className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <Icon className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <FrameworkPill
                              framework={{
                                id: item.frameworkId,
                                name: item.frameworkName,
                                shortCode: item.frameworkShort,
                                basePath: "",
                              }}
                              compact
                            />
                            <span className="truncate text-sm font-medium text-foreground">
                              {item.title}
                            </span>
                          </div>
                          {item.detail && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {item.detail}
                            </p>
                          )}
                        </div>
                        <span className="flex-none text-xs text-muted-foreground">
                          {formatRelative(item.timestamp)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </OmegaSection>

        <OmegaSection
          title="Workflow bottlenecks"
          description="Items blocking forward motion."
        >
          <div className="rounded-xl border border-border/60 bg-card shadow-sm">
            {bottlenecks.length === 0 ? (
              <OmegaEmptyState
                title="No bottlenecks"
                description="Nothing blocking progress across your frameworks."
                icon={<CheckCircle2 className="h-5 w-5" />}
              />
            ) : (
              <ul className="divide-y divide-border/60">
                {bottlenecks.map((b) => {
                  const Icon = b.icon;
                  return (
                    <li key={b.id}>
                      <Link
                        to={b.href}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-sm text-foreground">
                          {b.label}
                        </span>
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                          {b.value}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </OmegaSection>
      </div>

      {/* ---------- 6. Audit readiness panel ---------- */}
      <OmegaSection
        title="Audit readiness panel"
        description="Framework readiness at a glance. Click into a row for full detail."
        actions={
          <Link
            to="/audit-readiness"
            className="text-xs font-medium text-primary hover:underline"
          >
            Full readiness view →
          </Link>
        }
      >
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Framework</th>
                <th className="px-4 py-2 text-left font-semibold">Readiness</th>
                <th className="px-4 py-2 text-left font-semibold">Approved</th>
                <th className="px-4 py-2 text-left font-semibold">Missing evidence</th>
                <th className="px-4 py-2 text-left font-semibold">Pending reviews</th>
                <th className="px-4 py-2 text-left font-semibold">Top blocker</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {analyticsByFramework.map(({ framework, summary }) => {
                const top = summary.auditReadiness.blockers[0];
                return (
                  <tr key={framework.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        to={framework.basePath}
                        className="flex items-center gap-2 font-medium text-foreground hover:underline"
                      >
                        <framework.icon className="h-4 w-4" />
                        {framework.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar
                          value={summary.readinessScore ?? 0}
                          tone={
                            (summary.readinessScore ?? 0) >= 70
                              ? "success"
                              : (summary.readinessScore ?? 0) >= 40
                                ? "warning"
                                : "danger"
                          }
                          className="w-28"
                        />
                        <span className="text-xs font-semibold tabular-nums text-foreground">
                          {pct(summary.readinessScore)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {summary.auditReadiness.controlsApproved}/
                      {summary.auditReadiness.controlsTotal}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {summary.auditReadiness.missingEvidence}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {summary.auditReadiness.pendingApprovals}
                    </td>
                    <td className="px-4 py-3">
                      {top ? (
                        <span className="inline-flex items-center gap-2">
                          <StatusBadge
                            label={top.label}
                            tone={severityTone(top.severity)}
                          />
                          <span className="text-xs text-muted-foreground">
                            ({top.count})
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          None
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </OmegaSection>

      {/* ---------- 7. Continuous improvement insights ---------- */}
      <OmegaSection
        title="Continuous improvement insights"
        description="Recurring weaknesses and areas needing maturity uplift."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Top recurring domains
              </h3>
              <Link
                to="/improvement"
                className="text-xs text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            {ciInsights.length === 0 ? (
              <OmegaEmptyState
                title="No recurring issues detected"
                description="As controls go through revision cycles, recurring weaknesses will appear here."
                icon={<TrendingUp className="h-5 w-5" />}
              />
            ) : (
              <ul className="space-y-2">
                {ciInsights.map(([label, count]) => (
                  <li
                    key={label}
                    className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2"
                  >
                    <span className="truncate text-sm text-foreground">
                      {label}
                    </span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Top audit-readiness blockers
              </h3>
              <Link
                to="/audit-readiness"
                className="text-xs text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            {blockers.length === 0 ? (
              <OmegaEmptyState
                title="Nothing blocking"
                description="No active blockers across your frameworks."
                icon={<CheckCircle2 className="h-5 w-5" />}
              />
            ) : (
              <ul className="space-y-2">
                {blockers
                  .slice()
                  .sort((a, b) => b.record.count - a.record.count)
                  .slice(0, 6)
                  .map((b) => (
                    <li
                      key={`${b.frameworkId}-${b.record.id}`}
                      className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <FrameworkPill framework={b.framework} compact />
                        <span className="truncate text-sm text-foreground">
                          {b.record.label}
                        </span>
                      </div>
                      <StatusBadge
                        label={`${b.record.count}`}
                        tone={severityTone(b.record.severity)}
                      />
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </OmegaSection>

      {/* ---------- Bottom links ---------- */}
      <OmegaSection>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink
            icon={GitCompareArrows}
            title="Cross mapping"
            description="See overlap between frameworks and reuse work."
            href="/cross-mapping"
          />
          <QuickLink
            icon={BarChart3}
            title="Reports"
            description="Executive compliance posture reports."
            href="/report"
          />
          <QuickLink
            icon={LibraryBig}
            title="Evidence library"
            description="Unified evidence across every framework."
            href="/evidence"
          />
          <QuickLink
            icon={FileStack}
            title="Assessment queue"
            description="All controls awaiting assessment."
            href="/assessment"
          />
        </div>
      </OmegaSection>

      {!hasAnyActivity && <GettingStartedBanner />}
    </OmegaPage>
  );
}

/* ---------------- Sub-components ---------------- */

function FrameworkPerformanceCard({
  framework,
  summary,
}: {
  framework: FrameworkModule;
  summary: FrameworkSummary | null;
}) {
  const Icon = framework.icon;
  const isActive = framework.status === "active";
  const progress = summary?.assessmentProgress ?? 0;
  const readiness = summary?.readinessScore ?? null;

  return (
    <Link
      to={isActive ? framework.basePath : "/frameworks"}
      className="group flex h-full flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              {framework.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {framework.tagline}
            </div>
          </div>
        </div>
        <StatusBadge
          label={isActive ? "Active" : "Coming soon"}
          tone={isActive ? "success" : "neutral"}
        />
      </div>

      {summary ? (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Assessment progress</span>
              <span className="font-semibold tabular-nums text-foreground">
                {pct(summary.assessmentProgress)}
              </span>
            </div>
            <ProgressBar value={progress} tone="info" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Audit readiness</span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  (readiness ?? 0) >= 70
                    ? "text-emerald-600"
                    : (readiness ?? 0) >= 40
                      ? "text-amber-600"
                      : "text-rose-600",
                )}
              >
                {pct(readiness)}
              </span>
            </div>
            <ProgressBar
              value={readiness ?? 0}
              tone={
                (readiness ?? 0) >= 70
                  ? "success"
                  : (readiness ?? 0) >= 40
                    ? "warning"
                    : "danger"
              }
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
            <StatChip label="Gaps" value={summary.openGaps} tone="warning" />
            <StatChip
              label="Critical risks"
              value={summary.criticalRisks}
              tone="danger"
            />
            <StatChip
              label="Evidence"
              value={summary.evidenceCount}
              tone="info"
            />
          </div>
          <div className="mt-auto flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Last activity {formatRelative(summary.lastActivityAt)}</span>
            <span className="inline-flex items-center gap-1 text-primary group-hover:underline">
              Open workspace <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-start justify-between gap-2 text-sm">
          <p className="text-muted-foreground">
            {framework.status === "coming-soon"
              ? "Preview available soon. Controls, gaps and evidence will be aggregated once connected."
              : "Framework disabled."}
          </p>
          <span className="inline-flex items-center gap-1 text-xs text-primary group-hover:underline">
            View details <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      )}
    </Link>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "warning" | "danger" | "info";
}) {
  const toneClass =
    tone === "danger"
      ? "border-rose-500/30 text-rose-600"
      : tone === "warning"
        ? "border-amber-500/30 text-amber-600"
        : "border-sky-500/30 text-sky-600";
  return (
    <div
      className={cn(
        "rounded-md border bg-background/40 px-2 py-1.5",
        toneClass,
      )}
    >
      <div className="text-base font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function AnalyticsBarCard({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: typeof Activity;
  rows: Array<{
    framework: FrameworkModule;
    value: number;
    sub: string;
    tone: "info" | "success" | "warning" | "danger";
  }>;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.framework.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <FrameworkPill framework={row.framework} compact />
                <span className="truncate text-foreground">
                  {row.framework.name}
                </span>
              </div>
              <span className="tabular-nums text-muted-foreground">
                {row.sub}
              </span>
            </div>
            <ProgressBar value={row.value} tone={row.tone} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DistributionCard({
  title,
  icon: Icon,
  buckets,
  link,
}: {
  title: string;
  icon: typeof Activity;
  buckets: Array<{
    label: string;
    value: number;
    tone: "info" | "success" | "warning" | "danger";
  }>;
  link?: string;
}) {
  const total = buckets.reduce((s, b) => s + b.value, 0);
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {link && (
          <Link to={link} className="text-xs text-primary hover:underline">
            View →
          </Link>
        )}
      </div>
      {total === 0 ? (
        <p className="text-xs text-muted-foreground">No data yet.</p>
      ) : (
        <>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
            {buckets.map((b) => {
              if (b.value === 0) return null;
              const pct = (b.value / total) * 100;
              const toneClass = {
                danger: "bg-rose-500",
                warning: "bg-amber-500",
                info: "bg-sky-500",
                success: "bg-emerald-500",
              }[b.tone];
              return (
                <div
                  key={b.label}
                  className={toneClass}
                  style={{ width: `${pct}%` }}
                  title={`${b.label}: ${b.value}`}
                />
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {buckets.map((b) => (
              <div
                key={b.label}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      b.tone === "danger" && "bg-rose-500",
                      b.tone === "warning" && "bg-amber-500",
                      b.tone === "info" && "bg-sky-500",
                      b.tone === "success" && "bg-emerald-500",
                    )}
                  />
                  {b.label}
                </span>
                <span className="font-semibold tabular-nums text-foreground">
                  {b.value}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function QuickLink({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: typeof Activity;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
    >
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

function GettingStartedBanner() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Bring Omega to life
          </h3>
          <p className="mt-1 max-w-xl">
            Start an assessment in any connected framework — the dashboard
            will instantly light up with live metrics, activity, risks and
            audit-readiness signal.
          </p>
        </div>
        <Link
          to="/frameworks"
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to frameworks <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
