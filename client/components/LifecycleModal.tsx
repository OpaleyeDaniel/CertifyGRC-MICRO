import { useState, useCallback, useMemo } from "react";
import { AssessmentQuestion } from "@/lib/assessmentQuestions";
import { GapRemediation } from "@/lib/gapRemediationTypes";
import { RiskAssessment } from "@/lib/gapRiskTypes";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
  Check,
  Eye,
  Download,
  X,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LifecycleModalProps {
  isOpen: boolean;
  question: AssessmentQuestion | null;
  remediation?: GapRemediation;
  riskAssessment?: RiskAssessment;
  onClose: () => void;
  onRemoveFile?: (fileName: string) => void;
  onViewFile?: (file: any) => void;
  onSubmitForReview?: (questionId: string, nistId: string) => void;
}

export function LifecycleModal({
  isOpen,
  question,
  remediation,
  riskAssessment,
  onClose,
  onRemoveFile,
  onViewFile,
  onSubmitForReview,
}: LifecycleModalProps) {
  const { toast } = useToast();

  /**
   * Dynamic Quarter-Date Mapping
   * Maps quarter selection to calendar date ranges
   */
  const getQuarterDateRange = (timescale: string): string => {
    const year = new Date().getFullYear();
    const quarterMap: Record<string, string> = {
      Q1: `January 1 – March 31, ${year}`,
      Q2: `April 1 – June 30, ${year}`,
      Q3: `July 1 – September 30, ${year}`,
      Q4: `October 1 – December 31, ${year}`,
    };

    // Extract quarter from timescale (e.g., "Q3" from "Q3 2024")
    const quarterMatch = timescale.match(/Q[1-4]/);
    if (quarterMatch) {
      return quarterMatch[0] + ` (${quarterMap[quarterMatch[0]]})`;
    }

    return timescale; // Fallback if no quarter found
  };

  // Calculate risk scores
  const inherentScore = useMemo(() => {
    const likelihood = riskAssessment?.preTreatmentAssessment.likelihood;
    const impact = riskAssessment?.preTreatmentAssessment.impact;
    if (likelihood == null || impact == null) return null;
    return likelihood * impact;
  }, [riskAssessment?.preTreatmentAssessment.likelihood, riskAssessment?.preTreatmentAssessment.impact]);

  const residualScore = useMemo(() => {
    const likelihood = riskAssessment?.residualScoring.postTreatmentLikelihood;
    const impact = riskAssessment?.residualScoring.postTreatmentImpact;
    if (likelihood == null || impact == null) return null;
    return likelihood * impact;
  }, [riskAssessment?.residualScoring.postTreatmentLikelihood, riskAssessment?.residualScoring.postTreatmentImpact]);

  // Early return AFTER all hooks are called (React hook rule compliance)
  if (!question) return null;

  const getScoreColor = (score: number) => {
    if (score <= 8) return "text-green-600";
    if (score <= 14) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <DialogTitle className="text-2xl">{question.nist_id}</DialogTitle>
                <Badge variant="outline">{question.category}</Badge>
              </div>
              <DialogDescription className="text-base font-medium text-foreground">
                {question.question}
              </DialogDescription>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 overflow-y-auto">
          <div className="space-y-8 pb-8 px-1">
            {/* SECTION A: INITIAL ASSESSMENT */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  A
                </div>
                <h2 className="text-xl font-bold">Initial Assessment (The Origin)</h2>
              </div>

              <Card className="bg-blue-50 border-blue-200 p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-2">
                      Original Answer
                    </p>
                    <div className="flex items-center gap-2">
                      {(question.userAnswer === "Yes" || question.userAnswer?.startsWith("Yes")) && (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span className="font-bold text-green-600">YES</span>
                        </>
                      )}
                      {question.userAnswer === "Partial" && (
                        <>
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                          <span className="font-bold text-yellow-600">PARTIAL</span>
                        </>
                      )}
                      {question.userAnswer === "No" && (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <span className="font-bold text-red-600">NO</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-2">
                      Initial Maturity Score
                    </p>
                    <div className="text-3xl font-bold text-blue-600">{question.maturityScore}</div>
                    <p className="text-xs text-muted-foreground mt-1">on scale of 1-5</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-2">
                      Assessment Notes
                    </p>
                    <p className="text-sm bg-white rounded p-2 border border-blue-200 min-h-10 break-words whitespace-pre-wrap overflow-y-auto max-h-32">
                      {question.comment || "(No notes provided)"}
                    </p>
                  </div>
                </div>

                {/* Initial Evidence Section */}
                {(question.evidenceFiles && question.evidenceFiles.length > 0) || question.evidenceUrl ? (
                  <div className="mt-6 pt-6 border-t border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-3">
                      Initial Assessment Evidence ({(question.evidenceFiles && question.evidenceFiles.length > 0) ? question.evidenceFiles.length : 1})
                    </p>
                    <div className="space-y-2">
                      {/* New multi-file structure */}
                      {question.evidenceFiles && question.evidenceFiles.length > 0 ? (
                        question.evidenceFiles.map((file) => (
                          <div key={file.url} className="bg-white rounded-lg p-3 border border-blue-200 flex items-center justify-between hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-blue-900 truncate">{file.name}</p>
                                <p className="text-xs text-blue-700">{(file.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex-shrink-0 ml-2"
                              onClick={() => onViewFile?.({ url: file.url, name: file.name })}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </div>
                        ))
                      ) : (
                        /* Legacy single-file structure */
                        <div className="bg-white rounded-lg p-3 border border-blue-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">{question.evidenceUrl}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => onViewFile?.({ url: question.evidenceUrl!, name: question.evidenceUrl! })}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </Card>
            </div>

            {/* SECTION B: GAP ANALYSIS & REMEDIATION - Hidden for all YES answers (maturity 3, 4, 5) */}
            {!question.userAnswer?.startsWith("Yes") && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                  B
                </div>
                <h2 className="text-xl font-bold">Gap Analysis & Remediation (The Strategy)</h2>
              </div>

              {remediation ? (
                <Card className="bg-amber-50 border-amber-200 p-6">
                  <div className="space-y-6">
                    {/* Status Badge and Present Maturity Score */}
                    <div className="flex items-center gap-3 pb-4 border-b border-amber-200 justify-between flex-wrap">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">Status:</span>
                        <Badge
                          className={cn(
                            "font-bold",
                            remediation.status === "Draft"
                              ? "bg-amber-500 text-white"
                              : remediation.status === "Treated"
                                ? "bg-green-500 text-white"
                                : "bg-blue-500 text-white"
                          )}
                        >
                          {remediation.status === "Draft"
                            ? "In-Progress"
                            : remediation.status === "Treated"
                              ? "Treated"
                              : "Open"}
                        </Badge>
                      </div>

                      {/* Present Maturity Score for Treated Remediations */}
                      {remediation.status === "Treated" && (
                        (() => {
                          const initialScore = remediation.initialScore ?? question?.maturityScore;
                          const currentScore = remediation.currentScore ?? initialScore;

                          return (
                            <div className="text-right">
                              <p className="text-xs font-medium text-green-700 mb-1">
                                {currentScore !== initialScore ? "Present Maturity Score" : "Remediation Maturity Score"}
                              </p>
                              <div className="flex items-center gap-2 justify-end">
                                <p className="text-lg font-bold text-green-600">{currentScore}</p>
                                {currentScore !== initialScore && (
                                  <p className="text-xs text-green-600">
                                    ({initialScore} → {currentScore})
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </div>

                    {/* Root Cause & Action Plan */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-amber-900 mb-2">Root Cause</p>
                        <div className="bg-white rounded p-3 border border-amber-200 min-h-24 overflow-y-auto max-h-40">
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {remediation.rootCause || "(Not filled)"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-amber-900 mb-2">Action Plan</p>
                        <div className="bg-white rounded p-3 border border-amber-200 min-h-24 overflow-y-auto max-h-40">
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {remediation.actionPlan || "(Not filled)"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Timeline & Priority */}
                    <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-amber-200">
                      <div>
                        <p className="text-sm font-medium text-amber-900 mb-2">
                          Expected Completion
                        </p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-amber-600" />
                          <span className="font-semibold">
                            {remediation.expectedCompletionDate}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-amber-900 mb-2">Priority</p>
                        <Badge
                          className={cn(
                            "font-bold",
                            remediation.priority === "Critical"
                              ? "bg-red-500"
                              : remediation.priority === "High"
                                ? "bg-orange-500"
                                : remediation.priority === "Medium"
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                          )}
                        >
                          {remediation.priority}
                        </Badge>
                      </div>
                    </div>

                    {/* Early Submission Info */}
                    {(remediation as any).isEarlySubmissionRequested && (
                      <div className="pt-4 border-t border-amber-200 bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-amber-900 mb-3">
                          Early Submission Justification
                        </p>
                        <div className="bg-white rounded p-3 border border-amber-200 overflow-y-auto max-h-32">
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {(remediation as any).earlyCompletionJustification ||
                              "(Not provided)"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                <Card className="bg-gray-50 p-6 border-gray-200">
                  <p className="text-sm text-muted-foreground">
                    No remediation plan defined yet
                  </p>
                </Card>
              )}
            </div>
            )}

            {/* SECTION C: COMPREHENSIVE RISK ASSESSMENT - Hidden for all YES answers (maturity 3, 4, 5) */}
            {!question.userAnswer?.startsWith("Yes") && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                  C
                </div>
                <h2 className="text-xl font-bold">Comprehensive Risk Assessment (The Impact)</h2>
              </div>

              {riskAssessment ? (
                <div className="space-y-6">

                  {/* Risk Assessment Maturity Score - Only show if completed */}
                  {riskAssessment.status === "Completed" && riskAssessment.maturityScore !== undefined && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-900">Risk Assessment Maturity Score</span>
                        <p className="text-2xl font-bold text-purple-600">L{riskAssessment.maturityScore}</p>
                      </div>
                    </div>
                  )}

                  {/* Step 1: Risk Description */}
            <Card className="bg-slate-50 border-slate-200 p-6">
                    <h3 className="font-bold text-lg mb-4 text-slate-900">
                      Step 1: Risk Description
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-medium text-purple-700 mb-1">Asset Group</p>
                        <p className="text-sm font-semibold bg-white rounded p-2 border border-purple-200">
                          {riskAssessment.riskDescription.assetGroup || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-purple-700 mb-1">Asset Name</p>
                        <p className="text-sm font-semibold bg-white rounded p-2 border border-purple-200">
                          {riskAssessment.riskDescription.asset || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700 mb-1">Threat</p>
                        <p className="text-sm bg-white rounded p-2 border border-slate-200 min-h-12 overflow-y-auto max-h-20 break-words">
                          {riskAssessment.riskDescription.threat || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-purple-700 mb-1">Vulnerability</p>
                        <p className="text-sm bg-white rounded p-2 border border-slate-200 min-h-12 overflow-y-auto max-h-20 break-words">
                          {riskAssessment.riskDescription.vulnerability || "Not specified"}
                        </p>
                      </div>
                    </div>

                  </Card>

                  {/* Step 2: Pre-Treatment Assessment */}
                  <Card className="bg-blue-50 border-blue-200 p-6">
                    <h3 className="font-bold text-lg mb-4 text-blue-900">
                      Step 2: Pre-Treatment Assessment (Inherent Risk)
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-medium text-blue-700 mb-2">
                          Inherent Likelihood (1-5)
                        </p>
                        <div className="flex items-end gap-3">
                          <div className="text-4xl font-bold text-blue-600">
                            {riskAssessment.preTreatmentAssessment.likelihood}
                          </div>
                          <div className="flex-1 bg-white rounded p-3 border border-indigo-200 min-h-16">
                            <p className="text-xs text-muted-foreground mb-1">Rationale:</p>
                            <p className="text-sm">
                              {riskAssessment.preTreatmentAssessment.likelihoodRationale ||
                                "(Not provided)"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-blue-700 mb-2">
                          Inherent Impact (1-5)
                        </p>
                        <div className="flex items-end gap-3">
                          <div className="text-4xl font-bold text-blue-600">
                            {riskAssessment.preTreatmentAssessment.impact}
                          </div>
                          <div className="flex-1 bg-white rounded p-3 border border-indigo-200 min-h-16">
                            <p className="text-xs text-muted-foreground mb-1">Rationale:</p>
                            <p className="text-sm">
                              {riskAssessment.preTreatmentAssessment.impactRationale ||
                                "(Not provided)"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Inherent Risk Score Calculation */}
                    <div className="mt-6 pt-6 border-t border-indigo-200 bg-white rounded-lg p-4">
                      <p className="text-sm font-medium mb-3">Inherent Risk Score Calculation:</p>
                      {inherentScore == null ? (
                        <div className="text-center text-gray-500">
                          <p className="text-sm">Select likelihood and impact to calculate</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-center gap-3 text-lg font-bold">
                            <span className="text-blue-600">
                              {riskAssessment.preTreatmentAssessment.likelihood}
                            </span>
                            <span>×</span>
                            <span className="text-blue-600">
                              {riskAssessment.preTreatmentAssessment.impact}
                            </span>
                            <span>=</span>
                            <span className={cn("text-2xl", getScoreColor(inherentScore))}>
                              {inherentScore}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            Inherent Risk Level:{" "}
                            <Badge
                              className={cn(
                                "ml-2 font-bold",
                                riskAssessment.inherentRiskLevel === "LOW"
                                  ? "bg-green-500"
                                  : riskAssessment.inherentRiskLevel === "MEDIUM"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              )}
                            >
                              {riskAssessment.inherentRiskLevel}
                            </Badge>
                          </p>
                        </>
                      )}
                    </div>
                  </Card>

                  {/* Step 3: Treatment Plan & Projection */}
                  <Card className="bg-teal-50 border-teal-200 p-6">
                    <h3 className="font-bold text-lg mb-4 text-teal-900">
                      Step 3: Treatment Plan & Residual Risk Projection
                    </h3>
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs font-medium text-teal-700 mb-1">
                            Treatment Option
                          </p>
                          <p className="text-sm font-semibold bg-white rounded p-2 border border-teal-200">
                            {riskAssessment.treatmentPlan.treatmentOption || "Not selected"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-teal-700 mb-1">
                            Treatment Action Owner
                          </p>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-teal-600" />
                            <p className="text-sm font-semibold">
                              {riskAssessment.treatmentPlan.treatmentActionOwner ||
                                "Not assigned"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-teal-700 mb-1">
                          Proposed Treatment Action
                        </p>
                        <div className="bg-white rounded p-3 border border-teal-200 min-h-20 overflow-y-auto max-h-40">
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {riskAssessment.treatmentPlan.proposedTreatmentAction ||
                              "(Not filled)"}
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-teal-200">
                        <div>
                          <p className="text-xs font-medium text-teal-700 mb-1">Treatment Cost</p>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-teal-600" />
                            <p className="text-sm font-semibold">
                              {riskAssessment.treatmentPlan.treatmentCost || "Not specified"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-teal-700 mb-1">
                            Action Timescale
                          </p>
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-teal-600" />
                            <p className="text-sm font-semibold">
                              {riskAssessment.treatmentPlan.treatmentActionTimescale ||
                                "Not specified"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Target Completion with Dynamic Quarter-Date Mapping */}
                      {riskAssessment.treatmentPlan.treatmentActionTimescale && (
                        <div className="pt-4 border-t border-teal-200">
                          <p className="text-xs font-medium text-teal-700 mb-3">
                            Target Completion
                          </p>
                          <div className="bg-white rounded p-4 border border-teal-200 flex items-center gap-3">
                            <Zap className="h-5 w-5 text-teal-600 flex-shrink-0" />
                            <p className="text-sm font-semibold text-teal-900">
                              {getQuarterDateRange(riskAssessment.treatmentPlan.treatmentActionTimescale)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Residual Risk Score */}
                    <div className="mt-6 pt-6 border-t border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4">
                      {residualScore == null ? (
                        <div className="text-center text-gray-500">
                          <p className="text-sm">Select post-treatment likelihood and impact to calculate</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid md:grid-cols-2 gap-6 mb-4">
                            <div className="text-center">
                              <p className="text-xs font-medium text-teal-700 mb-2">
                                Post-Treatment Likelihood
                              </p>
                              <div className="text-3xl font-bold text-teal-600">
                                {riskAssessment.residualScoring.postTreatmentLikelihood}
                              </div>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-medium text-teal-700 mb-2">
                                Post-Treatment Impact
                              </p>
                              <div className="text-3xl font-bold text-teal-600">
                                {riskAssessment.residualScoring.postTreatmentImpact}
                              </div>
                            </div>
                          </div>

                          <div className="text-center pt-4 border-t border-teal-200">
                            <p className="text-sm font-medium mb-2">Residual Risk Score:</p>
                            <div className="flex items-center justify-center gap-3 text-lg font-bold">
                              <span className="text-teal-600">
                                {riskAssessment.residualScoring.postTreatmentLikelihood}
                              </span>
                              <span>×</span>
                              <span className="text-teal-600">
                                {riskAssessment.residualScoring.postTreatmentImpact}
                              </span>
                              <span>=</span>
                              <span className={cn("text-2xl", getScoreColor(residualScore))}>
                                {residualScore}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground text-center mt-3">
                              Residual Risk Level:{" "}
                              <Badge
                                className={cn(
                                  "ml-2 font-bold",
                                  riskAssessment.postTreatmentRiskLevel === "LOW"
                                    ? "bg-green-500"
                                    : riskAssessment.postTreatmentRiskLevel === "MEDIUM"
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                )}
                              >
                                {riskAssessment.postTreatmentRiskLevel}
                              </Badge>
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                </div>
              ) : (
                <Card className="bg-gray-50 p-6 border-gray-200">
                  <p className="text-sm text-muted-foreground">No risk assessment defined yet</p>
                </Card>
              )}
            </div>
            )}

            {/* SECTION D: EVIDENCE, CERTIFICATION & LIVE VIEWER - Hidden for all YES answers */}
            {!question.userAnswer?.startsWith("Yes") && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">
                  D
                </div>
                <h2 className="text-xl font-bold">Evidence, Certification & Live Viewer (The Proof)</h2>
              </div>

              {remediation && remediation.evidenceFiles && remediation.evidenceFiles.length > 0 ? (
                <Card className="bg-green-50 border-green-200 p-6 space-y-6">
                  {/* Evidence Files */}
                  <div>
                    <h3 className="font-bold text-green-900 mb-4">Remediation Evidence Files</h3>
                    <div className="space-y-2">
                      {remediation.evidenceFiles.map((file, index) => {
                        const isValid =
                          file.size > 20 * 1024 &&
                          !["image.png", "screenshot.jpg", "document.pdf", "scan.pdf", "upload.pdf"].includes(
                            file.name.toLowerCase()
                          );

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-green-900 truncate">
                                  {file.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </p>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <p className="text-xs text-muted-foreground">{file.type}</p>
                                  {isValid && (
                                    <>
                                      <span className="text-xs text-muted-foreground">•</span>
                                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                        <Check className="h-3 w-3" />
                                        Verified
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                              {onViewFile && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  title="View file"
                                  onClick={() => onViewFile(file)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              {onRemoveFile && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Remove file"
                                  onClick={() => onRemoveFile(file.name)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Final Certification */}
                  <div className="pt-6 border-t border-green-200">
                    <h3 className="font-bold text-green-900 mb-4">User Certification & Attestation</h3>
                    <div className="bg-white rounded-lg p-4 border-2 border-green-300">
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-green-900 mb-3">
                            "I certify this document reflects the current and final implementation
                            state and contains no unauthorized PII."
                          </p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>
                              <span className="font-medium">Certified by:</span> {remediation.createdAt ? "User" : "Not signed"}
                            </p>
                            <p>
                              <span className="font-medium">Timestamp:</span>{" "}
                              {remediation.updatedAt
                                ? new Date(remediation.updatedAt).toLocaleString()
                                : "Not available"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="bg-gray-50 p-6 border-gray-200">
                  <p className="text-sm text-muted-foreground">
                    No evidence files uploaded yet
                  </p>
                </Card>
              )}

            </div>
            )}

            {/* Submit for Review Button - Always visible for all answer types */}
            <Button
              onClick={() => {
                if (onSubmitForReview && question) {
                  onSubmitForReview(question.id, question.nist_id);
                  toast({
                    title: "Control Submitted for Review",
                    description: `${question.nist_id} has been moved to the Comment & Review page for auditor verification.`,
                    variant: "default",
                  });
                  onClose();
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 h-auto"
            >
              <Check className="h-4 w-4 mr-2" />
              Submit for Review
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
