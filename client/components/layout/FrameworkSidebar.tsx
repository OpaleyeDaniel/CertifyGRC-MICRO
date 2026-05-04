import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowLeft, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { FrameworkModule, FrameworkNavItem } from "@/frameworks/types";

interface FrameworkSidebarProps {
  framework: FrameworkModule;
  open?: boolean;
  onClose?: () => void;
}

/**
 * FrameworkSidebar
 * ----------------
 * Rendered ONLY by `FrameworkLayout` while the user is inside a framework
 * workspace. It is completely isolated from the Omega / general sidebar —
 * there is no global navigation, no cross-framework nav, no link to other
 * frameworks. Only:
 *
 *   1. ← Back to Omega    (the one escape hatch)
 *   2. Framework identity header
 *   3. Full framework-specific navigation (badges, permissions)
 *   4. Framework version footer
 *
 * Every link is scoped to the framework's `basePath` so navigation inside
 * the workspace NEVER leaks back into general Omega routes by accident.
 */
export function FrameworkSidebar({
  framework,
  open = false,
  onClose,
}: FrameworkSidebarProps) {
  const location = useLocation();
  const { hasPermission } = useAuth();
  const Icon = framework.icon;

  /** Each framework module supplies its own badge hook — the shell never imports a specific framework. */
  const badges = framework.useNavBadges?.() ?? {};

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
        {/* Mobile close */}
        <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4 md:hidden">
          <span className="font-semibold truncate">{framework.name}</span>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-sidebar-accent/50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col h-full">
          {/* Back to Omega — the ONLY exit from the framework workspace */}
          <div className="px-3 pt-4 pb-2">
            <Link
              to="/dashboard"
              onClick={onClose}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors w-fit"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Omega
            </Link>
          </div>

          {/* Framework identity header */}
          <div className="mx-3 mb-3 rounded-xl border border-sidebar-border bg-sidebar-accent/20 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-sidebar-foreground">
                  {framework.name}
                </div>
                <div className="truncate text-[10px] text-sidebar-foreground/50">
                  {framework.tagline}
                </div>
              </div>
            </div>
          </div>

          {/* Framework navigation */}
          <nav className="flex-1 overflow-y-auto px-3">
            <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/40">
              {framework.shortCode} Workspace
            </div>
            <div className="flex flex-col gap-0.5">
              {framework.navigation
                .filter(
                  (item) =>
                    !item.permission ||
                    hasPermission(item.permission as any, "view"),
                )
                .map((item) =>
                  renderFrameworkNavItem(
                    item,
                    framework,
                    location.pathname,
                    badges,
                    onClose,
                  ),
                )}
            </div>
          </nav>

          {/* Framework footer */}
          <div className="px-3 pb-4 pt-3 mt-auto border-t border-sidebar-border">
            <Link
              to={framework.basePath}
              onClick={onClose}
              className="block rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-3 hover:bg-sidebar-accent/50 transition-colors"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50 mb-1">
                Framework
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-sidebar-foreground">
                  {framework.name}
                </span>
                {framework.version && (
                  <span className="rounded-full border border-sidebar-border px-1.5 py-0 text-[10px] text-sidebar-foreground/50">
                    v{framework.version}
                  </span>
                )}
              </div>
              <div className="mt-1 text-[10px] text-sidebar-foreground/40">
                View framework dashboard →
              </div>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

/**
 * Build a link for a single framework nav item.
 * The path is ALWAYS `framework.basePath + item.path` — never a root-level
 * Omega path — so clicks cannot accidentally leak out to general pages.
 */
function renderFrameworkNavItem(
  item: FrameworkNavItem,
  framework: FrameworkModule,
  pathname: string,
  badges: Record<string, number>,
  onClose?: () => void,
) {
  const cleanPath = item.path.replace(/^\/+/, "");
  const href = cleanPath
    ? `${framework.basePath}/${cleanPath}`
    : framework.basePath;

  const active =
    pathname === href ||
    (href === framework.basePath &&
      (pathname === `${framework.basePath}/` ||
        pathname === `${framework.basePath}/dashboard`));

  const ItemIcon = item.icon;
  const badge = badges[item.id] ?? 0;

  return (
    <Link
      key={item.id}
      to={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50",
      )}
    >
      <ItemIcon className="h-4 w-4 flex-none" />
      <span className="flex-1 truncate">{item.label}</span>
      {badge > 0 && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
            active
              ? "bg-destructive/20 text-destructive"
              : "bg-destructive text-white",
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
