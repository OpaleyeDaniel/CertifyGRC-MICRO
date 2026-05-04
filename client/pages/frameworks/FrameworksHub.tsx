import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Clock,
  FolderTree,
  ShieldQuestion,
} from "lucide-react";
import { useMemo } from "react";
import { useFrameworkSummaries } from "@/frameworks/useFrameworkSummaries";
import type {
  FrameworkModule,
  FrameworkSummary,
} from "@/frameworks/types";
import { cn } from "@/lib/utils";
import { OmegaPage, OmegaSection } from "@/components/omega/OmegaPage";

/**
 * Frameworks Hub — the root platform's view of every compliance
 * framework that has been registered. Replaces the previous
 * placeholder "FrameworkDashboard" page.
 *
 * Cards render real metrics for active frameworks via their summary
 * hook, and a proper "coming soon" empty state for others. No demo
 * data is shown.
 */
export default function FrameworksHub() {
  const entries = useFrameworkSummaries();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const activeEntries = useMemo(
    () => entries.filter((e) => e.framework.status === "active"),
    [entries],
  );
  const upcomingEntries = useMemo(
    () => entries.filter((e) => e.framework.status !== "active"),
    [entries],
  );

  return (
    <OmegaPage
      eyebrow="Omega · GRC Operating System"
      title="Framework services"
      description="Each framework runs as its own module—dashboard, assessments, and evidence are scoped. Active frameworks power the command center and global views."
      icon={<FolderTree className="h-5 w-5" />}
    >
      <OmegaSection
        title="Active"
        description="Live services with data flowing into the platform."
        actions={
          <span className="text-xs text-muted-foreground">
            {activeEntries.length} connected
          </span>
        }
      >
        {activeEntries.length === 0 ? (
          <EmptyConnected />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {activeEntries.map((entry) => (
              <ActiveFrameworkCard
                key={entry.framework.id}
                framework={entry.framework}
                summary={entry.summary}
                highlighted={highlightId === entry.framework.id}
              />
            ))}
          </div>
        )}
      </OmegaSection>

      {upcomingEntries.length > 0 && (
        <OmegaSection
          title="Coming soon"
          description="Registered modules that are not yet enabled."
          actions={
            <span className="text-xs text-muted-foreground">
              {upcomingEntries.length} pending
            </span>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingEntries.map((entry) => (
              <ComingSoonCard
                key={entry.framework.id}
                framework={entry.framework}
                highlighted={highlightId === entry.framework.id}
              />
            ))}
          </div>
        </OmegaSection>
      )}

      <section className="rounded-xl border border-border/60 bg-card/80 p-5 text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <FolderTree className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <div className="font-medium text-foreground">Add a new framework</div>
            <p className="mt-1 leading-relaxed">
              Drop the implementation into{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">frameworks/&lt;NAME&gt;</code>, add{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">client/frameworks/&lt;id&gt;/module.ts</code>, then
              register in <code className="rounded bg-muted px-1 py-0.5 text-xs">client/frameworks/registry.ts</code>. The
              shell picks up routes and sidebars automatically.
            </p>
          </div>
        </div>
      </section>
    </OmegaPage>
  );
}

function ActiveFrameworkCard({
  framework,
  summary,
  highlighted,
}: {
  framework: FrameworkModule;
  summary: FrameworkSummary | null;
  highlighted: boolean;
}) {
  const Icon = framework.icon;
  const progress = summary?.assessmentProgress ?? null;
  const readiness = summary?.readinessScore ?? null;

  return (
    <Link
      to={framework.basePath}
      className={cn(
        "group rounded-xl border bg-card p-6 transition hover:border-primary/50 hover:shadow-sm",
        highlighted ? "border-primary shadow-sm" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-2.5 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{framework.name}</h3>
              {framework.version && (
                <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                  v{framework.version}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {framework.tagline}
            </p>
          </div>
        </div>
        <div className="rounded-full border border-primary/20 bg-primary/10 p-1.5 text-primary">
          <Check className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground line-clamp-3">
        {framework.description}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricChip
          label="Progress"
          value={progress === null ? "—" : `${progress}%`}
        />
        <MetricChip
          label="Controls"
          value={
            summary
              ? `${summary.assessedControls}/${summary.totalControls}`
              : "—"
          }
        />
        <MetricChip
          label="Open gaps"
          value={summary?.openGaps ?? 0}
          tone={summary && summary.openGaps > 0 ? "warning" : "default"}
        />
        <MetricChip
          label="Readiness"
          value={readiness === null ? "—" : `${readiness}%`}
        />
      </div>

      <div className="mt-5 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {summary?.lastActivityAt
            ? `Updated ${timeAgo(summary.lastActivityAt)}`
            : "No activity yet"}
        </span>
        <span className="inline-flex items-center gap-1 text-primary group-hover:translate-x-0.5 transition-transform">
          Open workspace <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function ComingSoonCard({
  framework,
  highlighted,
}: {
  framework: FrameworkModule;
  highlighted: boolean;
}) {
  const Icon = framework.icon;
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5",
        highlighted ? "border-primary" : "border-dashed border-border",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg border border-border bg-muted p-2.5 text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">{framework.name}</h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
              <Clock className="h-3 w-3" /> Soon
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {framework.tagline}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Placeholder folder: <code>{framework.filesystemPath}</code>
      </p>
    </div>
  );
}

function EmptyConnected() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
      <ShieldQuestion className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
      <p className="font-medium text-foreground">
        No active frameworks connected
      </p>
      <p className="mt-1">
        Register an active framework module to start collecting live
        compliance data.
      </p>
    </div>
  );
}

function MetricChip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-2.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-lg font-semibold",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function timeAgo(iso: string) {
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return "recently";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
