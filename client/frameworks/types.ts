import type { ComponentType, LazyExoticComponent, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Permissions } from "@/lib/userManagement";

/**
 * Omega Framework Contract
 * ----------------------------------
 * Every framework module (NIST-CSF, ISO 27001, PCI-DSS, ...) plugged
 * into the Omega root platform MUST export a `FrameworkModule`
 * that implements this contract.
 *
 * The root shell never reaches into framework-specific internals —
 * it only consumes the metadata, navigation, routes and summary that
 * a framework chooses to publish.
 */

export type FrameworkStatus = "active" | "coming-soon" | "disabled";

export interface FrameworkNavItem {
  /** Stable id used as React key. */
  id: string;
  /** Display label shown in the sidebar. */
  label: string;
  /** Path is RELATIVE to the framework base route (leading slash optional). */
  path: string;
  /** Icon rendered next to the label. */
  icon: LucideIcon;
  /** Optional permission key required to see this nav item. */
  permission?: keyof Permissions;
  /** Optional numeric badge (e.g. open items). Render hidden when 0/undefined. */
  badge?: number;
}

/**
 * A lightweight hook that produces an object with *optional* numeric
 * counters. The return shape is `{ [navItemId]: number }` so the framework
 * can decorate its own navigation items without the shell knowing what
 * each id means.
 */
export type UseFrameworkNavBadges = () => Record<string, number>;

/* ------------------------------------------------------------------ */
/* Normalized cross-framework record types                            */
/* ------------------------------------------------------------------ */

export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type SeverityLevel = "critical" | "high" | "medium" | "low";

export interface FrameworkAssessmentRecord {
  /** Stable id unique within the framework. */
  id: string;
  /** Framework-specific control identifier, e.g. "PR.AA-01". */
  controlId: string;
  /** Human-readable control title (usually the question). */
  title: string;
  /** Top-level domain/function grouping, e.g. "PROTECT". */
  domain: string;
  /** Fine-grained category. */
  category?: string;
  /** Normalized assessment status. */
  status: "not-started" | "in-progress" | "answered" | "approved";
  /** Raw answer value (framework-native). */
  answer?: string | null;
  /** Maturity level (1..5), or null when unscored. */
  maturityScore: number | null;
  /** Owner name, when assigned. */
  owner?: string;
  /** ISO due date. */
  dueDate?: string | null;
  /** Last update timestamp. */
  updatedAt?: string;
  /** Absolute deep link into the framework workspace. */
  href: string;
}

export interface FrameworkGapRecord {
  id: string;
  controlId: string;
  title: string;
  domain: string;
  severity: SeverityLevel;
  priority: "Critical" | "High" | "Medium" | "Low";
  /** Open = untriaged, in-progress = draft action plan, treated = closed. */
  status: "open" | "in-progress" | "treated";
  owner?: string;
  expectedCompletionDate?: string | null;
  /** Days since the gap was opened. */
  ageDays: number;
  /** True when expectedCompletionDate is in the past and status != treated. */
  overdue: boolean;
  updatedAt?: string;
  href: string;
}

export interface FrameworkRiskRecord {
  id: string;
  controlId?: string;
  title: string;
  asset?: string;
  threat?: string;
  vulnerability?: string;
  inherentLevel?: RiskLevel;
  residualLevel: RiskLevel;
  likelihood?: number;
  impact?: number;
  status: "pending" | "in-progress" | "completed";
  owner?: string;
  treatmentOption?: string;
  updatedAt?: string;
  href: string;
}

export interface FrameworkEvidenceRecord {
  id: string;
  name: string;
  type?: string;
  sizeBytes?: number;
  source: "assessment" | "remediation" | "external";
  controlId?: string;
  controlTitle?: string;
  uploadedAt: string;
  /** Evidence hasn't been updated in >180 days. */
  stale: boolean;
  href?: string;
  /** Other framework ids that could reuse this artefact (populated by crosswalk). */
  reusableFor?: string[];
  cloudProviderId?: string;
  cloudProviderLabel?: string;
  evidenceMode?: "import" | "link";
  accessNote?: string;
}

export interface FrameworkReviewRecord {
  id: string;
  controlId: string;
  title: string;
  domain: string;
  reviewStatus: "pending" | "approved" | "revision-requested";
  submittedAt?: string | null;
  resolvedAt?: string | null;
  auditor?: string;
  commentCount: number;
  lastComment?: string;
  updatedAt?: string;
  href: string;
}

export interface FrameworkImprovementRecord {
  id: string;
  controlId: string;
  title: string;
  domain: string;
  status: "revision-required" | "in-progress" | "resubmitted" | "approved";
  auditorComment?: string;
  owner?: string;
  reviewDate?: string;
  updatedAt: string;
  href: string;
}

