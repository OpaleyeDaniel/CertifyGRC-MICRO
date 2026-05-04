import {
  Home,
  Layers,
  ClipboardList,
  AlertTriangle,
  Shield,
  FolderOpen,
  FileText,
  MessageSquare,
  TrendingUp,
  GitCompareArrows,
  CheckCircle2,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Permissions } from "@/lib/userManagement";

/**
 * Omega's GLOBAL sidebar pages — the cross-framework pages the root
 * platform always renders. The sidebar and App.tsx both consume this list,
 * so adding a new global page is a one-liner.
 *
 * These are DIFFERENT from framework-specific navigation: these pages
 * aggregate data across every registered framework.
 */
export interface OmegaNavItem {
  id: string;
  label: string;
  description?: string;
  /** Absolute URL. Must start with `/`. */
  href: string;
  icon: LucideIcon;
  /** Optional permission key to show this nav entry. */
  permission?: keyof Permissions;
  /** Grouping used by the sidebar. */
  group: "core" | "operations" | "insights" | "system";
}

export const OMEGA_NAV: OmegaNavItem[] = [
  { id: "dashboard",    label: "Dashboard",              href: "/dashboard",              icon: Home,            group: "core" },
  { id: "frameworks",   label: "Frameworks",             href: "/frameworks",             icon: Layers,          group: "core" },
  { id: "assessment",   label: "Assessment",             href: "/assessment",             icon: ClipboardList,   group: "operations" },
  { id: "gaps",         label: "Gap Analysis",           href: "/gap-analysis",           icon: AlertTriangle,   group: "operations" },
  { id: "risks",        label: "Risk Assessment",        href: "/risk",                   icon: Shield,          group: "operations" },
  { id: "evidence",     label: "Evidence",               href: "/evidence",               icon: FolderOpen,      group: "operations" },
  { id: "report",       label: "Report",                 href: "/report",                 icon: FileText,        group: "insights" },
  { id: "review",       label: "Comment & Review",       href: "/review",                 icon: MessageSquare,   group: "operations" },
  { id: "improvement",  label: "Continuous Improvement", href: "/improvement",            icon: TrendingUp,      group: "operations" },
  { id: "crosswalk",    label: "Cross Mapping",          href: "/cross-mapping",          icon: GitCompareArrows, group: "insights" },
  { id: "readiness",    label: "Audit Readiness",        href: "/audit-readiness",        icon: CheckCircle2,    group: "insights" },
  { id: "notifications",label: "Notifications",          href: "/notifications",          icon: Bell,            group: "system" },
  { id: "settings",     label: "Settings",               href: "/settings",               icon: Settings,        group: "system" },
];

export const OMEGA_NAV_GROUPS: Array<{
  id: OmegaNavItem["group"];
  label: string;
}> = [
  { id: "core", label: "Overview" },
  { id: "operations", label: "Operations" },
  { id: "insights", label: "Intelligence" },
  { id: "system", label: "System" },
];
