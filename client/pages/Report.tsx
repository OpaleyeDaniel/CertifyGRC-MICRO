import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";
import { useGapRemediation } from "@/hooks/useGapRemediation";
import { useRiskAssessment } from "@/hooks/useRiskAssessment";
import { useAuditorVerification } from "@/hooks/useAuditorVerification";
import { useContinuousImprovement } from "@/hooks/useContinuousImprovement";
import { useRevisionControls } from "@/hooks/useRevisionControls";
import { AssessmentQuestion } from "@/lib/assessmentQuestions";
import { ReportPageCard } from "@/components/ReportPageCard";
import { LifecycleModal } from "@/components/LifecycleModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Download, Eye, Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { setReadOnlyInteractiveState } from "@/lib/readOnlyDom";

const NIST_FUNCTIONS = ["GOVERN", "IDENTIFY", "PROTECT", "DETECT", "RESPOND", "RECOVER"];

export default function Report() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const PAGE_KEY = "report" as const;
  const canView = hasPermission(PAGE_KEY, "view");
  const canEdit = hasPermission(PAGE_KEY, "edit");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { allQuestions } = useAssessmentEngine();
  const { allRemediations, updateRemediation } = useGapRemediation();
  const { allRiskAssessments } = useRiskAssessment();
  const { submitForReview } = useAuditorVerification();
  const { markAsResubmitted, getCIRecord } = useContinuousImprovement();
  const { removeRevisionControl } = useRevisionControls();

  // State Management
  const [selectedQuestion, setSelectedQuestion] = useState<AssessmentQuestion | null>(null);
  const [showAllControls, setShowAllControls] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFunction, setActiveFunction] = useState("GOVERN");

  // Filter questions: show only answered or draft by default
  const visibleQuestions = useMemo(() => {
    let questions = allQuestions;

    // Apply visibility filter
    if (!showAllControls) {
      questions = questions.filter((q) => {
        const remediation = allRemediations[q.id];
        // Show if: has answer OR is in Draft status
        return q.userAnswer || (remediation && remediation.status === "Draft");
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      questions = questions.filter(
        (q) =>
          q.nist_id.toLowerCase().includes(query) ||
          q.question.toLowerCase().includes(query) ||
          q.category.toLowerCase().includes(query)
      );
    }

    return questions;
  }, [allQuestions, allRemediations, showAllControls, searchQuery]);

  // Group questions by function
  const questionsByFunction = useMemo(() => {
    const grouped: Record<string, AssessmentQuestion[]> = {};

    NIST_FUNCTIONS.forEach((func) => {
      grouped[func] = visibleQuestions.filter((q) => q.function === func);
    });

    return grouped;
  }, [visibleQuestions]);

  // Statistics
  const stats = useMemo(() => {
    const total = visibleQuestions.length;
    const answered = visibleQuestions.filter((q) => q.userAnswer).length;
    const gaps = visibleQuestions.filter(
      (q) => q.userAnswer && (q.userAnswer === "Partial" || q.userAnswer === "No")
    ).length;
    const withEvidence = visibleQuestions.filter((q) => {
      const remediation = allRemediations[q.id];
      return remediation && remediation.evidenceFiles && remediation.evidenceFiles.length > 0;
    }).length;

    return { total, answered, gaps, withEvidence };
  }, [visibleQuestions, allRemediations]);

  // Get remediation for a question
  const getRemediation = (questionId: string) => allRemediations[questionId];

  // Get risk assessment for a question
  const getRiskAssessment = (questionId: string) =>
    Object.values(allRiskAssessments).find((risk) => risk.questionId === questionId);

  const handleSubmitForReview = (questionId: string, nistId: string) => {
    submitForReview(questionId, nistId);

    // A returned control leaves Continuous Improvement only when it reaches Pending Review.
    if (getCIRecord(questionId)) {
      markAsResubmitted(questionId);
      removeRevisionControl(questionId);
    }
  };

  // Handle file removal
  const handleRemoveFile = (fileName: string) => {
    if (!selectedQuestion) return;

    const remediation = getRemediation(selectedQuestion.id);
    if (!remediation || !remediation.evidenceFiles) return;

    const updatedFiles = remediation.evidenceFiles.filter((f) => f.name !== fileName);

    // Update remediation with files removed
    updateRemediation(selectedQuestion.id, {
      evidenceFiles: updatedFiles,
    });
  };

  // Handle file view/download
  const handleViewFile = (file: any) => {
    if (!file.data && !file.url) return;

    try {
      // If file has a data URL or blob data, create a downloadable link
      if (file.data) {
        const link = document.createElement("a");
        link.href = file.data;
        link.download = file.name || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      // If file has a URL (e.g., cloud storage), open in new tab
      else if (file.url) {
        window.open(file.url, "_blank");
      }
    } catch (error) {
      console.error("Error viewing file:", error);
    }
  };

  const currentFunctionQuestions = questionsByFunction[activeFunction] || [];
  const hasContent = Object.values(questionsByFunction).some((qs) => qs.length > 0);

  useEffect(() => {
    if (!canView) navigate("/", { replace: true });
  }, [canView, navigate]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!canEdit) setReadOnlyInteractiveState(containerRef.current, true);
  }, [canEdit]);

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 md:p-8">
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
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Audit Report</h1>
              <p className="text-muted-foreground mt-2">
                Comprehensive NIST CSF 2.0 Control Lifecycle & Evidence Audit
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
              <Button variant="outline" className="gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-white">
              <p className="text-xs font-medium text-muted-foreground mb-1">Total Controls</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </Card>
            <Card className="p-4 bg-white">
              <p className="text-xs font-medium text-muted-foreground mb-1">Answered</p>
              <p className="text-2xl font-bold text-green-600">{stats.answered}</p>
            </Card>
            <Card className="p-4 bg-white">
              <p className="text-xs font-medium text-muted-foreground mb-1">Gaps Identified</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.gaps}</p>
            </Card>
            <Card className="p-4 bg-white">
              <p className="text-xs font-medium text-muted-foreground mb-1">With Evidence</p>
              <p className="text-2xl font-bold text-purple-600">{stats.withEvidence}</p>
            </Card>
          </div>
        </div>

        {/* Controls & Filters */}
        <Card className="bg-white p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by NIST ID, question, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Toggle Show All Controls */}
            <div className="flex items-center gap-3 px-4 py-2 border rounded-lg">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <label htmlFor="show-all" className="text-sm font-medium cursor-pointer">
                Show All Controls
              </label>
              <Switch
                id="show-all"
                checked={showAllControls}
                onCheckedChange={setShowAllControls}
              />
            </div>
          </div>

          {/* Info Message */}
          {!showAllControls && (
            <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded p-3">
               Currently showing {stats.answered} answered controls. Toggle "Show All Controls" to
              include {allQuestions.length - stats.total} unanswered questions.
            </div>
          )}
        </Card>

        {/* Main Tabs by Function */}
        <Tabs
          defaultValue="GOVERN"
          value={activeFunction}
          onValueChange={setActiveFunction}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-white p-2 rounded-lg shadow-sm">
            {NIST_FUNCTIONS.map((func) => {
              const count = questionsByFunction[func]?.length || 0;
              return (
                <TabsTrigger
                  key={func}
                  value={func}
                  className={cn(
                    "text-xs sm:text-sm font-semibold transition-colors",
                    activeFunction === func && "bg-gradient-to-r from-blue-700 to-blue-700 text-white",
                  )}
                >
                  <div className="flex items-center gap-1">
                    <span>{func}</span>
                    {count > 0 && <Badge variant="secondary" className="text-xs">{count}</Badge>}
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Content for Each Function */}
          {NIST_FUNCTIONS.map((func) => {
            const funcQuestions = questionsByFunction[func] || [];

            return (
              <TabsContent key={func} value={func} className="space-y-4 mt-6">
                {funcQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {funcQuestions.map((question) => {
                      const isDisabled = !question.userAnswer && !showAllControls;
                      const remediation = getRemediation(question.id);
                      const riskAssessment = getRiskAssessment(question.id);

                      return (
                        <ReportPageCard
                          key={question.id}
                          question={question}
                          remediation={remediation}
                          riskAssessment={riskAssessment}
                          isDisabled={isDisabled}
                          onClick={() => setSelectedQuestion(question)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <p className="text-muted-foreground">
                      {showAllControls
                        ? `No controls available for ${func} in the current view`
                        : `No answered controls for ${func}. Toggle "Show All Controls" to see all.`}
                    </p>
                  </Card>
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Empty State */}
        {!hasContent && (
          <Card className="p-16 text-center bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">No Controls to Display</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {showAllControls
                  ? "Begin your NIST CSF 2.0 assessment to populate the audit report."
                  : "Toggle 'Show All Controls' to see all available controls, or answer questions to see results."}
              </p>
              <Button variant="outline">Start Assessment</Button>
            </div>
          </Card>
        )}
      </div>

      {/* Lifecycle Modal */}
      <LifecycleModal
        isOpen={selectedQuestion !== null}
        question={selectedQuestion}
        remediation={selectedQuestion ? getRemediation(selectedQuestion.id) : undefined}
        riskAssessment={selectedQuestion ? getRiskAssessment(selectedQuestion.id) : undefined}
        onClose={() => setSelectedQuestion(null)}
        onRemoveFile={handleRemoveFile}
        onViewFile={handleViewFile}
        onSubmitForReview={handleSubmitForReview}
      />
    </div>
  );
}
