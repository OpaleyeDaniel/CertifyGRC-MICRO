import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  FileText,
  BarChart3,
  AlertCircle,
  Archive,
  FileCheck,
  MessageSquare,
  Zap,
  Home,
  ChevronDown,
  X,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";
import { useGapRemediation } from "@/hooks/useGapRemediation";
import { useRiskAssessment } from "@/hooks/useRiskAssessment";
import { useRemediationEvidence } from "@/hooks/useRemediationEvidence";
import { useAuditorVerification } from "@/hooks/useAuditorVerification";
import { useContinuousImprovement } from "@/hooks/useContinuousImprovement";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
}

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const navItems: NavItem[] = [
  {
    icon: <Home className="h-5 w-5" />,
    label: "Dashboard",
    href: "/dashboard",
  },
];

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const location = useLocation();
  const { hasPermission } = useAuth();
  const { allQuestions } = useAssessmentEngine();
  const { allRemediations } = useGapRemediation();
  const { allRiskAssessments } = useRiskAssessment();
  const { remediations } = useRemediationEvidence();
  const { getAllVerifications } = useAuditorVerification();
  const { getRevisionRequiredItems } = useContinuousImprovement();
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  // Compute gap count dynamically from allQuestions
  // Count only items with gap_flag = true AND status = "Open" (or no remediation yet)
  const gapCount = useMemo(() => {
    return allQuestions.filter((q) => {
      const hasGap = q.userAnswer === "Partial" || q.userAnswer === "No";
      if (!hasGap || q.userAnswer === null) return false;

      // Check remediation status
      const remediation = allRemediations[q.id];
      // Include if no remediation yet, or if status is "Open"
      return !remediation || remediation.status === "Open";
    }).length;
  }, [allQuestions, allRemediations]);

  // Compute treated gaps count
  const treatedGapsCount = useMemo(() => {
    return allQuestions.filter((q) => {
      const hasGap = q.userAnswer === "Partial" || q.userAnswer === "No";
      if (!hasGap || q.userAnswer === null) return false;

      // Check if status is "Treated"
      const remediation = allRemediations[q.id];
      return remediation && remediation.status === "Treated";
    }).length;
  }, [allQuestions, allRemediations]);

  // Compute evidence count dynamically from both assessment and remediation evidence
  // Count all evidence items: assessment evidence (evidenceFiles + legacy evidenceUrl) + remediation evidence files
  const evidenceCount = useMemo(() => {
    // Count assessment evidence from all questions (both new multi-file and legacy single-file)
    const assessmentEvidence = allQuestions.reduce((count, q) => {
      const multiFileCount = q.evidenceFiles ? q.evidenceFiles.length : 0;
      const singleFileCount = q.evidenceUrl && (!q.evidenceFiles || q.evidenceFiles.length === 0) ? 1 : 0;
      return count + multiFileCount + singleFileCount;
    }, 0);

    // Count remediation evidence files
    const remediationEvidence = remediations.reduce((count, remediation) => {
      const fileCount = remediation.evidenceFiles
        ? remediation.evidenceFiles.length
        : 0;
      return count + fileCount;
    }, 0);

    return assessmentEvidence + remediationEvidence;
  }, [allQuestions, remediations]);

  // Compute pending risk count dynamically from allRiskAssessments
  // Count gaps that are treated but don't have a completed risk assessment
  const pendingRiskCount = useMemo(() => {
    // Get gaps (questions with NO or PARTIAL answers)
    const gaps = allQuestions.filter((q) => q.userAnswer === "No" || q.userAnswer === "Partial");
    
    // Get completed risk assessment IDs
    const completedQuestionIds = new Set(
      Object.values(allRiskAssessments)
        .filter((risk) => risk.status === "Completed")
        .map((risk) => risk.questionId)
    );
    
    // Count treated gaps without completed risk assessments
    const count = gaps.filter((gap) => {
      const remediation = allRemediations[gap.id];
      const isRemediated = remediation && remediation.status === "Treated";
      return isRemediated && !completedQuestionIds.has(gap.id);
    }).length;
    
    console.log("📊 Sidebar pendingRiskCount:", {
      totalGaps: gaps.length,
      treatedGaps: gaps.filter((g) => allRemediations[g.id]?.status === "Treated").length,
      completedRisks: completedQuestionIds.size,
      pendingRiskCount: count,
    });
    return count;
  }, [allQuestions, allRiskAssessments, allRemediations]);

  // Compute assessment count: number of unanswered questions
  const assessmentCount = useMemo(() => {
    return allQuestions.filter((q) => !q.userAnswer).length;
  }, [allQuestions]);

  // Compute report count: number of answered questions
  const reportCount = useMemo(() => {
    return allQuestions.filter((q) => q.userAnswer).length;
  }, [allQuestions]);

  // Compute comment & review count: number of controls submitted for review
  const reviewCount = useMemo(() => {
    const verifications = getAllVerifications();
    return verifications.filter((v) => v.reviewStatus === "Pending Review").length;
  }, [getAllVerifications]);

  // Compute continuous improvement count: number of items requiring revision
  const improvementCount = useMemo(() => {
    const ciItems = getRevisionRequiredItems();
    return ciItems.length;
  }, [getRevisionRequiredItems]);

  // Match Dashboard's "Overall Audit Readiness" computation exactly
  const auditReadiness = useMemo(() => {
    const totalControls = allQuestions.length;
    if (!totalControls) return 0;

    const verifications = getAllVerifications();
    const approvedControls = verifications.filter((v) => v.status === "approved").length;

    return Math.round((approvedControls / totalControls) * 100);
  }, [allQuestions, getAllVerifications]);

  // Dynamically build sections with computed gap count, evidence count, and pending risk count
  const sections: Array<{
    title: string;
    icon: React.ReactNode;
    href: string;
    badge?: number;
  }> = [
    {
      title: "Assessment",
      icon: <FileText className="h-5 w-5" />,
      href: "/assessment",
      badge: assessmentCount,
    },
    {
      title: "Gap Analysis",
      icon: <BarChart3 className="h-5 w-5" />,
      href: "/gap-analysis",
      badge: gapCount,
    },
    {
      title: "Risk Assessment",
      icon: <AlertCircle className="h-5 w-5" />,
      href: "/risk-assessment",
      badge: pendingRiskCount,
    },
    {
      title: "Evidence",
      icon: <Archive className="h-5 w-5" />,
      href: "/evidence",
      badge: evidenceCount,
    },
    {
      title: "Report",
      icon: <FileCheck className="h-5 w-5" />,
      href: "/report",
      badge: reportCount,
    },
    {
      title: "Comment & Review",
      icon: <MessageSquare className="h-5 w-5" />,
      href: "/review",
      badge: reviewCount,
    },
    {
      title: "Continuous Improvement",
      icon: <Zap className="h-5 w-5" />,
      href: "/improvement",
      badge: improvementCount,
    },
  ];

  const PAGE_PERMISSION_MAP = {
    "/assessment": "assessment",
    "/gap-analysis": "gapAnalysis",
    "/risk-assessment": "riskAssessment",
    "/evidence": "evidence",
    "/report": "report",
    "/review": "review",
    "/improvement": "improvement",
  } as const;

  const visibleSections = sections.filter((section) => {
    const permKey = (PAGE_PERMISSION_MAP as any)[section.href];
    if (!permKey) return true; // Non-workflow pages are always visible
    return hasPermission(permKey, "view");
  });

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-border bg-sidebar overflow-y-auto transition-transform md:relative md:top-0 md:h-full md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <nav className="flex flex-col p-4 gap-2">
          {/* Main Navigation */}
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              {item.icon}
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto text-xs bg-primary text-white rounded-full px-2">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          <div className="my-2 border-t border-sidebar-border" />

          {/* Sections */}
          <div className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider px-4 py-2">
            Compliance Sections
          </div>

          {visibleSections.map((section) => {
            const expanded = expandedSections[section.title] ?? true;

            return (
              <div key={section.title}>
                <Link
                  to={section.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors relative group",
                    isActive(section.href)
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  )}
                >
                  {section.icon}
                  <span className="flex-1">{section.title}</span>
                  {section.badge !== undefined && section.badge > 0 && (
                    <span className="text-xs bg-destructive text-white rounded-full px-2 py-0.5">
                      {section.badge}
                    </span>
                  )}
                </Link>
              </div>
            );
          })}

          <div className="my-2 border-t border-sidebar-border" />

          {/* Quick Stats */}
          <div className="mt-4 px-4">
            <div className="rounded-lg bg-sidebar-accent/30 p-3 space-y-2">
              <div className="text-xs font-semibold text-sidebar-foreground">
                Audit Readiness
              </div>
              <div className="text-2xl font-bold text-primary">{auditReadiness}%</div>
              <div className="text-xs text-sidebar-foreground/70">
                Ready
                 for audit
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
