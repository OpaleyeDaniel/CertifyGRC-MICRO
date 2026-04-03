import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AssessmentQuestion, EvidenceFile } from "@/lib/assessmentQuestions";
import { GapRemediation } from "@/lib/gapRemediationTypes";
import { RiskAssessment } from "@/lib/gapRiskTypes";
import { CommentBubble } from "@/hooks/useAuditorVerification";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AuditorCommentSection } from "@/components/AuditorCommentSection";
import {
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  Lock,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/fileUtils";

interface AuditorControlCardProps {
  question: AssessmentQuestion;
  remediation?: GapRemediation;
  riskAssessment?: RiskAssessment;
  auditorStatus: "pending" | "approved" | "revision_requested";
  isSubmittedForAuditing: boolean;
  assessmentEvidenceComments: CommentBubble[];
  remediationEvidenceComments: CommentBubble[];
  gapComments: CommentBubble[];
  riskComments: CommentBubble[];
  revisionComment?: string;
  auditorMaturityScore?: number;
  initialAuditorScore?: number;
  remediationAuditorScore?: number;
  riskAuditorScore?: number;
  onApprove: () => void;
  onRequestRevision: (comment: string) => void;
  onAddCommentBubble: (section: "assessmentEvidence" | "remediationEvidence" | "gap" | "risk", text: string) => void;
  onRemoveCommentBubble: (section: "assessmentEvidence" | "remediationEvidence" | "gap" | "risk", commentId: string) => void;
  onUpdateAuditorMaturityScore: (score: number) => void;
  onUpdateSectionAuditorScore: (section: "initial" | "remediation" | "risk", score: number) => void;
  onViewFile?: (file: { url: string; name: string }) => void;
  auditorOverallComment?: string;
  onUpdateOverallComment?: (text: string) => void;
}

export function AuditorControlCard({
  question,
  remediation,
  riskAssessment,
  auditorStatus,
  isSubmittedForAuditing,
  assessmentEvidenceComments,
  remediationEvidenceComments,
  gapComments,
  riskComments,
  revisionComment = "",
  auditorMaturityScore,
  initialAuditorScore,
  remediationAuditorScore,
  riskAuditorScore,
  onApprove,
  onRequestRevision,
  onAddCommentBubble,
  onRemoveCommentBubble,
  onUpdateAuditorMaturityScore,
  onUpdateSectionAuditorScore,
  onViewFile,
  auditorOverallComment,
  onUpdateOverallComment,
}: AuditorControlCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [revisionInput, setRevisionInput] = useState(revisionComment);
  const [selectedMaturityScore, setSelectedMaturityScore] = useState<number | undefined>(auditorMaturityScore);
  const [selectedInitialScore, setSelectedInitialScore] = useState<number | undefined>(initialAuditorScore);
  const [selectedRemediationScore, setSelectedRemediationScore] = useState<number | undefined>(remediationAuditorScore);
  const [selectedRiskScore, setSelectedRiskScore] = useState<number | undefined>(riskAuditorScore);

  // Debug logging
  if (remediation?.status === "Treated") {
    console.log("🎯 AuditorControlCard - Treated remediation received:", {
      questionId: question.id,
      questionMaturityScore: question.maturityScore,
      remediationInitialScore: remediation.initialScore,
      remediationCurrentScore: remediation.currentScore,
      status: remediation.status,
    });
  }

  // Get user answer badge
  const getUserAnswerBadge = () => {
    if (!question.userAnswer) {
      return {
        label: "Pending",
        color: "bg-gray-100 text-gray-700",
      };
    }

    if (question.userAnswer === "Yes" || question.userAnswer?.startsWith("Yes")) {
      return {
        label: "YES",
        color: "bg-green-100 text-green-700",
      };
    }

    switch (question.userAnswer) {
      case "Partial":
        return {
          label: "PARTIAL",
          color: "bg-yellow-100 text-yellow-700",
        };
      case "No":
        return {
          label: "NO",
          color: "bg-red-100 text-red-700",
        };
      default:
        return {
          label: "Unknown",
          color: "bg-gray-100 text-gray-700",
        };
    }
  };

  // Get auditor status badge
  const getAuditorStatusBadge = () => {
    switch (auditorStatus) {
      case "approved":
        return {
          label: "Approved",
          color: "bg-green-500 text-white",
          icon: <CheckCircle2 className="h-3 w-3" />,
        };
      case "revision_requested":
        return {
          label: "Revision Requested",
          color: "bg-orange-500 text-white",
          icon: <AlertCircle className="h-3 w-3" />,
        };
      case "pending":
      default:
        return {
          label: "Pending Review",
          color: "bg-blue-500 text-white",
          icon: <AlertCircle className="h-3 w-3" />,
        };
    }
  };

  const userAnswerBadge = getUserAnswerBadge();
  const auditorBadge = getAuditorStatusBadge();
  const hasGapOrRisk = !question.userAnswer?.startsWith("Yes");

  // Smart Evidence Mapping: NO Rule
  // If answer is "NO", do NOT show any files in Initial Assessment block
  // Files should only appear in their uploaded section (Assessment or Remediation)
  const shouldShowAssessmentEvidence =
    question.userAnswer !== "No" &&
    ((question.evidenceFiles && question.evidenceFiles.length > 0) || question.evidenceUrl);

  const hasEvidence = shouldShowAssessmentEvidence;

  // Outcomes Synchronization: Audit Readiness
  // Mirror the Report Modal's audit readiness indicator
  // Ready when: remediation exists, status is "Treated", and has evidence files
  const getAuditReadinessBadge = () => {
    if (!hasGapOrRisk) {
      // For YES answers, no audit readiness needed
      return null;
    }

    const isReady =
      remediation &&
      remediation.status === "Treated" &&
      remediation.evidenceFiles &&
      remediation.evidenceFiles.length > 0;

    return {
      label: isReady ? "Ready" : "Not Ready",
      color: isReady ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700",
      icon: isReady ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />,
    };
  };

  const auditReadinessBadge = getAuditReadinessBadge();

  const handleApprove = () => {
    onApprove();
    setIsExpanded(false);
  };

  // Check if auditor has provided any comments in the actual comment sections
  const hasAuditorComments = (): boolean => {
    return (
      assessmentEvidenceComments.length > 0 ||
      remediationEvidenceComments.length > 0 ||
      gapComments.length > 0 ||
      riskComments.length > 0
    );
  };

  // Check if auditor has selected any maturity scores
  const hasAuditorScores = (): boolean => {
    return (
      selectedMaturityScore !== undefined ||
      selectedInitialScore !== undefined ||
      selectedRemediationScore !== undefined ||
      selectedRiskScore !== undefined
    );
  };

  // Aggregate all auditor comments from the relevant sections
  const getAggregatedComments = (): string => {
    const comments: string[] = [];

    if (assessmentEvidenceComments.length > 0) {
      comments.push(
        `Initial Assessment Comments: ${assessmentEvidenceComments.map((c) => c.text).join(" | ")}`
      );
    }

    if (remediationEvidenceComments.length > 0) {
      comments.push(
        `Gap Analysis & Remediation Comments: ${remediationEvidenceComments.map((c) => c.text).join(" | ")}`
      );
    }

    if (gapComments.length > 0) {
      comments.push(`Gap Comments: ${gapComments.map((c) => c.text).join(" | ")}`);
    }

    if (riskComments.length > 0) {
      comments.push(`Risk Comments: ${riskComments.map((c) => c.text).join(" | ")}`);
    }

    // Include additional revision input if provided
    if (revisionInput.trim()) {
      comments.push(`Additional Note: ${revisionInput}`);
    }

    return comments.join(" | ");
  };

  const handleRequestRevision = () => {
    // Get aggregated comments from actual auditor comment fields
    const aggregatedComments = getAggregatedComments();

    // Validate: need either comments or scores
    if (!hasAuditorComments() && !hasAuditorScores()) {
      alert("Please add at least one auditor comment or select a maturity score before requesting revision");
      return;
    }

    // Use aggregated comments (or empty string if only scores provided)
    onRequestRevision(aggregatedComments || "Revision requested based on auditor review");
    setIsExpanded(false);
    setRevisionInput("");
  };

  return (
    <motion.div
      layout
      className={cn(
        "transition-all rounded-lg border",
        auditorStatus === "approved"
          ? "bg-green-50 border-green-200"
          : auditorStatus === "revision_requested"
          ? "bg-orange-50 border-orange-200"
          : "bg-white border-gray-200"
      )}
    >
      {/* Summary Row (Collapsed View) */}
      <motion.button
        onClick={() => (isSubmittedForAuditing ? setIsExpanded(!isExpanded) : null)}
        disabled={!isSubmittedForAuditing}
        className={cn(
          "w-full p-4 flex items-center justify-between gap-4 transition-colors rounded-lg",
          !isSubmittedForAuditing
            ? "cursor-not-allowed opacity-75"
            : "hover:bg-gray-50"
        )}
      >
        <div className="flex items-center gap-4 flex-1 text-left min-w-0">
          {/* NIST ID */}
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono font-semibold flex-shrink-0">
            {question.nist_id}
          </code>

          {/* User Answer Badge */}
          <Badge
            variant="outline"
            className={cn("text-xs flex-shrink-0", userAnswerBadge.color)}
          >
            {userAnswerBadge.label}
          </Badge>

          {/* Auditor Status Badge */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0",
              auditorBadge.color
            )}
          >
            {auditorBadge.icon}
            <span>{auditorBadge.label}</span>
          </div>

          {/* Audit Readiness Badge - Only for gaps/risks */}
          {auditReadinessBadge && (
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0",
                auditReadinessBadge.color
              )}
            >
              {auditReadinessBadge.icon}
              <span>{auditReadinessBadge.label}</span>
            </div>
          )}

          {/* Category (truncated) */}
          <span className="text-sm text-muted-foreground truncate hidden sm:inline">
            {question.category}
          </span>

          {/* Lock Icon if not submitted */}
          {!isSubmittedForAuditing && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 bg-gray-100 text-gray-700">
              <Lock className="h-3 w-3" />
              <span>Locked</span>
            </div>
          )}
        </div>

        {/* Chevron Icon */}
        {isSubmittedForAuditing && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        )}
      </motion.button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && isSubmittedForAuditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="border-t border-gray-200 p-6 space-y-6">
              {/* Question Text */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Control Description</h4>
                <p className="text-sm text-gray-700">{question.question}</p>
              </div>

              {/* SECTION A: INITIAL ASSESSMENT */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    A
                  </div>
                  Initial Assessment
                </h4>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-3">
                  {/* Assessment Data */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-medium text-blue-700 mb-1">Answer</p>
                      <div className="flex items-center gap-2">
                        {(question.userAnswer === "Yes" || question.userAnswer?.startsWith("Yes")) && (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-600">YES</span>
                          </>
                        )}
                        {question.userAnswer === "Partial" && (
                          <>
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="font-semibold text-yellow-600">PARTIAL</span>
                          </>
                        )}
                        {question.userAnswer === "No" && (
                          <>
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="font-semibold text-red-600">NO</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-700 mb-1">Initial Maturity Score</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {question.maturityScore !== null ? question.maturityScore : "—"}
                      </p>
                      {question.maturityScore !== null && (
                        <p className="text-xs text-blue-600 mt-1">
                          {question.maturityScore === 1 ? "Initial" :
                           question.maturityScore === 2 ? "Repeatable" :
                           question.maturityScore === 3 ? "Defined" :
                           question.maturityScore === 4 ? "Managed" :
                           "Optimized"}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-700 mb-1">Assessment Notes</p>
                      <p className="text-sm bg-white rounded p-2 border border-blue-200 max-h-20 overflow-y-auto">
                        {question.comment || "(No notes)"}
                      </p>
                    </div>
                  </div>

                  {/* Evidence Files */}
                  {hasEvidence && (
                    <div className="pt-3 border-t border-blue-200">
                      <p className="text-xs font-medium text-blue-900 mb-2">Evidence Files</p>
                      <div className="space-y-2">
                        {question.evidenceFiles && question.evidenceFiles.length > 0
                          ? question.evidenceFiles.map((file) => (
                              <div
                                key={file.url}
                                className="bg-white rounded p-2 border border-blue-200 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileText className="h-3 w-3 text-blue-600 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-blue-900 truncate">{file.name}</p>
                                    <p className="text-blue-700">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="gap-1 text-blue-600 hover:bg-blue-100 h-auto p-1 flex-shrink-0"
                                  onClick={() => onViewFile?.({ url: file.url, name: file.name })}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            ))
                          : question.evidenceUrl && (
                              <div className="bg-white rounded p-2 border border-blue-200 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileText className="h-3 w-3 text-blue-600 flex-shrink-0" />
                                  <p className="font-medium text-blue-900 truncate">
                                    {question.evidenceUrl.split("/").pop()}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="gap-1 text-blue-600 hover:bg-blue-100 h-auto p-1 flex-shrink-0"
                                  onClick={() =>
                                    onViewFile?.({
                                      url: question.evidenceUrl!,
                                      name: question.evidenceUrl?.split("/").pop() || "evidence",
                                    })
                                  }
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                      </div>
                    </div>
                  )}

                  {/* Assessment Evidence Comment Section - Only show when answer is "Yes" */}
                  {(question.userAnswer === "Yes" || question.userAnswer?.startsWith("Yes") || question.userAnswer === "Partial") && (
                    <div className="pt-3 border-t border-blue-200">
                      <AuditorCommentSection
                        sectionLabel="Comment on Initial Assessment"
                        comments={assessmentEvidenceComments}
                        onAddComment={(text) => onAddCommentBubble("assessmentEvidence", text)}
                        onRemoveComment={(id) => onRemoveCommentBubble("assessmentEvidence", id)}
                      />
                    </div>
                  )}

                  {/* Initial Assessment - Auditor Maturity Score Selector - Only show if answer is "Yes" or "Partial" */}
                  {question.userAnswer !== "No" && (
                    <div className="space-y-2 pt-3 border-t border-blue-200">
                      <label className="text-sm font-semibold text-blue-900">Auditor Maturity Score (Initial Assessment)</label>
                      <p className="text-xs text-blue-700">Select your assessment score for this control:</p>

                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((score) => {
                          const labels: Record<number, string> = {
                            1: "Initial",
                            2: "Repeatable",
                            3: "Defined",
                            4: "Managed",
                            5: "Optimized",
                          };

                          return (
                            <button
                              key={score}
                              onClick={() => {
                                setSelectedInitialScore(score);
                                onUpdateSectionAuditorScore("initial", score);
                              }}
                              className={cn(
                                "px-3 py-2 rounded-lg border-2 font-medium transition-all text-xs text-center",
                                selectedInitialScore === score
                                  ? "border-blue-600 bg-blue-100 text-blue-700"
                                  : "border-blue-300 bg-white text-blue-700 hover:border-blue-400"
                              )}
                            >
                              <div className="font-bold text-sm">{score}</div>
                              <div className="text-xs">{labels[score]}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION B: GAP ANALYSIS & REMEDIATION - Only if NO or PARTIAL */}
              {hasGapOrRisk && (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                      B
                    </div>
                    Gap Analysis & Remediation
                  </h4>

                  {remediation ? (
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 space-y-3">
                      {/* Status and Present Maturity Score */}
                      <div className="flex items-center gap-4 pb-3 border-b border-amber-200 justify-between flex-wrap">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-amber-700">Status:</p>
                          <Badge
                            className={cn(
                              "text-xs",
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

                        {/* Present Maturity Score - Show for treated remediations */}
                        {remediation.status === "Treated" && (
                          (() => {
                            // Use initialScore stored in remediation, fallback to question.maturityScore
                            const initialScore = remediation.initialScore ?? question.maturityScore;
                            // Use currentScore stored in remediation for the present maturity level
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

                      {/* Remediation Details */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="font-medium text-amber-900 mb-1">Root Cause</p>
                          <p className="bg-white rounded p-2 border border-amber-200 max-h-16 overflow-y-auto">
                            {remediation.rootCause || "(Not filled)"}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-amber-900 mb-1">Action Plan</p>
                          <p className="bg-white rounded p-2 border border-amber-200 max-h-16 overflow-y-auto">
                            {remediation.actionPlan || "(Not filled)"}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-amber-900 mb-1">Expected Completion</p>
                          <p className="bg-white rounded p-2 border border-amber-200">
                            {remediation.expectedCompletionDate || "(Not set)"}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-amber-900 mb-1">Priority</p>
                          <Badge
                            className={cn(
                              "text-xs",
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

                      {/* Remediation Evidence Files - Separate from Initial Assessment */}
                      {remediation.evidenceFiles && remediation.evidenceFiles.length > 0 && (
                        <div className="pt-3 border-t border-amber-200">
                          <p className="text-xs font-medium text-amber-900 mb-2">
                            Remediation Evidence Files ({remediation.evidenceFiles.length})
                          </p>
                          <div className="space-y-2">
                            {remediation.evidenceFiles.map((file, idx) => (
                              <div
                                key={`${file.name}-${idx}`}
                                className="bg-white rounded p-2 border border-amber-200 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileText className="h-3 w-3 text-amber-600 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-amber-900 truncate">{file.name}</p>
                                    <p className="text-amber-700">
                                      {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="gap-1 text-amber-600 hover:bg-amber-100 h-auto p-1 flex-shrink-0"
                                  onClick={() =>
                                    onViewFile?.({
                                      url: file.url || `/evidence/${file.name}`,
                                      name: file.name,
                                    })
                                  }
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>

                          {/* Remediation Evidence Comment Section */}
                          <div className="mt-3">
                            <AuditorCommentSection
                              sectionLabel="Comment on Remediation Evidence"
                              comments={remediationEvidenceComments}
                              onAddComment={(text) => onAddCommentBubble("remediationEvidence", text)}
                              onRemoveComment={(id) => onRemoveCommentBubble("remediationEvidence", id)}
                            />
                          </div>
                        </div>
                      )}

                      {/* Gap Analysis Comment Section - Only if no remediation evidence */}
                      {(!remediation.evidenceFiles || remediation.evidenceFiles.length === 0) && (
                        <div className="pt-3 border-t border-amber-200">
                          <AuditorCommentSection
                            sectionLabel="Comment on Gap/Remediation Plan"
                            comments={gapComments}
                            onAddComment={(text) => onAddCommentBubble("gap", text)}
                            onRemoveComment={(id) => onRemoveCommentBubble("gap", id)}
                          />
                        </div>
                      )}

                      {/* Gap Analysis & Remediation - Auditor Maturity Score Selector */}
                      <div className="space-y-2 pt-3 border-t border-amber-200">
                        <label className="text-sm font-semibold text-amber-900">Auditor Maturity Score (Gap Analysis & Remediation)</label>
                        <p className="text-xs text-amber-700">Select your assessment score for this control:</p>

                        <div className="grid grid-cols-5 gap-2">
                          {[1, 2, 3, 4, 5].map((score) => {
                            const labels: Record<number, string> = {
                              1: "Initial",
                              2: "Repeatable",
                              3: "Defined",
                              4: "Managed",
                              5: "Optimized",
                            };

                            return (
                              <button
                                key={score}
                                onClick={() => {
                                  setSelectedRemediationScore(score);
                                  onUpdateSectionAuditorScore("remediation", score);
                                }}
                                className={cn(
                                  "px-3 py-2 rounded-lg border-2 font-medium transition-all text-xs text-center",
                                  selectedRemediationScore === score
                                    ? "border-amber-600 bg-amber-100 text-amber-700"
                                    : "border-amber-300 bg-white text-amber-700 hover:border-amber-400"
                                )}
                              >
                                <div className="font-bold text-sm">{score}</div>
                                <div className="text-xs">{labels[score]}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 text-sm text-amber-700">
                      No remediation plan defined yet
                    </div>
                  )}
                </div>
              )}

              {/* SECTION C: RISK ASSESSMENT - Only if NO or PARTIAL */}
              {hasGapOrRisk && (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                      C
                    </div>
                    Risk Assessment
                  </h4>

                  {riskAssessment ? (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 space-y-4 text-xs">
                      {/* Step 1: Risk Description */}
                      <div className="space-y-2">
                        <p className="font-semibold text-purple-900">Step 1: Risk Description</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="font-medium text-purple-900 mb-1">Asset Group</p>
                            <p className="bg-white rounded p-2 border border-purple-200">
                              {riskAssessment.riskDescription?.assetGroup || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-purple-900 mb-1">Asset</p>
                            <p className="bg-white rounded p-2 border border-purple-200">
                              {riskAssessment.riskDescription?.asset || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-purple-900 mb-1">Threat</p>
                            <p className="bg-white rounded p-2 border border-purple-200 max-h-16 overflow-y-auto">
                              {riskAssessment.riskDescription?.threat || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-purple-900 mb-1">Vulnerability</p>
                            <p className="bg-white rounded p-2 border border-purple-200 max-h-16 overflow-y-auto">
                              {riskAssessment.riskDescription?.vulnerability || "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Step 2: Pre-Treatment Assessment (Inherent Risk) */}
                      <div className="pt-3 border-t border-purple-200 space-y-2">
                        <p className="font-semibold text-purple-900">Step 2: Pre-Treatment Assessment (Inherent Risk)</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="font-medium text-purple-900 mb-1">Likelihood (1-5)</p>
                            <div className="bg-white rounded p-2 border border-purple-200">
                              <p className="text-lg font-bold text-purple-600 mb-1">
                                {riskAssessment.preTreatmentAssessment?.likelihood || "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {riskAssessment.preTreatmentAssessment?.likelihoodRationale || "(No rationale)"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-purple-900 mb-1">Impact (1-5)</p>
                            <div className="bg-white rounded p-2 border border-purple-200">
                              <p className="text-lg font-bold text-purple-600 mb-1">
                                {riskAssessment.preTreatmentAssessment?.impact || "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {riskAssessment.preTreatmentAssessment?.impactRationale || "(No rationale)"}
                              </p>
                            </div>
                          </div>
                        </div>
                        {/* Inherent Risk Score */}
                        {riskAssessment.preTreatmentAssessment?.likelihood && riskAssessment.preTreatmentAssessment?.impact && (
                          <div className="bg-white rounded p-3 border border-purple-200">
                            <p className="font-medium text-purple-900 mb-2">Inherent Risk Score:</p>
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <span className="text-purple-600 font-bold">
                                {riskAssessment.preTreatmentAssessment.likelihood}
                              </span>
                              <span>×</span>
                              <span className="text-purple-600 font-bold">
                                {riskAssessment.preTreatmentAssessment.impact}
                              </span>
                              <span>=</span>
                              <span className="text-lg font-bold text-purple-600">
                                {riskAssessment.preTreatmentAssessment.likelihood * riskAssessment.preTreatmentAssessment.impact}
                              </span>
                            </div>
                            <Badge
                              className={cn(
                                "w-full justify-center text-xs font-bold",
                                riskAssessment.inherentRiskLevel === "HIGH"
                                  ? "bg-red-500"
                                  : riskAssessment.inherentRiskLevel === "MEDIUM"
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              )}
                            >
                              {riskAssessment.inherentRiskLevel}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Step 3: Treatment Plan */}
                      <div className="pt-3 border-t border-purple-200 space-y-2">
                        <p className="font-semibold text-purple-900">Step 3: Treatment Plan & Residual Risk Projection</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="font-medium text-purple-900 mb-1">Treatment Option</p>
                            <p className="bg-white rounded p-2 border border-purple-200 min-h-8">
                              {riskAssessment.treatmentPlan?.treatmentOption || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-purple-900 mb-1">Action Owner</p>
                            <p className="bg-white rounded p-2 border border-purple-200 min-h-8">
                              {riskAssessment.treatmentPlan?.treatmentActionOwner || "—"}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="font-medium text-purple-900 mb-1">Proposed Treatment Action</p>
                            <p className="bg-white rounded p-2 border border-purple-200 max-h-16 overflow-y-auto min-h-8">
                              {riskAssessment.treatmentPlan?.proposedTreatmentAction || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-purple-900 mb-1">Treatment Cost</p>
                            <p className="bg-white rounded p-2 border border-purple-200 min-h-8">
                              {riskAssessment.treatmentPlan?.treatmentCost || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-purple-900 mb-1">Timescale</p>
                            <p className="bg-white rounded p-2 border border-purple-200 min-h-8">
                              {riskAssessment.treatmentPlan?.treatmentActionTimescale || "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Step 4: Post-Treatment Assessment (Residual Risk) */}
                      <div className="pt-3 border-t border-purple-200 space-y-2">
                        <p className="font-semibold text-purple-900">Step 4: Post-Treatment Assessment (Residual Risk)</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="font-medium text-purple-900 mb-1">Post-Treatment Likelihood</p>
                            <p className="text-lg font-bold text-purple-600 bg-white rounded p-2 border border-purple-200 text-center">
                              {riskAssessment.residualScoring?.postTreatmentLikelihood || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-purple-900 mb-1">Post-Treatment Impact</p>
                            <p className="text-lg font-bold text-purple-600 bg-white rounded p-2 border border-purple-200 text-center">
                              {riskAssessment.residualScoring?.postTreatmentImpact || "—"}
                            </p>
                          </div>
                        </div>
                        {/* Residual Risk Score */}
                        {riskAssessment.residualScoring?.postTreatmentLikelihood && riskAssessment.residualScoring?.postTreatmentImpact && (
                          <div className="bg-white rounded p-3 border border-purple-200">
                            <p className="font-medium text-purple-900 mb-2">Residual Risk Score:</p>
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <span className="text-purple-600 font-bold">
                                {riskAssessment.residualScoring.postTreatmentLikelihood}
                              </span>
                              <span>×</span>
                              <span className="text-purple-600 font-bold">
                                {riskAssessment.residualScoring.postTreatmentImpact}
                              </span>
                              <span>=</span>
                              <span className="text-lg font-bold text-purple-600">
                                {riskAssessment.residualScoring.postTreatmentLikelihood * riskAssessment.residualScoring.postTreatmentImpact}
                              </span>
                            </div>
                            <Badge
                              className={cn(
                                "w-full justify-center text-xs font-bold",
                                riskAssessment.postTreatmentRiskLevel === "HIGH"
                                  ? "bg-red-500"
                                  : riskAssessment.postTreatmentRiskLevel === "MEDIUM"
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              )}
                            >
                              {riskAssessment.postTreatmentRiskLevel}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Risk Comment Section */}
                      <div className="pt-3 border-t border-purple-200">
                        <AuditorCommentSection
                          sectionLabel="Comment on Risk Assessment"
                          comments={riskComments}
                          onAddComment={(text) => onAddCommentBubble("risk", text)}
                          onRemoveComment={(id) => onRemoveCommentBubble("risk", id)}
                        />
                      </div>

                      {/* Risk Assessment - Auditor Maturity Score Selector */}
                      <div className="space-y-2 pt-3 border-t border-purple-200">
                        <label className="text-sm font-semibold text-purple-900">Auditor Maturity Score (Risk Assessment)</label>
                        <p className="text-xs text-purple-700">Select your assessment score for this control:</p>

                        <div className="grid grid-cols-5 gap-2">
                          {[1, 2, 3, 4, 5].map((score) => {
                            const labels: Record<number, string> = {
                              1: "Initial",
                              2: "Repeatable",
                              3: "Defined",
                              4: "Managed",
                              5: "Optimized",
                            };

                            return (
                              <button
                                key={score}
                                onClick={() => {
                                  setSelectedRiskScore(score);
                                  onUpdateSectionAuditorScore("risk", score);
                                }}
                                className={cn(
                                  "px-3 py-2 rounded-lg border-2 font-medium transition-all text-xs text-center",
                                  selectedRiskScore === score
                                    ? "border-purple-600 bg-purple-100 text-purple-700"
                                    : "border-purple-300 bg-white text-purple-700 hover:border-purple-400"
                                )}
                              >
                                <div className="font-bold text-sm">{score}</div>
                                <div className="text-xs">{labels[score]}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 text-sm text-purple-700">
                      No risk assessment defined yet
                    </div>
                  )}
                </div>
              )}

              {/* Auditor Overall Comment (always visible for auditors) */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <label className="text-sm font-semibold text-gray-900">
                  Auditor Overall Comment
                </label>
                <Textarea
                  placeholder="Summarise your overall assessment, including key reasons for approval or revision."
                  value={auditorOverallComment ?? ""}
                  onChange={(e) => onUpdateOverallComment?.(e.target.value)}
                  className="text-sm"
                  rows={3}
                />
              </div>

              {/* Auditor Maturity Score Selector */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900">Auditor Maturity Score Assessment</label>
                  <p className="text-xs text-gray-600">Select the maturity level for this control after your review:</p>

                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((score) => {
                      const labels: Record<number, string> = {
                        1: "Initial",
                        2: "Repeatable",
                        3: "Defined",
                        4: "Managed",
                        5: "Optimized",
                      };

                      return (
                        <button
                          key={score}
                          onClick={() => {
                            setSelectedMaturityScore(score);
                            onUpdateAuditorMaturityScore(score);
                          }}
                          className={cn(
                            "px-3 py-2 rounded-lg border-2 font-medium transition-all text-xs text-center",
                            selectedMaturityScore === score
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          )}
                        >
                          <div className="font-bold text-sm">{score}</div>
                          <div className="text-xs">{labels[score]}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Decision Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {auditorStatus !== "approved" && (
                  <Button
                    onClick={handleApprove}
                    className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                )}

                {auditorStatus !== "revision_requested" && (
                  <Button
                    onClick={handleRequestRevision}
                    variant="outline"
                    className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Request Revision
                  </Button>
                )}

                {auditorStatus === "revision_requested" && (
                  <div className="flex-1">
                    <Textarea
                      placeholder="Explain what needs to be revised..."
                      value={revisionInput}
                      onChange={(e) => setRevisionInput(e.target.value)}
                      className="text-xs mb-2"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRequestRevision}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        Update Request
                      </Button>
                      <Button
                        onClick={() => setIsExpanded(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {auditorStatus === "approved" && (
                  <Button
                    onClick={() => setIsExpanded(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
