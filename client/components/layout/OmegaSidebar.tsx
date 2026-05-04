import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FolderTree, Sparkles, X } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { REGISTERED_FRAMEWORKS } from "@/frameworks/registry";
import {
  useAllGaps,
  useAllRisks,
  useAllReviews,
  useAllImprovements,
  useOmegaTotals,
} from "@/frameworks/useFrameworkSummaries";
import {
  OMEGA_NAV,
  OMEGA_NAV_GROUPS,
  type OmegaNavItem,
} from "@/frameworks/omegaRoutes";
import type { FrameworkModule } from "@/frameworks/types";

interface OmegaSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

/**
 * Omega (general / root) sidebar.
 *
 * Rendered ONLY by `OmegaLayout` on global / cross-framework pages.
 * NEVER rendered inside a framework workspace.
 *
 * Sections (top → bottom):
 *   1. Omega wordmark
 *   2. Global nav grouped by section (Overview, Operations, Intelligence, System)
 *   3. Connected Frameworks — clickable entries that navigate INTO a workspace
 *   4. Audit readiness mini-panel
 */
export function OmegaSidebar({ open = false, onClose }: OmegaSidebarProps) {
  const location = useLocation();
  const { hasPermission } = useAuth();

  const totals = useOmegaTotals();
  const allGaps = useAllGaps();
  const allRisks = useAllRisks();
  const allReviews = useAllReviews();
  const allImprovements = useAllImprovements();

  const globalBadges: Record<string, number> = useMemo(() => {
    const pendingReviews = allReviews.filter(
      (r) => r.record.reviewStatus === "pending",
    ).length;
    const openImprovements = allImprovements.filter(
      (i) => i.record.status !== "approved",
    ).length;
    return {
      assessment: totals.assessedControls,
      gaps: allGaps.filter((g) => g.record.status !== "treated").length,
      risks: allRisks.filter((r) => r.record.status !== "completed").length,
      evidence: totals.evidenceCount,
      review: pendingReviews,
      improvement: openImprovements,
      readiness: totals.criticalRisks + totals.overdueRemediations,
      notifications:
        pendingReviews + totals.overdueRemediations + totals.criticalRisks,
    };
  }, [allGaps, allRisks, allReviews, allImprovements, totals]);

  const isExactActive = (href: string) =>
    location.pathname === href ||
    (href === "/dashboard" && location.pathname === "/");

  const groupedNav = useMemo(
    () =>
      OMEGA_NAV_GROUPS.map((group) => ({
        ...group,
        items: OMEGA_NAV.filter((item) => item.group === group.id),
      })).filter((g) => g.items.length > 0),
    [],
  );

  const readinessLabel =
    totals.averageReadiness === null ? "—" : `${totals.averageReadiness}%`;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 border-r border-border bg-sidebar overflow-y-auto transition-transform md:relative md:top-0 md:z-auto md:h-full md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4 md:hidden">
          <span className="font-semibold">Omega</span>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-sidebar-accent/50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Desktop wordmark */}
        <div className="hidden items-center gap-2 px-4 pt-4 md:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight text-sidebar-foreground">
              Omega
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/50">
              GRC Operating System
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-3 py-4">
          {groupedNav.map((group, idx) => (
            <div key={group.id} className={cn(idx === 0 ? "" : "mt-3")}>
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/40">
                {group.label}
              </div>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) =>
                  renderGlobalLink(
                    item,
                    isExactActive,
                    globalBadges,
                    hasPermission,
                    onClose,
                  ),
                )}
              </div>
            </div>
          ))}

          <div className="mt-5 px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/40">
            Connected Frameworks
          </div>

          {REGISTERED_FRAMEWORKS.length === 0 ? (
            <div className="mx-1 rounded-md border border-dashed border-sidebar-border px-3 py-4 text-xs text-sidebar-foreground/60">
              <FolderTree className="mb-2 h-4 w-4" />
              <p>No frameworks connected yet.</p>
              <p className="mt-1 text-sidebar-foreground/50">
                Register a framework in{" "}
                <code>client/frameworks/registry.ts</code>.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {REGISTERED_FRAMEWORKS.map((fw) => (
                <FrameworkEntry
                  key={fw.id}
                  framework={fw}
                  onClose={onClose}
                />
              ))}
            </div>
          )}

          {/* Audit readiness mini-panel */}
          <div className="mt-4 px-1">
            <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-4">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/60">
                  Audit readiness
                </div>
                <span className="rounded-full border border-sidebar-border px-1.5 py-0.5 text-[10px] font-semibold text-sidebar-foreground/70">
                  {totals.frameworksWithActivity}/
                  {totals.activeFrameworks || totals.totalFrameworks}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-primary">
                  {readinessLabel}
                </span>
                {totals.criticalRisks > 0 && (
                  <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-rose-500">
                    {totals.criticalRisks} critical
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-sidebar-foreground/60">
                {totals.frameworksWithActivity > 0
                  ? `Across ${totals.frameworksWithActivity} active framework${totals.frameworksWithActivity === 1 ? "" : "s"}`
                  : "Start a framework assessment to see live readiness"}
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}

// ─── Render helpers ─────────────────────────────────────────────────────────

function renderGlobalLink(
  item: OmegaNavItem,
  isExactActive: (href: string) => boolean,
  badges: Record<string, number>,
  hasPermission: (key: any, action: any) => boolean,
  onClose?: () => void,
) {
  if (item.permission && !hasPermission(item.permission as any, "view")) {
    return null;
  }
  const active = isExactActive(item.href);
  const Icon = item.icon;
  const badge = badges[item.id];

  return (
    <Link
      key={item.id}
      to={item.href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50",
      )}
    >
      <Icon className="h-4 w-4 flex-none" />
      <span className="flex-1 truncate">{item.label}</span>
      {badge && badge > 0 ? (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
            active
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function FrameworkEntry({
  framework,
  onClose,
}: {
  framework: FrameworkModule;
  onClose?: () => void;
}) {
  const isActive = framework.status === "active";
  const Icon = framework.icon;

  return (
    <Link
      to={
        isActive ? framework.basePath : `/frameworks?highlight=${framework.id}`
      }
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "text-sidebar-foreground hover:bg-sidebar-accent/50"
          : "opacity-60 text-sidebar-foreground hover:bg-sidebar-accent/30",
      )}
    >
      <Icon className="h-4 w-4 flex-none" />
      <span className="flex-1 truncate">{framework.name}</span>
      {!isActive ? (
        <span className="rounded-full border border-border px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Soon
        </span>
      ) : (
        <span className="text-sidebar-foreground/30 text-xs">→</span>
      )}
    </Link>
  );
}
