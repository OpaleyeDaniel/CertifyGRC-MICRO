import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Lock, Eye, Download, ChevronLeft, ChevronRight, CheckCircle, ArrowRight, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AssessmentCardEngine } from "@/components/AssessmentCardEngine";
import { AssessmentFooterMetrics } from "@/components/AssessmentFooterMetrics";
import { AssessmentDashboard } from "@/components/AssessmentDashboard";
import { CategoryListView } from "@/components/CategoryListView";
import { SprintPromptModal } from "@/components/SprintPromptModal";
import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";
import { useAuth } from "@/context/AuthContext";
import { setReadOnlyInteractiveState } from "@/lib/readOnlyDom";

export default function Assessment() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const PAGE_KEY = "assessment" as const;
  const canView = hasPermission(PAGE_KEY, "view");
  const canEdit = hasPermission(PAGE_KEY, "edit");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "recent");
  const [sprintModalOpen, setSprintModalOpen] = useState(false);
  const [pendingCategorySelection, setPendingCategorySelection] = useState<{
    function: string;
    category: string;
  } | null>(null);

  // Sync URL parameter with tab state
  useEffect(() => {
    const tabParam = searchParams.get("tab") || "recent";
    setActiveTab(tabParam);
  }, [searchParams]);

  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
    setSearchParams({ tab: tabValue });
  };

  const {
    currentView,
    currentFunction,
    currentCategory,
    currentQuestionIndex,
    filteredQuestions,
    currentQuestion,
    updateQuestionAnswer,
    updateQuestionComment,
    updateQuestionEvidence,
    updateQuestionEvidenceFileSize,
    addEvidenceFile,
    removeEvidenceFile,
    getGlobalMetrics,
    nextQuestion,
    previousQuestion,
    isAtFinalQuestion,
    isAtFirstQuestion,
    selectFunction,
    enterFocusMode,
    exitFocusMode,
    returnToDashboard,
    getRecentAssessmentProgress,
    allQuestions,
    setCurrentQuestionIndex,
  } = useAssessmentEngine();

  const globalMetrics = getGlobalMetrics();
  const recentProgress = getRecentAssessmentProgress();

  // Handler for continue/resume button
  const handleContinueAssessment = () => {
    const { currentFunction, currentCategory } = recentProgress;
    if (currentFunction && currentCategory) {
      enterFocusMode(currentFunction, currentCategory);
      setActiveTab("assessment");
    }
  };

  useEffect(() => {
    if (!canView) navigate("/", { replace: true });
  }, [canView, navigate]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!canEdit) setReadOnlyInteractiveState(containerRef.current, true);
  }, [canEdit]);

  useEffect(() => {
    const targetNist = searchParams.get("nist");
    if (!targetNist) return;

    const question = allQuestions.find(
      (q) => q.nist_id.toLowerCase() === targetNist.toLowerCase()
    );
    if (!question) return;

    enterFocusMode(question.function, question.category);
    setActiveTab("assessment");

    const idx = allQuestions
      .filter((q) => q.function === question.function && q.category === question.category)
      .findIndex((q) => q.nist_id === question.nist_id);
    if (idx >= 0) {
      setTimeout(() => setCurrentQuestionIndex(idx), 0);
    }
  }, [searchParams, allQuestions, enterFocusMode, setCurrentQuestionIndex]);

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
      <div>
        <h1 className="text-3xl font-bold">NIST CSF 2.0 Assessment & Documentation</h1>
        <p className="text-muted-foreground mt-2">Manage policies, templates, and complete your NIST assessment</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Tab Navigation */}
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="assessment">NIST Assessment</TabsTrigger>
        </TabsList>

        {/* Recent Tab */}
        <TabsContent value="recent" className="space-y-6">
          {/* Continue Assessment Dashboard */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Continue Assessment</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {recentProgress.message || "Resume your NIST CSF 2.0 assessment"}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {recentProgress.hasProgress && !recentProgress.isAssessmentComplete ? (
                <>
                  {/* Current Section Info */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Current Section</p>
                      <Badge variant="outline" className="text-base px-4 py-1.5 font-semibold">
                        {recentProgress.currentCategory}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Function: <span className="font-semibold text-foreground">{recentProgress.currentFunction}</span>
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Progress in this section</p>
                      <span className="text-sm font-semibold text-primary">
                        {recentProgress.categoryProgress.completed}/{recentProgress.categoryProgress.total}
                      </span>
                    </div>
                    <Progress
                      value={recentProgress.completionPercentage || 0}
                      className="h-2.5"
                    />
                    <p className="text-xs text-muted-foreground">
                      {recentProgress.completionPercentage || 0}% complete
                    </p>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={handleContinueAssessment}
                    size="lg"
                    className="w-full gap-2 bg-primary hover:bg-primary/90"
                  >
                    <ArrowRight className="h-4 w-4" />
                    {recentProgress.nextAction}
                  </Button>
                </>
              ) : recentProgress.isAssessmentComplete ? (
                <>
                  <div className="text-center space-y-4 py-8">
                    <div className="flex justify-center">
                      <div className="h-16 w-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8" />
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Assessment Complete!</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        You've completed all NIST CSF 2.0 assessments.
                      </p>
                    </div>
                    <Button
                      onClick={() => setActiveTab("assessment")}
                      variant="outline"
                      className="w-full"
                    >
                      View Assessment Report
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center space-y-4 py-8">
                    <p className="text-muted-foreground">No assessment progress yet</p>
                    <Button
                      onClick={handleContinueAssessment}
                      size="lg"
                      className="w-full gap-2 bg-primary hover:bg-primary/90"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Start NIST CSF 2.0 Assessment
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recently Updated Items */}
          {recentProgress.hasProgress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assessment Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="rounded-lg border p-4 bg-background">
                    <p className="text-xs font-medium text-muted-foreground">Total Questions</p>
                    <p className="text-2xl font-bold mt-1">{allQuestions.length}</p>
                  </div>
                  <div className="rounded-lg border p-4 bg-background">
                    <p className="text-xs font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold mt-1 text-green-600">
                      {globalMetrics.completed}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4 bg-background">
                    <p className="text-xs font-medium text-muted-foreground">Overall Progress</p>
                    <p className="text-2xl font-bold mt-1 text-primary">
                      {globalMetrics.completionRate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Risk Management Policy",
              "Access Control Policy",
              "Incident Response Plan",
              "Data Classification Policy",
              "Business Continuity Plan",
              "Security Training Program",
            ].map((template) => (
              <Card key={template} className="hover:border-primary transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {template}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button size="sm" variant="outline" className="w-full">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* NIST Assessment Tab */}
        <TabsContent value="assessment" className="space-y-6">
          <div className="space-y-6">
            {/* Dashboard View */}
            {currentView === "dashboard" && (
              <>
                <AssessmentDashboard
                  onSelectFunction={(functionName) => selectFunction(functionName)}
                />
                {/* Global Metrics Footer */}
                <AssessmentFooterMetrics
                  totalQuestions={globalMetrics.total}
                  completed={globalMetrics.completed}
                  detectedGaps={globalMetrics.gaps}
                  completionRate={globalMetrics.completionRate}
                  readinessScore={globalMetrics.readinessScore}
                />
              </>
            )}

            {/* Category List View */}
            {currentView === "category-list" && currentFunction && (
              <>
                <CategoryListView
                  functionName={currentFunction}
                  onBack={() => returnToDashboard()}
                  onSelectCategory={(categoryName) => {
                    setPendingCategorySelection({
                      function: currentFunction,
                      category: categoryName,
                    });
                    setSprintModalOpen(true);
                  }}
                />
                {/* Global Metrics Footer */}
                <AssessmentFooterMetrics
                  totalQuestions={globalMetrics.total}
                  completed={globalMetrics.completed}
                  detectedGaps={globalMetrics.gaps}
                  completionRate={globalMetrics.completionRate}
                  readinessScore={globalMetrics.readinessScore}
                />
              </>
            )}

            {/* Focus Mode View */}
            {currentView === "focus-mode" && currentQuestion && filteredQuestions.length > 0 && (
              <>
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <button
                    onClick={() => returnToDashboard()}
                    className="hover:text-foreground transition-colors"
                  >
                    Dashboard
                  </button>
                  <span>/</span>
                  <button
                    onClick={() => exitFocusMode()}
                    className="hover:text-foreground transition-colors"
                  >
                    {currentFunction}
                  </button>
                  <span>/</span>
                  <span className="text-foreground">{currentCategory}</span>
                </div>

                {/* Assessment Card */}
                <AssessmentCardEngine
                  question={currentQuestion}
                  onAnswerChange={(userAnswer, maturityScore) =>
                    updateQuestionAnswer(currentQuestion.nist_id, userAnswer, maturityScore)
                  }
                  onCommentChange={(comment) =>
                    updateQuestionComment(currentQuestion.nist_id, comment)
                  }
                  onEvidenceChange={(evidenceUrl) =>
                    updateQuestionEvidence(currentQuestion.nist_id, evidenceUrl)
                  }
                  onEvidenceFileSizeChange={(fileSize) =>
                    updateQuestionEvidenceFileSize(currentQuestion.nist_id, fileSize)
                  }
                  onAddEvidenceFile={(file) =>
                    addEvidenceFile(currentQuestion.nist_id, file)
                  }
                  onRemoveEvidenceFile={(fileUrl) =>
                    removeEvidenceFile(currentQuestion.nist_id, fileUrl)
                  }
                  completionRate={globalMetrics.completionRate}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={filteredQuestions.length}
                />

                {/* Navigation Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => exitFocusMode()}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Exit Focus Mode
                  </Button>

                  <div className="flex-1" />

                  <Button
                    variant="outline"
                    onClick={previousQuestion}
                    disabled={isAtFirstQuestion}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <Button
                    variant="outline"
                    onClick={nextQuestion}
                    disabled={isAtFinalQuestion}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Complete Category Button */}
                {isAtFinalQuestion && (
                  <Button
                    size="lg"
                    className="w-full gap-2 bg-[#0052CC] hover:bg-[#0052CC] text-white"
                    onClick={() => exitFocusMode()}
                  >
                    <CheckCircle className="h-5 w-5" />
                    Complete Category & Return to {currentFunction}
                  </Button>
                )}

                {/* Global Metrics Footer */}
                <AssessmentFooterMetrics
                  totalQuestions={globalMetrics.total}
                  completed={globalMetrics.completed}
                  detectedGaps={globalMetrics.gaps}
                  completionRate={globalMetrics.completionRate}
                  readinessScore={globalMetrics.readinessScore}
                />
              </>
            )}
          </div>

          {/* Sprint Prompt Modal */}
          <SprintPromptModal
            isOpen={sprintModalOpen}
            functionName={pendingCategorySelection?.function || ""}
            categoryName={pendingCategorySelection?.category || ""}
            onConfirm={() => {
              if (pendingCategorySelection) {
                enterFocusMode(
                  pendingCategorySelection.function,
                  pendingCategorySelection.category
                );
              }
              setSprintModalOpen(false);
              setPendingCategorySelection(null);
            }}
            onCancel={() => {
              setSprintModalOpen(false);
              setPendingCategorySelection(null);
            }}
          />
        </TabsContent>
      </Tabs>

    </div>
  );
}
