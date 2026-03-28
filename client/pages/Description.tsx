import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Lock, Eye, Download, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { AssessmentCardEngine } from "@/components/AssessmentCardEngine";
import { AssessmentFooterMetrics } from "@/components/AssessmentFooterMetrics";
import { AssessmentDashboard } from "@/components/AssessmentDashboard";
import { CategoryListView } from "@/components/CategoryListView";
import { SprintPromptModal } from "@/components/SprintPromptModal";
import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";

export default function Description() {
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
  } = useAssessmentEngine();

  const globalMetrics = getGlobalMetrics();

  return (
    <div className="p-4 md:p-8 space-y-8">
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
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Recently updated assessment progress</p>
              <div className="mt-4 space-y-3">
                <div className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <p className="font-medium text-sm">NIST CSF 2.0 Assessment</p>
                  <p className="text-xs text-muted-foreground mt-1">Last accessed today</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
