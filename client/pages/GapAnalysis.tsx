import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";
import { useGapRemediation } from "@/hooks/useGapRemediation";
import { useRevisionControls } from "@/hooks/useRevisionControls";
import { useContinuousImprovement } from "@/hooks/useContinuousImprovement";
import { useRiskAssessment } from "@/hooks/useRiskAssessment";
import { AssessmentQuestion } from "@/lib/assessmentQuestions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, AlertTriangle, CheckCircle, TrendingUp, AlertCircle } from "lucide-react";
import { GapDetailView } from "@/components/GapDetailView";
import { RevisionDetailView } from "@/components/RevisionDetailView";
import { TreatedGapsList } from "@/components/TreatedGapsList";
import { InProgressGapsList } from "@/components/InProgressGapsList";
import { useAuth } from "@/context/AuthContext";
import { setReadOnlyInteractiveState } from "@/lib/readOnlyDom";

export default function GapAnalysis() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const PAGE_KEY = "gapAnalysis" as const;
  const canView = hasPermission(PAGE_KEY, "view");
  const canEdit = hasPermission(PAGE_KEY, "edit");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { allQuestions, getQuestionsWithGapFlag } = useAssessmentEngine();
  const { allRemediations } = useGapRemediation();
  const { isLoaded } = useRevisionControls();
  const { getCIRecord } = useContinuousImprovement();
  const { resetToPending } = useRiskAssessment();
  const [searchTerm, setSearchTerm] = useState("");
  const [functionFilter, setFunctionFilter] = useState<string>("all");
  const [selectedGap, setSelectedGap] = useState<AssessmentQuestion | null>(
    null,
  );
  const [selectedRevisionControlId, setSelectedRevisionControlId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<string>("table");
  const [revisionControls, setRevisionControls] = useState<any[]>([]);

  // Handle query parameter to show Revision tab when navigating from Improvement
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("tab") === "revision") {
      setActiveTab("revision");
    }
  }, [location.search]);

  // Open a specific control from Continuous Improvement queue.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const controlId = params.get("controlId");
    if (!controlId) return;

    const question = allQuestions.find((q) => q.id === controlId);
    if (question) {
      setSelectedGap(question);
      setActiveTab("table");
    }
  }, [location.search, allQuestions]);

  // Function to load revision controls from localStorage
  const loadRevisionControls = useCallback(() => {
    try {
      const stored = localStorage.getItem("revision_controls_data");
      console.log("🔍 Reading revision_controls_data from localStorage:", { stored: !!stored });

      if (stored) {
        const data = JSON.parse(stored);
        console.log("📦 Parsed data:", data);

        // Convert from Map entries format to array
        if (Array.isArray(data) && data.length > 0) {
          const controls = data.map(([controlId, control]: [string, any]) => {
            console.log(`  - Mapping control ${controlId}:`, control);
            return {
              controlId,
              ...control,
            };
          });
          setRevisionControls(controls);
          console.log(`✅ Loaded ${controls.length} revision controls from localStorage:`, controls);
        } else {
          setRevisionControls([]);
          console.log("📂 Revision controls data is empty array");
        }
      } else {
        setRevisionControls([]);
        console.log("📂 No revision_controls_data in localStorage");
      }
    } catch (e) {
      console.error("❌ Failed to load revision controls:", e);
      setRevisionControls([]);
    }
  }, []);

  // Load revision controls when component mounts
  useEffect(() => {
    loadRevisionControls();
  }, [loadRevisionControls]);

  // Listen for storage changes to reload revision controls if they change
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "revision_controls_data") {
        console.log("📡 Storage event detected for revision_controls_data, reloading...");
        loadRevisionControls();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loadRevisionControls]);

  // Listen for custom event when revision controls are updated in the same tab
  useEffect(() => {
    const handleRevisionControlsUpdated = (event: any) => {
      console.log("🔔 Custom event received: revisionControlsUpdated", event.detail);
      // Small delay to ensure localStorage is updated
      setTimeout(() => {
        loadRevisionControls();
      }, 100);
    };

    window.addEventListener("revisionControlsUpdated", handleRevisionControlsUpdated);
    return () => window.removeEventListener("revisionControlsUpdated", handleRevisionControlsUpdated);
  }, [loadRevisionControls]);

  // Get questions with computed gap_flag (true if answer is 'Partial' or 'No')
  const questionsWithGapFlag = getQuestionsWithGapFlag();

  // Filter to show only gaps (gap_flag = true)
  const gapQuestions = useMemo(() => {
    return questionsWithGapFlag.filter((q) => q.gap_flag === true);
  }, [questionsWithGapFlag]);

  // Filter to show only "Open" gaps (not "Draft" or "Treated")
  // WORKFLOW TRANSITION: Gaps automatically removed from Active view when status changes to Draft or Treated
  const activeGaps = useMemo(() => {
    return gapQuestions.filter((q) => {
      const remediation = allRemediations[q.id];
      // Show ONLY if:
      // 1. No remediation exists yet (status = "Open" by default), OR
      // 2. Explicit status is "Open"
      // EXCLUDE: Draft (in progress) and Treated (completed)
      return !remediation || remediation.status === "Open";
    });
  }, [gapQuestions, allRemediations]);

  // Filter to show only "Draft" gaps (in progress)
  const draftGaps = useMemo(() => {
    return gapQuestions.filter((q) => {
      const remediation = allRemediations[q.id];
      return remediation && remediation.status === "Draft";
    });
  }, [gapQuestions, allRemediations]);

  // Filter to show only "Treated" gaps
  const treatedGaps = useMemo(() => {
    return gapQuestions.filter((q) => {
      const remediation = allRemediations[q.id];
      return remediation && remediation.status === "Treated";
    });
  }, [gapQuestions, allRemediations]);

  // Apply search and function filters to active gaps only
  const filteredGaps = useMemo(() => {
    return activeGaps.filter((gap) => {
      const matchesSearch =
        gap.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gap.nist_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gap.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFunction =
        functionFilter === "all" || gap.function === functionFilter;
      return matchesSearch && matchesFunction;
    });
  }, [activeGaps, searchTerm, functionFilter]);

  // Calculate metrics from active gaps only
  const metrics = useMemo(() => {
    const total = activeGaps.length;
    const byFunction: Record<string, number> = {};
    const byAnswer: Record<string, number> = {};

    activeGaps.forEach((gap) => {
      byFunction[gap.function] = (byFunction[gap.function] || 0) + 1;
      byAnswer[gap.userAnswer || "Unknown"] =
        (byAnswer[gap.userAnswer || "Unknown"] || 0) + 1;
    });

    return { total, byFunction, byAnswer };
  }, [activeGaps]);

  const NIST_FUNCTIONS = [
    "GOVERN",
    "IDENTIFY",
    "PROTECT",
    "DETECT",
    "RESPOND",
    "RECOVER",
  ];

  const isRevisionItem = useCallback(
    (controlId: string) => {
      const ciRecord = getCIRecord(controlId);
      return !!ciRecord && ciRecord.status !== "resubmitted";
    },
    [getCIRecord]
  );

  const getAnswerColor = (answer: string | null) => {
    if (answer === "No")
      return "bg-destructive/10 text-destructive border-destructive/20";
    if (answer === "Partial")
      return "bg-orange-500/10 text-orange-700 border-orange-500/20";
    return "bg-muted text-muted-foreground";
  };

  const getMaturityColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score === 1) return "text-destructive";
    if (score === 2) return "text-orange-600";
    if (score === 3) return "text-blue-600";
    if (score >= 4) return "text-green-600";
    return "text-muted-foreground";
  };

  useEffect(() => {
    if (!canView) navigate("/", { replace: true });
  }, [canView, navigate]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!canEdit) setReadOnlyInteractiveState(containerRef.current, true);
  }, [canEdit]);

  // Show detail view if a gap is selected
  if (selectedGap) {
    return (
      <div ref={containerRef} className="p-4 md:p-8">
        {canView && !canEdit && (
          <div
            style={{
              padding: "9px 14px",
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 13,
              background: "var(--color-info-bg)",
              color: "var(--color-info-text)",
              border: "0.5px solid var(--color-info-text)",
            }}
          >
            You have view-only access to this page. Contact your administrator to request edit access.
          </div>
        )}
        <GapDetailView
          gap={selectedGap}
          onBack={() => setSelectedGap(null)}
          isRevision={isRevisionItem(selectedGap.id)}
          revisionComment={(() => {
            const ciRecord = getCIRecord(selectedGap.id);
            if (!ciRecord) return undefined;

            // Prefer dedicated gap comment when available
            if (ciRecord.auditorGapComment) return ciRecord.auditorGapComment;

            // Fallback: parse overall/legacy aggregate and strip risk-specific segments
            const source =
              ciRecord.auditorOverallComment || ciRecord.auditorComment || "";
            if (!source) return undefined;

            return source
              .split(" | ")
              .map((part) => part.trim())
              .filter(
                (part) =>
                  part &&
                  !part.toLowerCase().startsWith("risk comments:") &&
                  !part.toLowerCase().startsWith("risk assessment comments:") &&
                  !part.toLowerCase().includes("risk comment:")
              )
              .join(" | ");
          })()}
          onDraftSaved={() => {
            setSelectedGap(null);
            setActiveTab("in-progress");
          }}
          onRevisionComplete={() => {
            // Revision remediation submitted — reset the existing risk back to "Pending"
            // so it reappears in the Risk Assessment pending list for rework.
            resetToPending(selectedGap.id);
            setSelectedGap(null);
          }}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="p-4 md:p-8 space-y-8">
      {canView && !canEdit && (
        <div
          style={{
            padding: "9px 14px",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            background: "var(--color-info-bg)",
            color: "var(--color-info-text)",
            border: "0.5px solid var(--color-info-text)",
          }}
        >
          You have view-only access to this page. Contact your administrator to request edit access.
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gap Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Review identified gaps and manage remediation efforts
          </p>
        </div>
      </div>

      {/* Status Alert */}
      {activeGaps.length === 0 ? (
        <div className="bg-green-50 border border-green-500/50 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-900">No Open Gaps</p>
            <p className="text-sm text-green-700 mt-1">
              All active gaps have been remediated and moved to Treated Gaps
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 border border-orange-500/50 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-orange-900">
              {activeGaps.length} Active Gaps
            </p>
            <p className="text-sm text-orange-700 mt-1">
              These gaps are open and waiting to be remediated
            </p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">
              Total Gaps
            </p>
            <p className="text-3xl font-bold mt-2">{metrics.total}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Requiring attention
            </p>
          </CardContent>
        </Card>

        {Object.entries(metrics.byAnswer).map(([answer, count]) => (
          <Card key={answer}>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Answer: {answer}
              </p>
              <p className="text-3xl font-bold mt-2">{count}</p>
              <p className="text-xs text-muted-foreground mt-2">Questions</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="table">Active Gaps</TabsTrigger>
          <TabsTrigger value="by-function">By Function</TabsTrigger>
          <TabsTrigger value="in-progress">
            In-Progress
            {draftGaps.length > 0 && (
              <span className="ml-2 text-xs bg-blue-600 text-white rounded-full px-2 py-0.5">
                {draftGaps.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="treated">
            Treated Gaps
            {treatedGaps.length > 0 && (
              <span className="ml-2 text-xs bg-green-600 text-white rounded-full px-2 py-0.5">
                {treatedGaps.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Gap Table Tab */}
        <TabsContent value="table" className="space-y-6">
          {/* Search and Filter */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by question, NIST ID, or category..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 flex-wrap overflow-x-auto">
              <Button
                variant={functionFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFunctionFilter("all")}
              >
                All Functions
              </Button>
              {NIST_FUNCTIONS.map((func) => (
                <Button
                  key={func}
                  variant={functionFilter === func ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFunctionFilter(func)}
                >
                  {func}
                </Button>
              ))}
            </div>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="pt-6">
              {filteredGaps.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No gaps match the selected filters
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">
                          NIST ID
                        </th>
                        <th className="text-left py-3 px-4 font-semibold">
                          Question
                        </th>
                        <th className="text-left py-3 px-4 font-semibold">
                          Category
                        </th>
                        <th className="text-left py-3 px-4 font-semibold">
                          Function
                        </th>
                        <th className="text-center py-3 px-4 font-semibold">
                          Answer
                        </th>
                        <th className="text-center py-3 px-4 font-semibold">
                          Maturity
                        </th>
                        <th className="text-center py-3 px-4 font-semibold">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGaps.map((gap) => (
                        <tr
                          key={gap.id}
                          className="border-b hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                {gap.nist_id}
                              </code>
                              {isRevisionItem(gap.id) && (
                                <Badge className="text-[10px] bg-red-100 text-red-700 border border-red-200">
                                  REVISION
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 max-w-sm">
                            <p className="text-sm leading-tight">
                              {gap.question}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-xs text-muted-foreground">
                              {gap.category}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="outline" className="text-xs">
                              {gap.function}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge
                              variant="outline"
                              className={`text-xs ${getAnswerColor(gap.userAnswer)}`}
                            >
                              {gap.userAnswer || "Not Answered"}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`font-semibold ${getMaturityColor(gap.maturityScore)}`}
                            >
                              {gap.maturityScore}/5
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedGap(gap)}
                            >
                              Open
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Info */}
          <p className="text-sm text-muted-foreground">
            Showing {filteredGaps.length} of {activeGaps.length} open gaps
          </p>
        </TabsContent>

        {/* By Function Tab */}
        <TabsContent value="by-function" className="space-y-6">
          {NIST_FUNCTIONS.filter((func) => metrics.byFunction[func]).map(
            (func) => {
              const functionGaps = activeGaps.filter(
                (q) => q.function === func,
              );
              return (
                <Card key={func}>
                  <CardHeader>
                    <CardTitle className="text-lg">{func}</CardTitle>
                    <CardDescription>
                      {functionGaps.length} gap
                      {functionGaps.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {functionGaps.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground text-sm">
                            All gaps in {func} have been treated
                          </p>
                        </div>
                      ) : (
                        functionGaps.map((gap) => (
                          <div
                            key={gap.id}
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                    {gap.nist_id}
                                  </code>
                                  {isRevisionItem(gap.id) && (
                                    <Badge className="text-[10px] bg-red-100 text-red-700 border border-red-200">
                                      REVISION
                                    </Badge>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getAnswerColor(gap.userAnswer)}`}
                                  >
                                    {gap.userAnswer || "Not Answered"}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium leading-tight mb-1">
                                  {gap.question}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {gap.category}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                                <p
                                  className={`text-lg font-bold ${getMaturityColor(gap.maturityScore)}`}
                                >
                                  {gap.maturityScore !== null ? `${gap.maturityScore}/5` : "Not Answered"}
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedGap(gap)}
                                >
                                  Open
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            },
          )}
        </TabsContent>

        {/* In-Progress Tab */}
        <TabsContent value="in-progress" className="space-y-6">
          <InProgressGapsList
            searchTerm={searchTerm}
            functionFilter={functionFilter}
            onResume={(gap) => setSelectedGap(gap)}
          />
        </TabsContent>

        {/* Treated Gaps Tab */}
        <TabsContent value="treated" className="space-y-6">
          <TreatedGapsList
            searchTerm={searchTerm}
            functionFilter={functionFilter}
          />
        </TabsContent>

        {/* Revision Tab */}
        <TabsContent value="revision" className="space-y-6">
          {selectedRevisionControlId ? (
            <RevisionDetailView
              revisionControlId={selectedRevisionControlId}
              onBack={() => setSelectedRevisionControlId(null)}
            />
          ) : (
            <>
              {/* Search and Filter */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by question, NIST ID, or category..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 flex-wrap overflow-x-auto">
                  <Button
                    variant={functionFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFunctionFilter("all")}
                  >
                    All Functions
                  </Button>
                  {NIST_FUNCTIONS.map((func) => (
                    <Button
                      key={func}
                      variant={functionFilter === func ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFunctionFilter(func)}
                    >
                      {func}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Revision Controls List */}
              {revisionControls.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No controls require revision at this time
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {revisionControls
                    .filter((revision) => {
                      const matchesSearch =
                        revision.nistId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        revision.controlTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        revision.category.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesFunction =
                        functionFilter === "all" || revision.function === functionFilter;
                      return matchesSearch && matchesFunction;
                    })
                    .map((revision) => (
                      <Card key={revision.controlId} className="border-orange-200 bg-orange-50/50">
                        <CardContent className="pt-6 space-y-4">
                          {/* Auditor Comment Banner */}
                          {revision.auditorComment && (
                            <div className="p-4 bg-orange-100 border border-orange-300 rounded-lg flex gap-3">
                              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-orange-900">
                                  Returned for revision by auditor
                                </p>
                                <p className="text-sm text-orange-800 mt-2">
                                  {revision.auditorComment}
                                </p>
                                {revision.auditorScore && (
                                  <p className="text-xs text-orange-700 mt-2">
                                    Auditor Score: <span className="font-semibold">{revision.auditorScore}/5</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Control Details */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                  {revision.nistId}
                                </code>
                                <Badge variant="outline" className="text-xs">
                                  {revision.function}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium leading-tight mb-1">
                                {revision.controlTitle}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {revision.category}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRevisionControlId(revision.controlId)}
                            >
                              Open
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
