import {
  AlertCircle,
  Archive,
  BarChart3,
  ClipboardCheck,
  FileCheck,
  LayoutDashboard,
  MessageSquare,
  Zap,
} from "lucide-react";
import type { FrameworkNavItem } from "@/frameworks/types";

/**
 * Navigation items exposed by the NIST-CSF framework module.
 *
 * The shell renders these under the "NIST-CSF" section of the sidebar
 * when the user is inside the framework. Paths are RELATIVE to the
 * framework's base path (defined in `module.ts`).
 */
export const nistCsfNavigation: FrameworkNavItem[] = [
  {
    id: "dashboard",
    label: "Framework Dashboard",
    path: "",
    icon: ClipboardCheck,
  },
  {
    id: "assessment",
    label: "Assessment",
    path: "assessment",
    icon: LayoutDashboard,
    permission: "assessment",
  },
  {
    id: "gap-analysis",
    label: "Gap Analysis",
    path: "gap-analysis",
    icon: BarChart3,
    permission: "gapAnalysis",
  },
  {
    id: "risk-assessment",
    label: "Risk Assessment",
    path: "risk-assessment",
    icon: AlertCircle,
    permission: "riskAssessment",
  },
  {
    id: "evidence",
    label: "Evidence",
    path: "evidence",
    icon: Archive,
    permission: "evidence",
  },
  {
    id: "report",
    label: "Report",
    path: "report",
    icon: FileCheck,
    permission: "report",
  },
  {
    id: "review",
    label: "Comment & Review",
    path: "review",
    icon: MessageSquare,
    permission: "review",
  },
  {
    id: "improvement",
    label: "Continuous Improvement",
    path: "improvement",
    icon: Zap,
    permission: "improvement",
  },
];
