import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  ClipboardList,
  Filter,
  FolderOpen,
  MessageSquare,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import {
  OmegaPage,
  OmegaSection,
  OmegaEmptyState,
} from "@/components/omega/OmegaPage";
import { KpiCard } from "@/components/omega/KpiCard";
import { FrameworkFilter } from "@/components/omega/FrameworkFilter";
import { FrameworkPill } from "@/components/omega/FrameworkPill";
import {
  useAggregatedActivity,
  useFrameworkSummaries,
  useOmegaTotals,
} from "@/frameworks/useFrameworkSummaries";
import type { FrameworkActivityEntry } from "@/frameworks/types";

type KindFilter = "all" | FrameworkActivityEntry["kind"];

const KIND_OPTIONS: KindFilter[] = [
  "all",
  "assessment",
  "gap",
  "risk",
  "evidence",
  "review",
  "improvement",
];

const iconFor: Record<FrameworkActivityEntry["kind"], typeof Activity> = {
  assessment: ClipboardList,
  gap: AlertTriangle,
  risk: ShieldAlert,
  evidence: FolderOpen,
  review: MessageSquare,
  improvement: TrendingUp,
  other: Activity,
};

function formatRelative(iso: string) {
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

export default function OmegaNotifications() {
  const activity = useAggregatedActivity(200);
  const totals = useOmegaTotals();
  const entries = useFrameworkSummaries();
  const [frameworkId, setFrameworkId] = useState("all");
  const [kind, setKind] = useState<KindFilter>("all");

  const filtered = useMemo(() => {
    return activity.filter((a) => {
      if (frameworkId !== "all" && a.frameworkId !== frameworkId) return false;
      if (kind !== "all" && a.kind !== kind) return false;
      return true;
    });
  }, [activity, frameworkId, kind]);

  const alerts = useMemo(() => {
    const list: Array<{
      id: string;
      icon: typeof Bell;
      title: string;
      detail: string;
      tone: "danger" | "warning" | "info";
      href: string;
    }> = [];
    if (totals.criticalRisks > 0) {
      list.push({
        id: "critical-risks",
        icon: ShieldAlert,
        title: `${totals.criticalRisks} critical residual risk${totals.criticalRisks === 1 ? "" : "s"}`,
        detail: "High/critical residual risks across your frameworks.",
        tone: "danger",
        href: "/risk",
      });
    }
    if (totals.overdueRemediations > 0) {
      list.push({
        id: "overdue",
        icon: AlertTriangle,
        title: `${totals.overdueRemediations} overdue remediation${totals.overdueRemediations === 1 ? "" : "s"}`,
        detail: "Past expected completion date.",
        tone: "danger",
        href: "/gap-analysis",
      });
    }
    if (totals.pendingReviews > 0) {
      list.push({
        id: "pending-review",
        icon: MessageSquare,
        title: `${totals.pendingReviews} control${totals.pendingReviews === 1 ? "" : "s"} pending review`,
        detail: "Awaiting auditor action.",
        tone: "warning",
        href: "/review",
      });
    }
    if (totals.openGaps > 0) {
      list.push({
        id: "open-gaps",
        icon: AlertTriangle,
        title: `${totals.openGaps} open gap${totals.openGaps === 1 ? "" : "s"}`,
        detail: "Not yet triaged or remediated.",
        tone: "warning",
        href: "/gap-analysis",
      });
    }
    return list;
  }, [totals]);

  const frameworkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activity.forEach((a) => {
      counts[a.frameworkId] = (counts[a.frameworkId] ?? 0) + 1;
    });
    return counts;
  }, [activity]);

  return (
    <OmegaPage
      eyebrow="Omega · Notifications"
      title="Notifications"
      description="Alerts, activity and change events from every connected framework — all in one place."
      icon={<Bell className="h-5 w-5" />}
    >
      {/* Alerts */}
      <OmegaSection title="Active alerts">
        {alerts.length === 0 ? (
          <OmegaEmptyState
            title="No active alerts"
            description="Everything looks good across your frameworks."
            icon={<Bell className="h-5 w-5" />}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {alerts.map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.id}
                  to={a.href}
                  className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-md ${
                      a.tone === "danger"
                        ? "bg-rose-500/10 text-rose-600"
                        : a.tone === "warning"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-sky-500/10 text-sky-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-foreground">
                        {a.title}
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.detail}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </OmegaSection>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total events" value={activity.length} tone="primary" icon={Activity} />
        <KpiCard
          label="Reviews pending"
          value={totals.pendingReviews}
          tone={totals.pendingReviews > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Critical risks"
          value={totals.criticalRisks}
          tone={totals.criticalRisks > 0 ? "danger" : "success"}
        />
        <KpiCard
          label="Overdue"
          value={totals.overdueRemediations}
          tone={totals.overdueRemediations > 0 ? "danger" : "default"}
        />
      </div>

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
            {KIND_OPTIONS.map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  kind === k
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {k === "all" ? "All" : k}
              </button>
            ))}
          </div>
        </div>
      </OmegaSection>

      <OmegaSection title={`Activity feed (${filtered.length})`}>
        {filtered.length === 0 ? (
          <OmegaEmptyState
            title="No activity matches your filters"
            icon={<Activity className="h-5 w-5" />}
          />
        ) : (
          <ul className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card shadow-sm">
            {filtered.slice(0, 100).map((item) => {
              const Icon = iconFor[item.kind] ?? Activity;
              return (
                <li
                  key={`${item.frameworkId}-${item.id}`}
                  className="px-4 py-3 hover:bg-muted/30"
                >
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
                    <div className="flex items-center gap-2">
                      <span className="flex-none text-xs text-muted-foreground">
                        {formatRelative(item.timestamp)}
                      </span>
                      {item.href && (
                        <Link
                          to={item.href}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          Open <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </OmegaSection>
    </OmegaPage>
  );
}
