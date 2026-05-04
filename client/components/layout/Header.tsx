import { Bell, Search, Settings, LogOut, User, Menu, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getInitials, safeParseJSON, STORAGE_KEYS, type AppUser } from "@/lib/userManagement";
import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";
import { useGapRemediation } from "@/hooks/useGapRemediation";
import { useRiskAssessment } from "@/hooks/useRiskAssessment";
import { useRemediationEvidence } from "@/hooks/useRemediationEvidence";
import { useAuditorVerification } from "@/hooks/useAuditorVerification";
import { useContinuousImprovement } from "@/hooks/useContinuousImprovement";

interface HeaderProps {
  onMenuClick?: () => void;
}

type SearchEntityType =
  | "Page"
  | "Control"
  | "Risk"
  | "Gap remediation"
  | "Evidence"
  | "Review"
  | "Continuous improvement"
  | "User";

type SearchItem = {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle: string;
  keywords: string;
  route: string;
};

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const lowered = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lowered.indexOf(q);
  if (idx === -1) return text;

  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/40 text-foreground rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { allQuestions } = useAssessmentEngine();
  const { allRemediations } = useGapRemediation();
  const { allRiskAssessments } = useRiskAssessment();
  const { remediations } = useRemediationEvidence();
  const { getAllVerifications } = useAuditorVerification();
  const { getRevisionRequiredItems, getAllItems } = useContinuousImprovement();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  // Calculate dynamic notifications: sum of ALL action items from Gap Analysis through Continuous Improvement
  const notifications = useMemo(() => {
    // 1. OPEN GAPS (Gap Analysis - Open tab)
    const openGapsCount = allQuestions.filter((q) => {
      const hasGap = q.userAnswer === "Partial" || q.userAnswer === "No";
      if (!hasGap || q.userAnswer === null) return false;
      const remediation = allRemediations[q.id];
      return !remediation || remediation.status === "Open";
    }).length;

    // 2. IN PROGRESS GAPS (Gap Analysis - In Progress tab)
    const draftGapsCount = allQuestions.filter((q) => {
      const hasGap = q.userAnswer === "Partial" || q.userAnswer === "No";
      if (!hasGap || q.userAnswer === null) return false;
      const remediation = allRemediations[q.id];
      return remediation && remediation.status === "Draft";
    }).length;

    // 3. PENDING RISK ASSESSMENTS (Risk Assessment tab)
    const pendingRisksCount = allQuestions.filter((q) => {
      if (q.userAnswer !== "No" && q.userAnswer !== "Partial") return false;
      const remediation = allRemediations[q.id];
      const isRemediated = remediation && remediation.status === "Treated";
      if (!isRemediated) return false;
      const completedRisks = Object.values(allRiskAssessments).filter(
        (r) => r.status === "Completed" && r.questionId === q.id
      );
      return completedRisks.length === 0;
    }).length;

    // 4. EVIDENCE FILES (Evidence tab)
    const evidenceCount = allQuestions.reduce((count, q) => {
      const multiFileCount = q.evidenceFiles ? q.evidenceFiles.length : 0;
      const singleFileCount = q.evidenceUrl && (!q.evidenceFiles || q.evidenceFiles.length === 0) ? 1 : 0;
      return count + multiFileCount + singleFileCount;
    }, 0) + remediations.reduce((count, remediation) => {
      const fileCount = remediation.evidenceFiles ? remediation.evidenceFiles.length : 0;
      return count + fileCount;
    }, 0);

    // 5. TREATED GAPS (Gap Analysis - Treated tab, waiting for risk assessment)
    const treatedGapsCount = allQuestions.filter((q) => {
      const hasGap = q.userAnswer === "Partial" || q.userAnswer === "No";
      if (!hasGap || q.userAnswer === null) return false;
      const remediation = allRemediations[q.id];
      return remediation && remediation.status === "Treated";
    }).length;

    // 6. PENDING REVIEWS (Comment & Review tab)
    const pendingReviewsCount = getAllVerifications().filter(
      (v) => v.reviewStatus === "Pending Review"
    ).length;

    // 7. REVISION ITEMS (Continuous Improvement tab)
    const revisionItemsCount = getRevisionRequiredItems().length;

    // Total: All artifacts across Gap Analysis → Continuous Improvement
    console.log(`📊 Notification Badge Count Breakdown:`, {
      openGaps: openGapsCount,
      draftGaps: draftGapsCount,
      treatedGaps: treatedGapsCount,
      pendingRisks: pendingRisksCount,
      evidenceFiles: evidenceCount,
      pendingReviews: pendingReviewsCount,
      revisionItems: revisionItemsCount,
      total: openGapsCount + draftGapsCount + treatedGapsCount + pendingRisksCount + evidenceCount + pendingReviewsCount + revisionItemsCount
    });

    return (
      openGapsCount +
      draftGapsCount +
      treatedGapsCount +
      pendingRisksCount +
      evidenceCount +
      pendingReviewsCount +
      revisionItemsCount
    );
  }, [allQuestions, allRemediations, allRiskAssessments, remediations, getAllVerifications, getRevisionRequiredItems]);

  const searchIndex = useMemo<SearchItem[]>(() => {
    const users = safeParseJSON<AppUser[]>(
      localStorage.getItem(STORAGE_KEYS.USER_MANAGEMENT),
      []
    );
    const verifications = getAllVerifications();
    const ciItems = getAllItems();
    const items: SearchItem[] = [
      // Omega root / global pages.
      { id: "page-dashboard",   type: "Page", title: "Omega Dashboard",          subtitle: "GRC command center",                   keywords: "dashboard home overview command center omega", route: "/dashboard" },
      { id: "page-frameworks-hub", type: "Page", title: "Frameworks",             subtitle: "Connected frameworks hub",             keywords: "compliance framework frameworks hub nist iso pci omega", route: "/frameworks" },
      { id: "page-omega-assessment", type: "Page", title: "Assessment (cross-framework)", subtitle: "All assessments across frameworks", keywords: "assessment controls omega cross framework", route: "/assessment" },
      { id: "page-omega-gap",   type: "Page", title: "Gap Analysis (cross-framework)", subtitle: "All gaps across frameworks",     keywords: "gap gaps remediation severity cross framework", route: "/gap-analysis" },
      { id: "page-omega-risk",  type: "Page", title: "Risk Assessment (cross-framework)", subtitle: "Unified risk register",       keywords: "risk register heatmap cross framework", route: "/risk" },
      { id: "page-omega-evidence", type: "Page", title: "Evidence (cross-framework)", subtitle: "Unified evidence library",         keywords: "evidence library artefacts stale reuse", route: "/evidence" },
      { id: "page-omega-report", type: "Page", title: "Reports",                  subtitle: "Executive and framework reports",      keywords: "report reports executive compliance posture", route: "/report" },
      { id: "page-omega-review", type: "Page", title: "Comment & Review",         subtitle: "Pending reviews and comments",         keywords: "comment review auditor collaboration", route: "/review" },
      { id: "page-omega-improvement", type: "Page", title: "Continuous Improvement", subtitle: "Remediation backlog and uplift",  keywords: "improvement continuous revision maturity", route: "/improvement" },
      { id: "page-omega-cross", type: "Page", title: "Cross Mapping",             subtitle: "Framework crosswalk and overlap",      keywords: "cross mapping crosswalk overlap nist iso pci", route: "/cross-mapping" },
      { id: "page-omega-readiness", type: "Page", title: "Audit Readiness",      subtitle: "Readiness score and blockers",         keywords: "audit readiness blockers approval score", route: "/audit-readiness" },
      { id: "page-omega-notifications", type: "Page", title: "Notifications",    subtitle: "Alerts and activity feed",             keywords: "notifications alerts activity events", route: "/notifications" },
      { id: "page-profile",     type: "Page", title: "Profile",                   subtitle: "User profile and security settings",   keywords: "profile account password avatar", route: "/profile" },
      { id: "page-settings",    type: "Page", title: "Settings",                  subtitle: "Account, users, appearance",           keywords: "settings account users permissions appearance", route: "/settings" },

      // NIST-CSF specific deep links.
      { id: "page-nist-assessment", type: "Page", title: "NIST-CSF Assessment",  subtitle: "Framework workspace",                  keywords: "assessment nist controls framework", route: "/frameworks/nist-csf/assessment?tab=assessment" },
      { id: "page-nist-gap",    type: "Page", title: "NIST-CSF Gap analysis",    subtitle: "Framework workspace",                  keywords: "gap analysis remediation nist",         route: "/frameworks/nist-csf/gap-analysis" },
      { id: "page-nist-risk",   type: "Page", title: "NIST-CSF Risk assessment", subtitle: "Framework workspace",                  keywords: "risk assessment nist register",         route: "/frameworks/nist-csf/risk-assessment" },
      { id: "page-nist-evidence", type: "Page", title: "NIST-CSF Evidence",      subtitle: "Framework workspace",                  keywords: "evidence nist files documents",         route: "/frameworks/nist-csf/evidence" },
      { id: "page-nist-report", type: "Page", title: "NIST-CSF Report",          subtitle: "Framework workspace",                  keywords: "report nist lifecycle",                 route: "/frameworks/nist-csf/report" },
      { id: "page-nist-review", type: "Page", title: "NIST-CSF Comment & review", subtitle: "Framework workspace",                keywords: "comment review nist auditor verification", route: "/frameworks/nist-csf/review" },
      { id: "page-nist-improvement", type: "Page", title: "NIST-CSF Continuous improvement", subtitle: "Framework workspace",  keywords: "continuous improvement nist revision",  route: "/frameworks/nist-csf/improvement" },
    ];

    allQuestions.forEach((q) => {
      items.push({
        id: `control-${q.id}`,
        type: "Control",
        title: `${q.nist_id} ${q.question}`,
        subtitle: `${q.function} • ${q.category}`,
        keywords: `${q.nist_id} ${q.question} ${q.function} ${q.category}`,
        route: `/frameworks/nist-csf/assessment?tab=assessment&nist=${encodeURIComponent(q.nist_id)}`,
      });
    });

    Object.values(allRemediations).forEach((r) => {
      items.push({
        id: `remediation-${r.questionId}`,
        type: "Gap remediation",
        title: `${r.nistId} remediation (${r.status})`,
        subtitle: `${r.priority} priority • ${r.function}`,
        keywords: `${r.nistId} ${r.question} ${r.rootCause} ${r.actionPlan} ${r.priority} ${r.status}`,
        route: `/frameworks/nist-csf/gap-analysis?controlId=${encodeURIComponent(r.questionId)}`,
      });
    });

    Object.values(allRiskAssessments).forEach((r) => {
      items.push({
        id: `risk-${r.riskId}`,
        type: "Risk",
        title: `${r.nistId} risk (${r.status})`,
        subtitle: `${r.postTreatmentRiskLevel} residual risk • ${r.function || "NIST"}`,
        keywords: `${r.riskId} ${r.nistId} ${r.gapDescription} ${r.riskDescription.asset} ${r.riskDescription.threat} ${r.riskDescription.vulnerability} ${r.postTreatmentRiskLevel}`,
        route: `/frameworks/nist-csf/risk-assessment?questionId=${encodeURIComponent(r.questionId)}&nist=${encodeURIComponent(r.nistId)}`,
      });
    });

    allQuestions.forEach((q) => {
      const files = q.evidenceFiles || [];
      files.forEach((f, idx) => {
        items.push({
          id: `evidence-assessment-${q.id}-${idx}`,
          type: "Evidence",
          title: f.name || `${q.nist_id} evidence`,
          subtitle: `Assessment evidence • ${q.nist_id}`,
          keywords: `${f.name} ${q.nist_id} ${q.question} assessment evidence`,
        route: `/frameworks/nist-csf/evidence?q=${encodeURIComponent(f.name || q.nist_id)}`,
        });
      });
    });

    remediations.forEach((r) => {
      const files = r.evidenceFiles || [];
      files.forEach((f, idx) => {
        items.push({
          id: `evidence-remediation-${r.questionId}-${idx}`,
          type: "Evidence",
          title: f.name || `${r.nistId} remediation evidence`,
          subtitle: `Remediation evidence • ${r.nistId}`,
          keywords: `${f.name} ${r.nistId} ${r.question} remediation evidence`,
        route: `/frameworks/nist-csf/evidence?q=${encodeURIComponent(f.name || r.nistId)}`,
        });
      });
    });

    verifications.forEach((v) => {
      items.push({
        id: `review-${v.questionId}`,
        type: "Review",
        title: `${v.nistId} review (${v.status})`,
        subtitle: v.reviewStatus || "Review workflow",
        keywords: `${v.nistId} ${v.status} ${v.reviewStatus || ""} ${v.auditorComment || ""}`,
        route: `/frameworks/nist-csf/review?q=${encodeURIComponent(v.nistId)}`,
      });
    });

    ciItems.forEach((item) => {
      items.push({
        id: `ci-${item.controlId}`,
        type: "Continuous improvement",
        title: `${item.nistId} ${item.status.replace("_", " ")}`,
        subtitle: `${item.function} • ${item.category}`,
        keywords: `${item.nistId} ${item.controlTitle} ${item.auditorOverallComment || ""} ${item.status}`,
        route: `/frameworks/nist-csf/improvement?q=${encodeURIComponent(item.nistId)}`,
      });
    });

    users.forEach((u) => {
      items.push({
        id: `user-${u.id}`,
        type: "User",
        title: `${u.fullName} (${u.role})`,
        subtitle: `${u.email} • ${u.title || "No title"}`,
        keywords: `${u.fullName} ${u.email} ${u.role} ${u.title || ""}`,
        route: `/settings?tab=users&q=${encodeURIComponent(u.email)}`,
      });
    });

    return items;
  }, [
    allQuestions,
    allRemediations,
    allRiskAssessments,
    remediations,
    getAllVerifications,
    getAllItems,
  ]);

  const searchState = useMemo(() => {
    try {
      if (!debouncedQuery) return { results: [] as SearchItem[], error: "" };
      const q = debouncedQuery.toLowerCase();

      const scored = searchIndex
        .map((item) => {
          const title = item.title.toLowerCase();
          const subtitle = item.subtitle.toLowerCase();
          const keywords = item.keywords.toLowerCase();
          const exactId = item.id.toLowerCase() === q;
          const startsTitle = title.startsWith(q);
          const includesTitle = title.includes(q);
          const includesSubtitle = subtitle.includes(q);
          const includesKeywords = keywords.includes(q);

          if (!(startsTitle || includesTitle || includesSubtitle || includesKeywords || exactId)) {
            return null;
          }

          const score =
            (exactId ? 100 : 0) +
            (startsTitle ? 55 : 0) +
            (includesTitle ? 35 : 0) +
            (includesSubtitle ? 16 : 0) +
            (includesKeywords ? 10 : 0);

          return { item, score };
        })
        .filter((v): v is { item: SearchItem; score: number } => Boolean(v))
        .sort((a, b) => b.score - a.score)
        .slice(0, 30)
        .map((v) => v.item);

      return { results: scored, error: "" };
    } catch (e) {
      console.error("Global search failed:", e);
      return { results: [] as SearchItem[], error: "Search is temporarily unavailable." };
    }
  }, [searchIndex, debouncedQuery]);

  const groupedResults = useMemo(() => {
    const groups: Record<SearchEntityType, SearchItem[]> = {
      Page: [],
      Control: [],
      Risk: [],
      "Gap remediation": [],
      Evidence: [],
      Review: [],
      "Continuous improvement": [],
      User: [],
    };
    searchState.results.forEach((r) => groups[r.type].push(r));
    return groups;
  }, [searchState.results]);

  const isSearching = searchQuery.trim().length > 0 && debouncedQuery !== searchQuery.trim();

  const handleSelectResult = (item: SearchItem) => {
    setSearchQuery("");
    setDebouncedQuery("");
    setIsSearchOpen(false);
    navigate(item.route);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center">
            <div className="">
               <img src="/logo1.png" alt="CertifyGRC Logo" className="h-7 w-auto object-contain" />
            </div>
          </div>

        </div>

        {/* Search Bar - Hidden on mobile */}
        <div className="hidden md:flex flex-1 mx-8 max-w-xl">
          <div ref={searchWrapRef} className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search controls, risks, evidence, reviews, users..."
              className="pl-10 bg-secondary/10 border-secondary/20"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
            />

            {isSearchOpen && searchQuery.trim().length > 0 && (
              <div className="absolute top-[110%] left-0 right-0 rounded-md border border-border bg-popover text-popover-foreground shadow-lg z-50 max-h-[420px] overflow-auto">
                {isSearching ? (
                  <div className="px-3 py-3 text-xs text-muted-foreground">Searching...</div>
                ) : searchState.error ? (
                  <div className="px-3 py-3 text-xs text-destructive">{searchState.error}</div>
                ) : searchState.results.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-muted-foreground">No results found</div>
                ) : (
                  <div className="py-1">
                    {(Object.keys(groupedResults) as SearchEntityType[]).map((group) => {
                      const entries = groupedResults[group];
                      if (entries.length === 0) return null;
                      return (
                        <div key={group} className="border-b border-border last:border-b-0">
                          <div className="px-3 py-1.5 text-[11px] text-muted-foreground">{group}</div>
                          {entries.slice(0, 6).map((item) => (
                            <button
                              key={item.id}
                              className="w-full text-left px-3 py-2 hover:bg-accent/50 transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectResult(item);
                              }}
                            >
                              <div className="text-sm font-medium text-foreground">
                                {highlightMatch(item.title, debouncedQuery)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {highlightMatch(item.subtitle, debouncedQuery)}
                              </div>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-destructive">
                  {notifications}
                </Badge>
              )}
            </Button>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt="avatar"
                    style={{ width: 24, height: 24, borderRadius: 999, objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "var(--color-purple-bg)",
                      color: "var(--color-purple-text)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 500,
                      fontSize: 11,
                    }}
                  >
                    {getInitials(currentUser?.fullName)}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">
                  {currentUser?.fullName || "User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentUser?.title || ""}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate("/profile")}>
                <User className="h-4 w-4 mr-2" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/frameworks")}>
                <Shield className="h-4 w-4 mr-2" />
                <span>Frameworks</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onSelect={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
