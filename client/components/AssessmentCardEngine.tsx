import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, X, FileText, Trash2 } from "lucide-react";
import { AssessmentQuestion, EvidenceFile } from "@/lib/assessmentQuestions";
import { formatFileSize } from "@/lib/fileUtils";

interface AssessmentCardEngineProps {
  question: AssessmentQuestion;
  onAnswerChange: (userAnswer: string | null, maturityScore: number | null) => void;
  onCommentChange: (comment: string) => void;
  onEvidenceChange?: (evidenceUrl: string | null) => void; // DEPRECATED: for backward compat
  onEvidenceFileSizeChange?: (fileSize: number | null) => void; // DEPRECATED: for backward compat
  onAddEvidenceFile?: (file: EvidenceFile) => void; // NEW: add file to list
  onRemoveEvidenceFile?: (fileUrl: string) => void; // NEW: remove file from list
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
  const [showRefineMaturity, setShowRefineMaturity] = useState(question.maturityScore !== null && question.maturityScore >= 3);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * STATE ISOLATION FIX: Reset file upload state when question changes
   * Ensures each NIST Control ID has its own isolated state object
   * Prevents file data/state from bleeding between questions
   */
  useEffect(() => {
    // Clear file input reference
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Update showRefineMaturity based on current question's maturity score
    setShowRefineMaturity(question.maturityScore >= 3);
  }, [question.nist_id]); // Dependency: reset when NIST ID (question ID) changes

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

  const handleRefineToManaged = () => {
    onAnswerChange("Yes - Managed", 4);
  };

  const handleRefineToOptimized = () => {
    onAnswerChange("Yes - Optimized", 5);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Process each selected file
      Array.from(files).forEach((file) => {
        const fileUrl = `/evidence/${file.name}`;
        const evidenceFile: EvidenceFile = {
          url: fileUrl,
          name: file.name,
          size: file.size,
        };

        // Use new multi-file callback if available, otherwise fall back to legacy
        if (onAddEvidenceFile) {
          onAddEvidenceFile(evidenceFile);
        } else {
          // Backward compatibility: use legacy callbacks
          onEvidenceChange?.(fileUrl);
          onEvidenceFileSizeChange?.(file.size);
        }
      });

      // Clear the input so the same file can be uploaded again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveFile = (fileUrl: string) => {
    if (onRemoveEvidenceFile) {
      onRemoveEvidenceFile(fileUrl);
    }
  };

  const getMaturityLabel = (score: number) => {
    switch (score) {
      case 1: return "1 - Initial";
      case 2: return "2 - Repeatable";
      case 3: return "3 - Defined";
      case 4: return "4 - Managed";
      case 5: return "5 - Optimized";
      default: return "Not Answered";
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
      {/* Progress Bar */}
      <div className="h-1.5 bg-gray-100">
        <div
          className="h-full bg-[#0052CC] transition-all duration-300 ease-out"
          style={{ width: `${completionRate}%` }}
        />
      </div>

      <CardHeader className="pb-4">
        <div className="space-y-3">
          {/* Question Title */}
          <CardTitle className="text-lg font-semibold leading-relaxed text-gray-900">
            {question.question}
          </CardTitle>

          {/* NIST ID Mapping */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium">
              NIST ID: <span className="text-gray-700">{question.nist_id}</span>
            </p>
            <p className="text-xs text-gray-500">
              Question {questionNumber} of {totalQuestions}
            </p>
          </div>

          {/* Current Maturity Score Badge */}
          {question.maturityScore !== null && (
            <div>
              <Badge className={getMaturityColor(question.maturityScore)}>
                {getMaturityLabel(question.maturityScore)}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Primary Action Buttons */}
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
              className={question.userAnswer === "Yes" || question.userAnswer?.startsWith("Yes") ? "bg-[#0052CC] hover:bg-[#0052CC]" : ""}
            >
              Yes
            </Button>
          </div>
        </div>

        {/* Maturity Refinement Section */}
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

        {/* Contextual Evidence Upload */}
        {question.requiresEvidence && (question.userAnswer === "Yes" || question.userAnswer === "Partial" || question.userAnswer?.startsWith("Yes")) && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Upload Evidence (Supporting Documentation)</p>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#0052CC] hover:bg-blue-50 transition-colors"
            >
              <Upload className="h-5 w-5 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Click to upload or drag & drop</p>
              <p className="text-xs text-gray-500 mt-1">PDF, DOC, or image files (multiple files supported)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              multiple
            />

            {/* Display uploaded files list */}
            {question.evidenceFiles && question.evidenceFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600 uppercase">Uploaded Files ({question.evidenceFiles.length})</p>
                {question.evidenceFiles.map((file) => (
                  <div
                    key={file.url}
                    className="flex items-center justify-between p-3 bg-success/10 border border-success/20 rounded-lg hover:bg-success/20 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-success flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-700 truncate font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(file.url)}
                      className="text-gray-400 hover:text-red-600 flex-shrink-0 ml-2 p-1 hover:bg-red-50 rounded transition-colors"
                      title="Remove this file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comment Box */}
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
