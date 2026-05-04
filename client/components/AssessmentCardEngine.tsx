import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FolderUp } from "lucide-react";
import { AssessmentQuestion, EvidenceFile } from "@/lib/assessmentQuestions";
import { EvidenceSourcePickerModal } from "@/components/integrations/EvidenceSourcePickerModal";
import { EvidenceAttachmentCard } from "@/components/integrations/EvidenceAttachmentCard";
import { useAuth } from "@/context/AuthContext";
import { nistEvidenceFromExternal, nistEvidenceFromLocalFile } from "@/lib/integrations/evidenceAttribution";
import { logIntegrationEvent } from "@/lib/integrations/auditLog";
import type { ExternalFileReference } from "@/lib/integrations/types";

interface AssessmentCardEngineProps {
  question: AssessmentQuestion;
  onAnswerChange: (userAnswer: string | null, maturityScore: number | null) => void;
  onCommentChange: (comment: string) => void;
  onEvidenceChange?: (evidenceUrl: string | null) => void;
  onEvidenceFileSizeChange?: (fileSize: number | null) => void;
  onAddEvidenceFile?: (file: EvidenceFile) => void;
  onRemoveEvidenceFile?: (fileUrl: string) => void;
  completionRate: number;
  questionNumber: number;
  totalQuestions: number;
}

