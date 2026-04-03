import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskPendingList } from "@/components/RiskPendingList";
import { RiskAssessmentForm } from "@/components/RiskAssessmentForm";
import { RiskRegister } from "@/components/RiskRegister";
import { useAuth } from "@/context/AuthContext";
import { setReadOnlyInteractiveState } from "@/lib/readOnlyDom";
import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";
import { useContinuousImprovement } from "@/hooks/useContinuousImprovement";

export default function RiskAssessment() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { hasPermission } = useAuth();
  const { allQuestions } = useAssessmentEngine();
  const { getCIRecord } = useContinuousImprovement();
  const PAGE_KEY = "riskAssessment" as const;
  const canView = hasPermission(PAGE_KEY, "view");
  const canEdit = hasPermission(PAGE_KEY, "edit");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedNistId, setSelectedNistId] = useState<string>("");
  const [selectedGapDescription, setSelectedGapDescription] = useState<string>("");
  const [selectedFunction, setSelectedFunction] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Force a refresh whenever the page loads
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!canView) navigate("/", { replace: true });
  }, [canView, navigate]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!canEdit) setReadOnlyInteractiveState(containerRef.current, true);
  }, [canEdit]);

  useEffect(() => {
    const qId = params.get("questionId");
    const nist = params.get("nist");
    if (!qId && !nist) return;

    const question = allQuestions.find((q) =>
      qId ? q.id === qId : q.nist_id.toLowerCase() === (nist || "").toLowerCase()
    );
    if (!question) return;

    setSelectedQuestionId(question.id);
    setSelectedNistId(question.nist_id);
    setSelectedGapDescription(question.question);
    setSelectedFunction(question.function);
    setSelectedCategory(question.category);
  }, [params, allQuestions]);

  // If viewing assessment form
  if (selectedQuestionId) {
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
        <RiskAssessmentForm
          questionId={selectedQuestionId}
          nistId={selectedNistId}
          gapDescription={selectedGapDescription}
          functionName={selectedFunction}
          category={selectedCategory}
          isRevision={
            !!selectedQuestionId &&
            !!getCIRecord(selectedQuestionId) &&
            getCIRecord(selectedQuestionId)?.status !== "resubmitted"
          }
          auditorRiskComment={getCIRecord(selectedQuestionId)?.auditorRiskComment}
          onComplete={() => setSelectedQuestionId(null)}
          onBack={() => setSelectedQuestionId(null)}
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
          <h1 className="text-3xl font-bold">Risk Assessment</h1>
          <p className="text-muted-foreground mt-2">
            Identify, assess, and manage cyber risks
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending Assessments</TabsTrigger>
          <TabsTrigger value="register">Risk Register</TabsTrigger>
        </TabsList>

        {/* Pending Assessments Tab */}
        <TabsContent value="pending" className="space-y-6 mt-6">
          <RiskPendingList
            onStartAssessment={(questionId, nistId, gapDescription, functionName, category) => {
              setSelectedQuestionId(questionId);
              setSelectedNistId(nistId);
              setSelectedGapDescription(gapDescription);
              setSelectedFunction(functionName);
              setSelectedCategory(category);
            }}
          />
        </TabsContent>

        {/* Risk Register Tab */}
        <TabsContent value="register" className="space-y-6 mt-6">
          <RiskRegister />
        </TabsContent>
      </Tabs>
    </div>
  );
}
