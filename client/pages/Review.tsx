import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";
import { useAuditorVerification } from "@/hooks/useAuditorVerification";
import { useGapRemediation } from "@/hooks/useGapRemediation";
import { useRiskAssessment } from "@/hooks/useRiskAssessment";
import { useContinuousImprovement } from "@/hooks/useContinuousImprovement";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AuditVerificationGauge } from "@/components/AuditVerificationGauge";
import { AuditorControlCard } from "@/components/AuditorControlCard";
import { Search, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { setReadOnlyInteractiveState } from "@/lib/readOnlyDom";

export default function Review() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { hasPermission } = useAuth();
  const PAGE_KEY = "review" as const;
  const canView = hasPermission(PAGE_KEY, "view");
  const canEdit = hasPermission(PAGE_KEY, "edit");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { allQuestions } = useAssessmentEngine();
  const {
    // getOrCreateVerification,
    approveControl,
    requestRevision,
    updateOverallComment,
    addCommentBubble,
    removeCommentBubble,
    getVerification,
    metrics,
    updateAuditorMaturityScore,
    updateSectionAuditorScore,
    isLoaded,
  } = useAuditorVerification();
  const { allRemediations } = useGapRemediation();
  const { getRiskAssessmentByQuestionId } = useRiskAssessment();
  const { createOrUpdateCIRecord } = useContinuousImprovement();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedAccordion, setExpandedAccordion] = useState<string | undefined>();

  // ✅ FIX 1: removed getAllVerifications from deps — it creates a new reference
  // every render and was causing the loop. getVerification is sufficient.
  const questionsWithGaps = useMemo(() => {
    if (!isLoaded) return [];
    return allQuestions.filter((q) => {
      const verification = getVerification(q.id);
      return verification && verification.reviewStatus === "Pending Review";
    });
  }, [allQuestions, getVerification, isLoaded]);

  // ✅ FIX 2: removed the useEffect that called markAsSubmittedForAuditing on every
  // questionsWithGaps change — it was calling setVerifications which triggered the
  // save effect which triggered a re-render which re-ran this effect = infinite loop.
  // The data already has isSubmittedForAuditing: true when submitted from Report Modal.

  const groupedByFunction = useMemo(() => {
    const groups: Record<string, typeof allQuestions> = {};
    questionsWithGaps.forEach((question) => {
      if (!groups[question.function]) {
        groups[question.function] = [];
      }
      groups[question.function].push(question);
    });
    return groups;
  }, [questionsWithGaps]);

  const filteredGroups = useMemo(() => {
    const filtered: Record<string, typeof allQuestions> = {};
    Object.entries(groupedByFunction).forEach(([func, questions]) => {
      const matches = questions.filter((q) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          q.nist_id.toLowerCase().includes(searchLower) ||
          q.question.toLowerCase().includes(searchLower) ||
          q.category.toLowerCase().includes(searchLower)
        );
      });
      if (matches.length > 0) {
        filtered[func] = matches;
      }
    });
    return filtered;
  }, [groupedByFunction, searchTerm]);

  const functionCompletion = useMemo(() => {
    const completion: Record<string, { reviewed: number; total: number }> = {};
    Object.entries(groupedByFunction).forEach(([func, questions]) => {
      const reviewed = questions.filter((q) => {
        const verification = getVerification(q.id);
        return verification?.status === "approved";
      }).length;
      completion[func] = { reviewed, total: questions.length };
    });
    return completion;
  }, [groupedByFunction, getVerification]);

  const kpiStats = useMemo(() => {
    const totalControls = questionsWithGaps.length;
    const reviewed = questionsWithGaps.filter((q) => {
      const verification = getVerification(q.id);
      return verification?.status === "approved";
    }).length;
    const pending = totalControls - reviewed;
    const revisionRequested = questionsWithGaps.filter((q) => {
      const verification = getVerification(q.id);
      return verification?.status === "revision_requested";
    }).length;
    return { totalControls, reviewed, pending, revisionRequested };
  }, [questionsWithGaps, getVerification]);

  const handleApprove = (questionId: string) => {
    approveControl(questionId);
  };

  const handleRequestRevision = (questionId: string, overallComment: string) => {
    requestRevision(questionId, overallComment);
    const question = allQuestions.find((q) => q.id === questionId);
    const verification = getVerification(questionId);
    if (question && verification) {
      const latestInitialComment = verification.assessmentEvidenceComments?.length
        ? verification.assessmentEvidenceComments[verification.assessmentEvidenceComments.length - 1].text
        : "";
      const latestGapComment = verification.gapComments?.length
        ? verification.gapComments[verification.gapComments.length - 1].text
        : "";
      const latestRiskComment = verification.riskComments?.length
        ? verification.riskComments[verification.riskComments.length - 1].text
        : "";
      createOrUpdateCIRecord(
        questionId,
        question.nist_id,
        question.question,
        question.category,
        question.function,
        verification.auditorOverallComment ?? overallComment,
        verification.auditorMaturityScore,
        latestInitialComment,
        latestGapComment,
        latestRiskComment,
        verification.initialAuditorScore,
        verification.remediationAuditorScore,
        verification.riskAuditorScore
      );
      console.log(`✅ Created CI record for ${question.nist_id}`);
    }
  };

  const handleAddCommentBubble = (
    questionId: string,
    section: "assessmentEvidence" | "remediationEvidence" | "gap" | "risk",
    text: string
  ) => {
    addCommentBubble(questionId, section, text);
  };

  const handleRemoveCommentBubble = (
    questionId: string,
    section: "assessmentEvidence" | "remediationEvidence" | "gap" | "risk",
    commentId: string
  ) => {
    removeCommentBubble(questionId, section, commentId);
  };

  const handleUpdateAuditorMaturityScore = (questionId: string, score: number) => {
    updateAuditorMaturityScore(questionId, score);
  };

  const handleUpdateSectionAuditorScore = (
    questionId: string,
    section: "initial" | "remediation" | "risk",
    score: number
  ) => {
    updateSectionAuditorScore(questionId, section, score);
  };

  const functions = Object.keys(filteredGroups).sort();

  useEffect(() => {
    if (!canView) navigate("/", { replace: true });
  }, [canView, navigate]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!canEdit) setReadOnlyInteractiveState(containerRef.current, true);
  }, [canEdit]);

  useEffect(() => {
    const q = params.get("q");
    if (q) setSearchTerm(q);
  }, [params]);

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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Auditor Workspace</h1>
            <p className="text-muted-foreground mt-2">
              Verify and approve controls from the NIST Assessment
            </p>
          </div>
        </div>

        {/* Verification Progress Dashboard */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <Card className="h-full">
              <CardContent className="pt-6 flex items-center justify-center">
                <AuditVerificationGauge
                  percentage={metrics.verificationPercentage}
                  label="Verification Progress"
                />
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-3 grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Total Controls</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{kpiStats.totalControls}</p>
                <p className="text-xs text-muted-foreground mt-2">Controls to verify</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Controls Reviewed</p>
                </div>
                <p className="text-3xl font-bold text-green-600">{kpiStats.reviewed}</p>
                <p className="text-xs text-muted-foreground mt-2">Approved</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                </div>
                <p className="text-3xl font-bold text-orange-600">{kpiStats.pending}</p>
                <p className="text-xs text-muted-foreground mt-2">Awaiting approval</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by NIST ID, Control Name, or Category..."
            className="pl-10 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Controls by Function */}
        {functions.length > 0 ? (
          <Accordion
            type="single"
            collapsible
            value={expandedAccordion}
            onValueChange={setExpandedAccordion}
            className="space-y-3"
          >
            {functions.map((func) => {
              const questions = filteredGroups[func];
              const completion = functionCompletion[func];
              const isComplete =
                completion.total > 0 && completion.reviewed === completion.total;

              return (
                <AccordionItem
                  key={func}
                  value={func}
                  className="border rounded-lg data-[state=open]:bg-gray-50"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{func}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {completion.reviewed}/{completion.total} Reviewed{" "}
                          {isComplete && (
                            <Badge className="ml-2 bg-green-100 text-green-700 border-0">
                              Complete
                            </Badge>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{
                              width: `${
                                completion.total > 0
                                  ? (completion.reviewed / completion.total) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600 w-8">
                          {completion.total > 0
                            ? Math.round((completion.reviewed / completion.total) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="p-4 space-y-3">
                    {questions.map((question) => {
                      // ✅ FIX 3: removed getOrCreateVerification from render —
                      // calling setVerifications during render causes re-render loops.
                      // Use getVerification only; skip rendering if not found.
                      const verification = getVerification(question.id);
                      if (!verification) return null;

                      const remediation = allRemediations[question.id];
                      const riskAssessment = getRiskAssessmentByQuestionId(question.id);
                      const isSubmittedForAuditing =
                        verification.reviewStatus === "Pending Review";

                      return (
                        <AuditorControlCard
                          key={question.id}
                          question={question}
                          remediation={remediation}
                          riskAssessment={riskAssessment}
                          auditorStatus={verification.status}
                          isSubmittedForAuditing={isSubmittedForAuditing}
                          assessmentEvidenceComments={verification.assessmentEvidenceComments || []}
                          remediationEvidenceComments={verification.remediationEvidenceComments || []}
                          gapComments={verification.gapComments || []}
                          riskComments={verification.riskComments || []}
                          revisionComment=""
                          auditorOverallComment={verification.auditorOverallComment}
                          onUpdateOverallComment={(text) =>
                            updateOverallComment(question.id, text)
                          }
                          auditorMaturityScore={verification.auditorMaturityScore}
                          initialAuditorScore={verification.initialAuditorScore}
                          remediationAuditorScore={verification.remediationAuditorScore}
                          riskAuditorScore={verification.riskAuditorScore}
                          onApprove={() => handleApprove(question.id)}
                          onRequestRevision={(comment) =>
                            handleRequestRevision(question.id, comment)
                          }
                          onAddCommentBubble={(section, text) =>
                            handleAddCommentBubble(question.id, section, text)
                          }
                          onRemoveCommentBubble={(section, commentId) =>
                            handleRemoveCommentBubble(question.id, section, commentId)
                          }
                          onUpdateAuditorMaturityScore={(score) =>
                            handleUpdateAuditorMaturityScore(question.id, score)
                          }
                          onUpdateSectionAuditorScore={(section, score) =>
                            handleUpdateSectionAuditorScore(question.id, section, score)
                          }
                        />
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No controls found matching your search."
                  : "No controls to review. All assessments are complete!"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}