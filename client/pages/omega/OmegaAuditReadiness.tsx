import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  FolderOpen,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import {
  OmegaPage,
  OmegaSection,
  OmegaEmptyState,
} from "@/components/omega/OmegaPage";
import { KpiCard } from "@/components/omega/KpiCard";
import { ProgressBar } from "@/components/omega/ProgressBar";
import { FrameworkPill } from "@/components/omega/FrameworkPill";
import {
  StatusBadge,
  severityTone,
} from "@/components/omega/StatusBadge";
import {
  useFrameworkSummaries,
  useOmegaTotals,
} from "@/frameworks/useFrameworkSummaries";
import type { FrameworkAuditReadiness } from "@/frameworks/types";
import { cn } from "@/lib/utils";

const READINESS_TONES: Record<
  FrameworkAuditReadiness["label"],
  "success" | "warning" | "danger" | "neutral"
> = {
  "Audit-ready": "success",
  Close: "success",
  "In progress": "warning",
  "Not ready": "danger",
  Unknown: "neutral",
};

export default function OmegaAuditReadiness() {
  const totals = useOmegaTotals();
  const entries = useFrameworkSummaries();

  const active = useMemo(
    () => entries.filter((e) => e.summary),
    [entries],
  );

  const topBlockers = useMemo(() => {
    const all: Array<{
      frameworkId: string;
      frameworkName: string;
      frameworkShort: string;
      basePath: string;
      label: string;
      count: number;
      severity: "critical" | "high" | "medium" | "low";
      href?: string;
    }> = [];
    active.forEach(({ framework, summary }) => {
      summary!.auditReadiness.blockers.forEach((b) => {
        all.push({
          frameworkId: framework.id,
          frameworkName: framework.name,
          frameworkShort: framework.shortCode,
          basePath: framework.basePath,
          label: b.label,
          count: b.count,
          severity: b.severity,
          href: b.href,
        });
      });
    });
    all.sort((a, b) => b.count - a.count);
    return all.slice(0, 10);
  }, [active]);

  return (
    <OmegaPage
      eyebrow="Omega · Audit readiness"
      title="Audit Readiness"
      description="Readiness by framework, blockers holding back approval, missing evidence and unresolved comments."
      icon={<ShieldCheck className="h-5 w-5" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Average readiness"
          value={totals.averageReadiness === null ? "—" : `${totals.averageReadiness}%`}
          tone={
            (totals.averageReadiness ?? 0) >= 70
              ? "success"
              : (totals.averageReadiness ?? 0) >= 40
                ? "warning"
                : "danger"
          }
          icon={ShieldCheck}
          footer={<ProgressBar value={totals.averageReadiness ?? 0} tone="info" />}
        />
        <KpiCard
          label="Missing evidence"
          value={active.reduce(
            (s, e) => s + e.summary!.auditReadiness.missingEvidence,
            0,
          )}
          tone="warning"
          icon={FolderOpen}
        />
        <KpiCard
          label="Pending approvals"
          value={totals.pendingReviews}
          tone={totals.pendingReviews > 0 ? "warning" : "default"}
          icon={MessageSquare}
        />
        <KpiCard
          label="Unresolved comments"
          value={active.reduce(
            (s, e) => s + e.summary!.auditReadiness.unresolvedComments,
            0,
          )}
          tone="info"
          icon={MessageSquare}
        />
      </div>

      <OmegaSection
        title="Readiness by framework"
        description="Click any framework to drill into its review workflow."
      >
        {active.length === 0 ? (
          <OmegaEmptyState
            title="No active framework data"
            description="Start an assessment to populate the readiness panel."
            icon={<ShieldCheck className="h-5 w-5" />}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {active.map(({ framework, summary }) => {
              const r = summary!.auditReadiness;
              return (
                <div
                  key={framework.id}
                  className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FrameworkPill framework={framework} linked />
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
                      label={r.label}
                      tone={READINESS_TONES[r.label]}
                    />
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Readiness score</span>
                        <span className="font-semibold tabular-nums text-foreground">
                          {r.score === null ? "—" : `${r.score}%`}
                        </span>
                      </div>
                      <ProgressBar
                        value={r.score ?? 0}
                        tone={
                          (r.score ?? 0) >= 70
                            ? "success"
                            : (r.score ?? 0) >= 40
                              ? "warning"
                              : "danger"
                        }
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <MiniStat
                        label="Approved"
                        value={`${r.controlsApproved}/${r.controlsTotal}`}
                      />
                      <MiniStat label="Missing evidence" value={r.missingEvidence} />
                      <MiniStat label="Pending approvals" value={r.pendingApprovals} />
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Top blockers</span>
                        <Link
                          to={framework.basePath}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Open workspace <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                      {r.blockers.length === 0 ? (
                        <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          No active blockers
                        </div>
                      ) : (
                        <ul className="space-y-1">
                          {r.blockers.slice(0, 4).map((b) => (
                            <li
                              key={b.id}
                              className="flex items-center justify-between rounded-md border border-border/50 px-3 py-1.5 text-xs"
                            >
                              <span className="truncate text-foreground">
                                {b.label}
                              </span>
                              <StatusBadge
                                label={`${b.count}`}
                                tone={severityTone(b.severity)}
                                className={cn("ml-2")}
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </OmegaSection>

      <OmegaSection title="Top blockers across the platform">
        {topBlockers.length === 0 ? (
          <OmegaEmptyState
            title="Nothing blocking"
            description="Every framework is clear of audit-readiness blockers."
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Framework</th>
                  <th className="px-4 py-2 text-left font-semibold">Blocker</th>
                  <th className="px-4 py-2 text-left font-semibold">Count</th>
                  <th className="px-4 py-2 text-left font-semibold">Severity</th>
                  <th className="px-4 py-2 text-right font-semibold">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {topBlockers.map((b) => (
                  <tr key={`${b.frameworkId}-${b.label}`} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <Link
                        to={b.basePath}
                        className="inline-flex items-center gap-1.5 font-medium text-foreground hover:underline"
                      >
                        <FrameworkPill
                          framework={{
                            id: b.frameworkId,
                            name: b.frameworkName,
                            shortCode: b.frameworkShort,
                            basePath: b.basePath,
                          }}
                        />
                        {b.frameworkName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-foreground">{b.label}</td>
                    <td className="px-4 py-2.5 tabular-nums">{b.count}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge label={b.severity} tone={severityTone(b.severity)} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {b.href ? (
                        <Link
                          to={b.href}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Open <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </OmegaSection>
    </OmegaPage>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-background/40 px-2 py-2">
      <div className="text-base font-semibold tabular-nums text-foreground">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