/* ------------------------------------------------------------------ */
/* Summary metrics & audit readiness                                  */
/* ------------------------------------------------------------------ */

export interface FrameworkSummaryMetric {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}

export interface FrameworkActivityEntry {
  id: string;
  kind:
    | "assessment"
    | "gap"
    | "risk"
    | "evidence"
    | "review"
    | "improvement"
    | "other";
  title: string;
  detail?: string;
  timestamp: string;
  href?: string;
}

export interface FrameworkBlocker {
  id: string;
  kind: "missing-evidence" | "pending-review" | "open-gap" | "open-risk" | "overdue";
  label: string;
  count: number;
  severity: SeverityLevel;
  href?: string;
}

export interface FrameworkAuditReadiness {
  /** 0..100, same as `FrameworkSummary.readinessScore`. */
  score: number | null;
  label: "Audit-ready" | "Close" | "In progress" | "Not ready" | "Unknown";
  controlsApproved: number;
  controlsTotal: number;
  missingEvidence: number;
  unresolvedComments: number;
  pendingApprovals: number;
  blockers: FrameworkBlocker[];
}

/**
 * Aggregated state a framework publishes to Omega.
 * Any `null` / missing field simply means "not yet meaningful" —
 * the root dashboard renders empty states in that case.
 */
export interface FrameworkSummary {
  assessmentProgress: number | null;
  totalControls: number;
  assessedControls: number;
  openGaps: number;
  pendingRemediations: number;
  evidenceCount: number;
  riskCount: number;
  /** Count of risks with residualLevel HIGH or CRITICAL. */
  criticalRisks: number;
  pendingReviews: number;
  overdueRemediations: number;
  evidenceCoverage: number | null;
  readinessScore: number | null;
  /** Average maturity across scored controls (0..5). */
  averageMaturity: number;
  extraMetrics?: FrameworkSummaryMetric[];
  recentActivity: FrameworkActivityEntry[];
  lastActivityAt: string | null;
  hasActivity: boolean;

  /* Structured record lists — consumed by Omega's global pages. */
  assessments: FrameworkAssessmentRecord[];
  gaps: FrameworkGapRecord[];
  risks: FrameworkRiskRecord[];
  evidence: FrameworkEvidenceRecord[];
  reviews: FrameworkReviewRecord[];
  improvements: FrameworkImprovementRecord[];
  auditReadiness: FrameworkAuditReadiness;
}

export type UseFrameworkSummary = () => FrameworkSummary;

export type FrameworkRoutesComponent =
  | ComponentType<{}>
  | LazyExoticComponent<ComponentType<{}>>;

export interface LegacyRedirect {
  from: string;
  to: string;
}

export interface FrameworkModule {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  shortCode: string;
  version?: string;
  filesystemPath: string;
  status: FrameworkStatus;
  basePath: string;
  navigation: FrameworkNavItem[];
  Routes?: FrameworkRoutesComponent;
  useSummary?: UseFrameworkSummary;
  useNavBadges?: UseFrameworkNavBadges;
  legacyRedirects?: LegacyRedirect[];
  /**
   * Theme accent — used to tint framework-specific UI surfaces.
   * Must be a resolvable Tailwind color family (e.g. "indigo", "emerald").
   */
  accent?: string;
}

export interface FrameworkSummaryEntry {
  framework: FrameworkModule;
  summary: FrameworkSummary | null;
}

export const EMPTY_AUDIT_READINESS: FrameworkAuditReadiness = {
  score: null,
  label: "Unknown",
  controlsApproved: 0,
  controlsTotal: 0,
  missingEvidence: 0,
  unresolvedComments: 0,
  pendingApprovals: 0,
  blockers: [],
};

export const EMPTY_FRAMEWORK_SUMMARY: FrameworkSummary = {
  assessmentProgress: null,
  totalControls: 0,
  assessedControls: 0,
  openGaps: 0,
  pendingRemediations: 0,
  evidenceCount: 0,
  riskCount: 0,
  criticalRisks: 0,
  pendingReviews: 0,
  overdueRemediations: 0,
  evidenceCoverage: null,
  readinessScore: null,
  averageMaturity: 0,
  extraMetrics: [],
  recentActivity: [],
  lastActivityAt: null,
  hasActivity: false,
  assessments: [],
  gaps: [],
  risks: [],
  evidence: [],
  reviews: [],
  improvements: [],
  auditReadiness: EMPTY_AUDIT_READINESS,
};

export type FrameworkChildren = { children?: ReactNode };