export function AssessmentCardEngine({
  question,
  onAnswerChange,
  onCommentChange,
  onEvidenceChange,
  onEvidenceFileSizeChange,
  onAddEvidenceFile,
  onRemoveEvidenceFile,
  completionRate,
  questionNumber,
  totalQuestions,
}: AssessmentCardEngineProps) {
  const { currentUser } = useAuth();
  const [showRefineMaturity, setShowRefineMaturity] = useState(
    question.maturityScore !== null && question.maturityScore >= 3,
  );
  const [evidencePickerOpen, setEvidencePickerOpen] = useState(false);
  const attachedBy = currentUser?.fullName ?? currentUser?.email;

  useEffect(() => {
    setShowRefineMaturity(question.maturityScore >= 3);
  }, [question.nist_id, question.maturityScore]);

  const addFilesFromDisk = (files: File[]) => {
    for (const file of files) {
      const ev = nistEvidenceFromLocalFile(file, { attachedBy });
      if (onAddEvidenceFile) onAddEvidenceFile(ev);
      else {
        onEvidenceChange?.(ev.url);
        onEvidenceFileSizeChange?.(file.size);
      }
    }
  };

  const addFromCloud = (ref: ExternalFileReference, mode: "import" | "link") => {
    const ev = nistEvidenceFromExternal(ref, mode, { attachedBy });
    if (onAddEvidenceFile) onAddEvidenceFile(ev);
    else {
      onEvidenceChange?.(ev.url);
      onEvidenceFileSizeChange?.(ref.sizeBytes);
    }
  };

  const handleRemoveFile = (fileUrl: string) => {
    logIntegrationEvent("evidence_removed", {
      message: fileUrl,
      context: { surface: "nist-csf/assessment", nistId: question.nist_id },
    });
    onRemoveEvidenceFile?.(fileUrl);
  };

  const handleNo = () => {
    onAnswerChange("No", 1);
    setShowRefineMaturity(false);
  };
  const handlePartial = () => {
    onAnswerChange("Partial", 2);
    setShowRefineMaturity(false);
  };
  const handleYes = () => {
    onAnswerChange("Yes", 3);
    setShowRefineMaturity(true);
  };
  const handleRefineToManaged = () => onAnswerChange("Yes - Managed", 4);
  const handleRefineToOptimized = () => onAnswerChange("Yes - Optimized", 5);

  const getMaturityLabel = (score: number) => {
    switch (score) {
      case 1:
        return "1 - Initial";
      case 2:
        return "2 - Repeatable";
      case 3:
        return "3 - Defined";
      case 4:
        return "4 - Managed";
      case 5:
        return "5 - Optimized";
      default:
        return "Not Answered";
    }
  };

  const getMaturityColor = (score: number) => {
    if (score === 1) return "bg-destructive/10 text-destructive";
    if (score === 2) return "bg-warning/10 text-warning";
    if (score === 3) return "bg-accent/10 text-accent";
    if (score >= 4) return "bg-success/10 text-success";
    return "bg-muted text-muted-foreground";
  };

  return (
    <Card className="w-full shadow-lg border border-gray-200">
      <div className="h-1.5 bg-gray-100">
        <div
          className="h-full bg-[#0052CC] transition-all duration-300 ease-out"
          style={{ width: `${completionRate}%` }}
        />
      </div>

      <CardHeader className="pb-4">
        <div className="space-y-3">
          <CardTitle className="text-lg font-semibold leading-relaxed text-gray-900">{question.question}</CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium">
              NIST ID: <span className="text-gray-700">{question.nist_id}</span>
            </p>
            <p className="text-xs text-gray-500">
              Question {questionNumber} of {totalQuestions}
            </p>
          </div>
          {question.maturityScore !== null && (
            <div>
              <Badge className={getMaturityColor(question.maturityScore)}>{getMaturityLabel(question.maturityScore)}</Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">How well does this apply?</p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={question.userAnswer === "No" ? "default" : "outline"}
              onClick={handleNo}
              className={question.userAnswer === "No" ? "bg-[#0052CC] hover:bg-[#0052CC]" : ""}
            >
              No
            </Button>
            <Button
              variant={question.userAnswer === "Partial" ? "default" : "outline"}
              onClick={handlePartial}
              className={question.userAnswer === "Partial" ? "bg-[#0052CC] hover:bg-[#0052CC]" : ""}
            >
              Partial
            </Button>
            <Button
              variant={question.userAnswer === "Yes" || question.userAnswer?.startsWith("Yes") ? "default" : "outline"}
              onClick={handleYes}
              className={
                question.userAnswer === "Yes" || question.userAnswer?.startsWith("Yes")
                  ? "bg-[#0052CC] hover:bg-[#0052CC]"
                  : ""
              }
            >
              Yes
            </Button>
          </div>
        </div>

        {showRefineMaturity && (
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm font-medium text-gray-700">Refine Maturity Level</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={question.maturityScore === 4 ? "default" : "outline"}
                onClick={handleRefineToManaged}
                className={question.maturityScore === 4 ? "bg-[#0052CC] hover:bg-[#0052CC]" : ""}
              >
                4 - Managed
              </Button>
              <Button
                variant={question.maturityScore === 5 ? "default" : "outline"}
                onClick={handleRefineToOptimized}
                className={question.maturityScore === 5 ? "bg-[#0052CC] hover:bg-[#0052CC]" : ""}
              >
                5 - Optimized
              </Button>
            </div>
          </div>
        )}

        {question.requiresEvidence && (question.userAnswer === "Yes" || question.userAnswer === "Partial" || question.userAnswer?.startsWith("Yes")) && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Evidence (supporting documentation)</p>
            <Button
              type="button"
              onClick={() => setEvidencePickerOpen(true)}
              className="h-auto w-full flex-col items-start gap-1 border-2 border-dashed border-gray-300 bg-white py-4 text-left hover:border-[#0052CC] hover:bg-blue-50/80"
              variant="outline"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
                <FolderUp className="h-4 w-4 text-[#0052CC]" />
                Upload or attach evidence
              </span>
              <span className="text-xs font-normal text-gray-500">This device, Drive, OneDrive, SharePoint, Dropbox, Box</span>
            </Button>
            <EvidenceSourcePickerModal
              open={evidencePickerOpen}
              onOpenChange={setEvidencePickerOpen}
              context={{ surface: "nist-csf/assessment-card", frameworkId: "nist-csf", questionId: question.id, nistId: question.nist_id }}
              onLocalFiles={addFilesFromDisk}
              onExternal={addFromCloud}
              title="Add evidence to this control"
            />
            {question.evidenceFiles && question.evidenceFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600 uppercase">Attached files ({question.evidenceFiles.length})</p>
                {question.evidenceFiles.map((file) => (
                  <EvidenceAttachmentCard
                    key={file.url}
                    file={{
                      name: file.name,
                      size: file.size,
                      sizeBytes: file.size,
                      sourceKind: file.sourceKind,
                      storageMode: file.storageMode,
                      sourceProviderId: file.providerId,
                    }}
                    onRemove={() => handleRemoveFile(file.url)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Notes/Context</label>
          <Textarea
            placeholder="Add any additional context or notes about this assessment..."
            value={question.comment}
            onChange={(e) => onCommentChange(e.target.value)}
            className="min-h-20 border-gray-200"
          />
        </div>
      </CardContent>
    </Card>
  );
}
