import { AssessmentQuestion } from "@/lib/assessmentQuestions";
import { getNISTReference } from "@/lib/gapRemediationTypes";
import { useGapRemediation } from "@/hooks/useGapRemediation";
import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";
import { calculateMaturityContext, getNextMaturityLevel } from "@/lib/maturityProgression";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Check, AlertCircle, X, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { RemediationEvidenceUploadGated } from "./RemediationEvidenceUploadGated";

interface GapDetailViewProps {
  gap: AssessmentQuestion;
  onBack: () => void;
  onDraftSaved?: () => void;
  isRevision?: boolean;
  revisionComment?: string;
  onRevisionComplete?: () => void;
}

interface EvidenceFile {
  name: string;
  size: number;
  uploadedAt: string;
  type: string;
}

type DocumentType =
  | "Policy"
  | "Log"
  | "Screenshot"
  | "Approval"
  | "Other"
  | null;

export function GapDetailView({
  gap,
  onBack,
  onDraftSaved,
  isRevision = false,
  revisionComment,
  onRevisionComplete,
}: GapDetailViewProps) {
  const { getOrCreateRemediation, updateRemediation, saveRemediation } =
    useGapRemediation();
  const { toast } = useToast();

  // Get or create remediation record (capture initial maturity score from assessment)
  const remediation = getOrCreateRemediation(
    gap.id,
    gap.nist_id,
    gap.question,
    gap.category,
    gap.function,
    gap.maturityScore // Pass initial maturity score to preserve it
  );

  // Check if this is a resumed draft (pre-fill state from existing remediation)
  const isDraftResume = remediation.status === "Draft";

  // State Management
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<EvidenceFile[]>(
    isDraftResume && remediation.evidenceFiles ? remediation.evidenceFiles : [],
  );
  const [isEarlySubmissionRequested, setIsEarlySubmissionRequested] =
    useState(false);
  const [implementationConfirmed, setImplementationConfirmed] = useState(false);
  const [earlyCompletionJustification, setEarlyCompletionJustification] =
    useState("");
  const [documentType, setDocumentType] = useState<DocumentType>(
    isDraftResume && (remediation as any).documentType
      ? (remediation as any).documentType
      : null,
  );
  const [legalAttestationChecked, setLegalAttestationChecked] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<
    "draft" | "submit" | null
  >(null);

  // Listen for remediation data changes and sync uploaded files
  useEffect(() => {
    const handleRemediationDataChange = () => {
      // When remediation data changes, sync the uploadedFiles state from remediation
      if (remediation.evidenceFiles && remediation.evidenceFiles.length > 0) {
        setUploadedFiles(remediation.evidenceFiles);
        console.log(`📁 Synced ${remediation.evidenceFiles.length} files from remediation storage`);
      }
    };

    window.addEventListener('gapRemediationDataChanged', handleRemediationDataChange);
    return () => {
      window.removeEventListener('gapRemediationDataChanged', handleRemediationDataChange);
    };
  }, [remediation.evidenceFiles]);

  // Get NIST reference data
  const nistRef = getNISTReference(gap.nist_id);

  // Check if completion date has been reached
  const isCompletionDateReached = useMemo(() => {
    if (!remediation.expectedCompletionDate) return false;
    const completionDate = new Date(remediation.expectedCompletionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    completionDate.setHours(0, 0, 0, 0);
    return today >= completionDate;
  }, [remediation.expectedCompletionDate]);

  // Check if early submission is properly configured
  const isEarlySubmissionValid = useMemo(() => {
    if (!isEarlySubmissionRequested) return false;
    if (!implementationConfirmed) return false;
    if (!isCompletionDateReached && !earlyCompletionJustification.trim())
      return false;
    return true;
  }, [
    isEarlySubmissionRequested,
    implementationConfirmed,
    isCompletionDateReached,
    earlyCompletionJustification,
  ]);

  // Compute if evidence submission is valid
  const isEvidenceValid = useMemo(() => {
    return uploadedFiles.length > 0;
  }, [uploadedFiles]);

  // Compute if document type is selected
  const isDocumentTypeSelected = useMemo(() => {
    return documentType !== null;
  }, [documentType]);

  // Compute if legal attestation is checked
  const isLegalAttestationValid = useMemo(() => {
    return legalAttestationChecked;
  }, [legalAttestationChecked]);

  // Check if submission is allowed based on date and early submission
  const isSubmissionAllowed = useMemo(() => {
    if (isCompletionDateReached) {
      // If date has been reached, early submission fields don't matter
      return true;
    }
    // If date hasn't been reached, must have valid early submission
    return isEarlySubmissionValid;
  }, [isCompletionDateReached, isEarlySubmissionValid]);

  // Check if submit button should be enabled (all conditions met)
  // Only require document type when in Draft status (In Progress view)
  const canSubmitRemediation = useMemo(() => {
    return (
      remediation.rootCause.trim() &&
      remediation.actionPlan.trim() &&
      isEvidenceValid &&
      (remediation.status === "Draft" ? isDocumentTypeSelected : true) &&
      isLegalAttestationValid &&
      isSubmissionAllowed
    );
  }, [
    remediation.rootCause,
    remediation.actionPlan,
    isEvidenceValid,
    isDocumentTypeSelected,
    isLegalAttestationValid,
    isSubmissionAllowed,
    remediation.status,
  ]);

  // Check if save as draft should be enabled (basic fields filled)
  const canSaveAsDraft = useMemo(() => {
    return remediation.rootCause.trim() && remediation.actionPlan.trim();
  }, [remediation.rootCause, remediation.actionPlan]);

  // Handle files added from upload component
  const handleFilesAdded = useCallback(
    (files: EvidenceFile[]) => {
      console.log(`📁 handleFilesAdded: Adding ${files.length} files to remediation`, {
        questionId: gap.id,
        files: files.map(f => ({ name: f.name, size: f.size }))
      });

      // Add to local state
      setUploadedFiles((prev) => [...prev, ...files]);

      // Update remediation record with evidence files ONLY
      // DO NOT update assessment question evidence - keep sources separate
      // Files uploaded during remediation should ONLY be tagged as "Remediation Plan"
      const newEvidenceFiles = [...(remediation.evidenceFiles || []), ...files];
      console.log(`📁 Calling updateRemediation with ${newEvidenceFiles.length} total evidence files`, {
        newFiles: newEvidenceFiles.map(f => ({ name: f.name, uploadedAt: f.uploadedAt }))
      });

      updateRemediation(gap.id, {
        evidenceFiles: newEvidenceFiles,
      });
    },
    [
      gap.id,
      gap.nist_id,
      remediation.evidenceFiles,
      updateRemediation,
    ],
  );

  // Handle early submission toggle
  const handleEarlySubmissionToggle = (checked: boolean) => {
    setIsEarlySubmissionRequested(checked);
    if (!checked) {
      // Clear all early submission related fields if toggle is turned off
      setImplementationConfirmed(false);
      setEarlyCompletionJustification("");
    }
  };

  // Save as Draft
  const handleSaveAsDraft = () => {
    if (!canSaveAsDraft) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    // Update local state with Draft status and draftSavedDate
    // WORKFLOW TRANSITION: This state change immediately filters gap from Active Gap view
    updateRemediation(gap.id, {
      status: "Draft",
      draftSavedDate: new Date().toISOString(),
    });
    
    console.log("🔄 WORKFLOW TRANSITION - Gap marked as Draft:", {
      questionId: gap.id,
      nistId: gap.nist_id,
      timestamp: new Date().toISOString(),
      message: "This gap should now disappear from 'Active Gaps' and appear in 'In Progress'",
    });

    // Show success message
    toast({
      title: "Success!",
      description: "Remediation saved as draft. Gap moved to 'In Progress' tab.",
    });

    // Use a microtask to ensure state is committed before switching tabs
    Promise.resolve().then(() => {
      // Notify parent to switch tabs
      if (onDraftSaved) {
        onDraftSaved();
      }

      // Close the detail view
      setTimeout(() => {
        onBack();
      }, 300);
    });

    setIsSaving(false);
  };

  // Submit Remediation (with evidence)
  const handleSubmitRemediation = async () => {
    // Final validation
    if (!canSubmitRemediation) {
      toast({
        title: "Validation error",
        description:
          "Please complete all fields: root cause, action plan, upload evidence, select document type, and confirm legal attestation.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Calculate maturity score progression BEFORE submission
      const nextMaturityScore = getNextMaturityLevel(gap.maturityScore);

      console.log("🔍 DEBUG: Remediation submission", {
        gapMaturityScore: gap.maturityScore,
        nextMaturityScore,
        remediationInitialScore: remediation.initialScore,
        remediationCurrentScore: remediation.currentScore,
        willPromote: nextMaturityScore !== null,
      });

      // Build remediation data with promoted currentScore if applicable
      const remediationData = {
        ...remediation,
        status: "Treated",
        documentType: documentType,
        legallyAttested: true,
        attestationDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Include promoted currentScore in submission (immutable initialScore preserved)
        currentScore: nextMaturityScore !== null ? nextMaturityScore : remediation.currentScore,
      };

      console.log("📤 Submitting remediation data:", {
        initialScore: remediationData.initialScore,
        currentScore: remediationData.currentScore,
        status: remediationData.status,
      });

      // Update local state with submitted remediation (no backend API call needed)
      // Storage will be persisted by updateRemediation hook
      await Promise.resolve().then(() => {
        updateRemediation(gap.id, remediationData);
      });

      // Apply maturity score progression
      if (nextMaturityScore !== null) {
        console.log(
          `📈 Maturity Progression: ${gap.nist_id} promoted from ${gap.maturityScore} to ${nextMaturityScore}`
        );
      }

      // WORKFLOW TRANSITION: Gap marked as Treated, moves from In Progress to Treated Gaps
      console.log("✅ WORKFLOW TRANSITION - Gap marked as Treated:", {
        questionId: gap.id,
        nistId: gap.nist_id,
        status: "Treated",
        timestamp: new Date().toISOString(),
        message: "This gap should now disappear from 'In Progress' and appear in 'Treated Gaps'",
      });

      // Show success message
      const progressionMessage =
        nextMaturityScore !== null
          ? ` Maturity score promoted from ${gap.maturityScore} to ${nextMaturityScore}.`
          : "";
      toast({
        title: "Success!",
        description: `Remediation submitted with audit-grade evidence and marked as Treated.${progressionMessage}`,
      });

      // If in revision mode, mark revision as completed
      if (isRevision && onRevisionComplete) {
        onRevisionComplete();
      }

      // Redirect back after short delay
      setTimeout(() => {
        onBack();
      }, 1000);
    } catch (error) {
      console.error("Error submitting remediation:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit remediation",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "High":
        return "bg-orange-500/10 text-orange-700 border-orange-500/20";
      case "Medium":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      default:
        return "bg-green-500/10 text-green-700 border-green-500/20";
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Handle file removal
  const handleRemoveFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName));
    // Also update remediation record
    updateRemediation(gap.id, {
      evidenceFiles: uploadedFiles.filter((f) => f.name !== fileName),
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back to List
        </Button>
      </div>

      {/* Revision Comment Banner (if in revision mode) */}
      {isRevision && revisionComment && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6 flex gap-4">
            <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-2">
                Returned for revision by auditor
              </h3>
              <p className="text-sm text-orange-800">{revisionComment}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gap Info Bar */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <code className="text-sm font-mono font-semibold">
                  {gap.nist_id}
                </code>
                <Badge variant="outline">{gap.function}</Badge>
                {isRevision && (
                  <Badge className="bg-red-100 text-red-700 border border-red-200">
                    REVISION
                  </Badge>
                )}
              </div>
              <h2 className="text-lg font-semibold">{gap.question}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {gap.category}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Answer</p>
              <p className="text-2xl font-bold">{gap.userAnswer}</p>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-muted-foreground">
                  Current Maturity: {gap.maturityScore !== null ? `${gap.maturityScore}/5` : "Not Answered"}
                </p>
                {(() => {
                  const maturityContext = calculateMaturityContext(gap.maturityScore);
                  return maturityContext.nextScore !== null ? (
                    <p className="text-xs text-green-600 font-medium">
                      Next Level (on submit): {maturityContext.nextScore}/5
                    </p>
                  ) : null;
                })()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Master-Detail Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* NIST Reference Panel (Read-Only) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">NIST CSF Reference</CardTitle>
            <CardDescription>
              Standard guidance for this control
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Subcategory */}
            <div>
              <p className="text-sm font-semibold mb-2">Subcategory</p>
              <p className="text-sm text-muted-foreground">
                {nistRef.subcategory}
              </p>
            </div>

            {/* Informative References */}
            <div>
              <p className="text-sm font-semibold mb-2">
                Informative References
              </p>
              <ul className="space-y-1">
                {nistRef.informativeReferences.map((ref, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground">
                    • {ref}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Implementation Examples */}
            <div>
              <p className="text-sm font-semibold mb-2">
                Recommended Implementation Examples
              </p>
              <ul className="space-y-1 bg-muted/50 p-3 rounded-lg">
                {nistRef.recommendedImplementationExamples.map(
                  (example, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      ✓ {example}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Remediation Worksheet (Interactive) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Remediation Worksheet</CardTitle>
            <CardDescription>
              {isDraftResume
                ? "Resuming draft - complete and submit"
                : "Document your remediation plan"}
              {remediation.status !== "Unassigned" && (
                <Badge
                  className={`ml-2 ${isDraftResume ? "bg-blue-500" : "bg-blue-600"}`}
                >
                  {isDraftResume ? "Draft (Resumed)" : remediation.status}
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isDraftResume && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  ℹ️ This is a resumed draft. Your previously entered Root Cause
                  and Action Plan are pre-filled below.
                </p>
              </div>
            )}
            {/* Field 1: Root Cause */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Root Cause *</label>
              <Textarea
                placeholder="Why does this gap exist? What is the underlying issue?"
                value={remediation.rootCause}
                onChange={(e) =>
                  updateRemediation(gap.id, { rootCause: e.target.value })
                }
                className="min-h-24 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Explain the root cause of why this control is not in place
              </p>
            </div>

            {/* Field 2: Action Plan */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Action Plan *</label>
              <Textarea
                placeholder="Define your custom remediation steps based on NIST recommendations..."
                value={remediation.actionPlan}
                onChange={(e) =>
                  updateRemediation(gap.id, { actionPlan: e.target.value })
                }
                className="min-h-24 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Use the implementation examples above as reference
              </p>
            </div>

            {/* Field 3: Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority Level *</label>
              <Select
                value={remediation.priority}
                onValueChange={(value: any) =>
                  updateRemediation(gap.id, { priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Critical", "High", "Medium", "Low"].map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div
                className={`p-2 rounded text-xs ${getPriorityColor(
                  remediation.priority,
                )}`}
              >
                Priority set to: {remediation.priority}
              </div>
            </div>

            {/* Field 4: Timeline */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Expected Completion Date *
              </label>
              <Input
                type="date"
                value={remediation.expectedCompletionDate}
                onChange={(e) =>
                  updateRemediation(gap.id, {
                    expectedCompletionDate: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                When will this remediation be complete?
              </p>
            </div>

            {/* ========== EVIDENCE SECTION: 6-STEP GATED SEQUENCE ========== */}
            {/* Only visible in "In Progress" (Draft) view, hidden in "Active Gap" view */}
            {remediation.status === "Draft" && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-base font-semibold">Evidence Management</h3>

                {/* STEP 1: Status - Yellow Evidence Upload Restricted Box */}
                <div
                  className={cn(
                    "p-3 rounded-lg border flex items-start gap-3",
                    isCompletionDateReached || isEarlySubmissionValid
                      ? "border-green-200 bg-green-50"
                      : "border-yellow-200 bg-yellow-50",
                  )}
                >
                  {isCompletionDateReached || isEarlySubmissionValid ? (
                    <>
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-green-900">
                          Evidence Upload Unlocked
                        </p>
                        <p className="text-green-800 text-xs mt-1">
                          {isCompletionDateReached
                            ? `Expected completion date (${formatDate(remediation.expectedCompletionDate)}) has passed.`
                            : "Early submission approved - you may now upload evidence."}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-yellow-900">
                          Evidence Upload Restricted
                        </p>
                        <p className="text-yellow-800">
                          Evidence upload restricted until{" "}
                          <strong>
                            {formatDate(remediation.expectedCompletionDate)}
                          </strong>
                          .
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* STEP 2: Early Access - Request Early Submission Checkbox */}
                {!isCompletionDateReached && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="early-submission"
                        checked={isEarlySubmissionRequested}
                        onChange={(e) =>
                          handleEarlySubmissionToggle(e.target.checked)
                        }
                        className="mt-1"
                      />
                      <label
                        htmlFor="early-submission"
                        className="text-sm font-medium cursor-pointer text-blue-900"
                      >
                        Request Early Submission
                      </label>
                    </div>

                    {/* STEP 3: Internal Gate - Early Completion Justification & Implementation Confirmation */}
                    {isEarlySubmissionRequested && (
                      <div className="ml-6 space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-amber-900">
                            Early Completion Justification *
                          </label>
                          <Textarea
                            placeholder="Explain why this remediation is complete before the target date..."
                            value={earlyCompletionJustification}
                            onChange={(e) =>
                              setEarlyCompletionJustification(e.target.value)
                            }
                            className="min-h-20 resize-none text-sm"
                          />
                          <p className="text-xs text-amber-700">
                            This field is mandatory for early submission
                            requests.
                          </p>
                        </div>

                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="implementation-confirmed"
                            checked={implementationConfirmed}
                            onChange={(e) =>
                              setImplementationConfirmed(e.target.checked)
                            }
                            className="mt-1"
                          />
                          <label
                            htmlFor="implementation-confirmed"
                            className="text-sm font-medium cursor-pointer text-amber-900"
                          >
                            I confirm all remediation action steps are fully
                            implemented and operational.
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4: Classification - Evidence Document Type Dropdown (GATES THE UPLOAD ZONE) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Evidence Document Type *
                  </label>
                  <Select
                    value={documentType || ""}
                    onValueChange={(value: any) => setDocumentType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type to unlock upload" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Policy">Policy</SelectItem>
                      <SelectItem value="Log">Log</SelectItem>
                      <SelectItem value="Screenshot">Screenshot</SelectItem>
                      <SelectItem value="Approval">Approval</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select a type to classify your evidence and unlock the
                    upload zone
                  </p>
                </div>

                {/* STEP 5: Upload - Evidence Files Upload Zone (HIDDEN/DISABLED UNTIL DOCUMENT TYPE SELECTED) */}
                {documentType ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Upload Evidence Files *
                    </label>
                    <RemediationEvidenceUploadGated
                      nistId={gap.nist_id}
                      questionId={gap.id}
                      expectedCompletionDate={
                        remediation.expectedCompletionDate
                      }
                      onFilesAdded={handleFilesAdded}
                      uploadedFiles={uploadedFiles}
                      isEarlySubmissionApproved={
                        isEarlySubmissionValid || isCompletionDateReached
                      }
                    />

                    {/* Uploaded Files with Removal Option */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Uploaded Files:
                        </p>
                        <div className="space-y-1">
                          {uploadedFiles.map((file, index) => (
                            <div
                              key={`${file.name}-${index}`}
                              className="flex items-center justify-between p-2 rounded-lg bg-green-50 border border-green-200"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-green-900 truncate">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-green-700">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveFile(file.name)}
                                className="ml-2 p-1 text-red-600 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                                title="Remove file"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Non-blocking warning for Policy + non-PDF/DOCX */}
                    {documentType === "Policy" && uploadedFiles.length > 0 && (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg flex gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800">
                          Non-standard format detected for policy evidence. PDF
                          or DOCX is recommended.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-center">
                    <p className="text-sm text-gray-600">
                      Select a Document Type above to unlock the file upload
                      zone
                    </p>
                  </div>
                )}

                {/* STEP 6: Attestation - Final Legal Certification */}
                {uploadedFiles.length > 0 && documentType && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="legal-attestation"
                        checked={legalAttestationChecked}
                        onChange={(e) =>
                          setLegalAttestationChecked(e.target.checked)
                        }
                        className="mt-1"
                      />
                      <label
                        htmlFor="legal-attestation"
                        className="text-sm font-medium cursor-pointer text-red-900"
                      >
                        I certify this document reflects the current and final
                        implementation state and contains no unauthorized PII.
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Maturity Progression Info */}
            {canSubmitRemediation && (() => {
              const maturityContext = calculateMaturityContext(gap.maturityScore);
              return maturityContext.promotionMessage ? (
                <div className="p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900 font-medium">
                    ✨ {maturityContext.promotionMessage}
                  </p>
                </div>
              ) : null;
            })()}

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              {/* Submit Remediation Button */}
              {canSubmitRemediation && (
                <Button
                  onClick={handleSubmitRemediation}
                  className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Submit Remediation (Treated)
                    </>
                  )}
                </Button>
              )}

              {/* Save as Draft Button */}
              {!canSubmitRemediation && canSaveAsDraft && (
                <Button
                  onClick={handleSaveAsDraft}
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save as Draft
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
