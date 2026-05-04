import { useState, useRef, useMemo } from "react";
import { CloudUpload, X, FileText, Check, Lock, AlertCircle, FolderUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { EvidenceSourcePickerModal } from "@/components/integrations/EvidenceSourcePickerModal";
import { useAuth } from "@/context/AuthContext";
import type { ExternalFileReference } from "@/lib/integrations/types";
import type { EvidenceFile as RemediationEvidenceFile } from "@/lib/gapRemediationTypes";

interface RemediationEvidenceUploadGatedProps {
  nistId: string;
  questionId: string;
  expectedCompletionDate: string;
  onFilesAdded: (files: RemediationEvidenceFile[]) => void;
  uploadedFiles?: RemediationEvidenceFile[];
  isEarlySubmissionApproved: boolean;
}

export function RemediationEvidenceUploadGated({
  nistId,
  questionId,
  expectedCompletionDate,
  onFilesAdded,
  uploadedFiles = [],
  isEarlySubmissionApproved,
}: RemediationEvidenceUploadGatedProps) {
  const { currentUser } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const ACCEPTED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "text/plain",
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MIN_FILE_SIZE = 20 * 1024; // 20KB

  // Naming convention regex - reject generic names
  const GENERIC_NAMES = /^(image|screenshot|scan|document|upload)/i;

  // Check if upload is unlocked based on date or early submission approval
  const isUnlocked = useMemo(() => {
    if (isEarlySubmissionApproved) {
      return true; // Early submission approved
    }

    if (!expectedCompletionDate) {
      return false; // No date set
    }

    const completionDate = new Date(expectedCompletionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    completionDate.setHours(0, 0, 0, 0);

    return today >= completionDate; // Date has passed
  }, [expectedCompletionDate, isEarlySubmissionApproved]);

  // Validate file naming convention
  const validateFileNaming = (fileName: string): { valid: boolean; message?: string } => {
    if (GENERIC_NAMES.test(fileName)) {
      const nistIdPart = nistId.replace("-", ".");
      return {
        valid: false,
        message: `Security Protocol: Rename file to [${nistIdPart}][Description][Date] before proceeding. Current name "${fileName}" is generic.`,
      };
    }
    return { valid: true };
  };

  // Validate file size (minimum 20KB for audit-grade evidence)
  const validateFileSize = (fileSize: number): { valid: boolean; message?: string } => {
    if (fileSize < MIN_FILE_SIZE) {
      return {
        valid: false,
        message: "File size insufficient for audit-grade evidence. Minimum size is 20KB.",
      };
    }
    return { valid: true };
  };

  // Check for duplicate files
  const validateDuplicates = (
    fileName: string,
    fileSize: number
  ): { valid: boolean; message?: string } => {
    const isDuplicate = uploadedFiles.some(
      (f) => f.name === fileName && f.size === fileSize
    );

    if (isDuplicate) {
      return {
        valid: false,
        message: `Duplicate Evidence: This file is already assigned to ${nistId}.`,
      };
    }
    return { valid: true };
  };

  // Validate file type
  const validateFileType = (file: File): { valid: boolean; message?: string } => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return {
        valid: false,
        message: `${file.name} is not supported. Please upload PDF, DOCX, JPG, PNG, or TXT files.`,
      };
    }
    return { valid: true };
  };

  const validateFile = (file: File): { valid: boolean; message?: string } => {
    // Check file type
    const typeValidation = validateFileType(file);
    if (!typeValidation.valid) {
      return typeValidation;
    }

    // Check file size (max)
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        message: `${file.name} exceeds 10MB limit.`,
      };
    }

    // Check file size (min)
    const sizeValidation = validateFileSize(file.size);
    if (!sizeValidation.valid) {
      return sizeValidation;
    }

    // Check naming convention
    const namingValidation = validateFileNaming(file.name);
    if (!namingValidation.valid) {
      return namingValidation;
    }

    // Check for duplicates
    const duplicateValidation = validateDuplicates(file.name, file.size);
    if (!duplicateValidation.valid) {
      return duplicateValidation;
    }

    return { valid: true };
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: RemediationEvidenceFile[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateFile(file);

      if (validation.valid) {
        validFiles.push({
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          type: file.type,
        });
      } else {
        errors.push(validation.message || `${file.name}: validation failed`);
      }
    }

    // Show errors
    if (errors.length > 0) {
      errors.forEach((error) => {
        toast({
          title: "File Validation Error",
          description: error,
          variant: "destructive",
        });
      });
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    try {
      // Simulate upload process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Notify parent component of new files
      onFilesAdded(validFiles);

      // Show success toast
      toast({
        title: "Success!",
        description: `${validFiles.length} file${validFiles.length !== 1 ? "s" : ""} uploaded successfully.`,
      });

      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Upload error",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isUnlocked) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isUnlocked) return;
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isUnlocked) return;
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (fileName: string) => {
    // Note: In a real implementation, this would trigger a state update in the parent
    console.log("Would remove file:", fileName);
  };

  // Format date for display
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

  return (
    <div className="space-y-4">
      {/* Locked/Unlocked Status */}
      <div
        className={cn(
          "p-3 rounded-lg border flex items-start gap-3",
          isUnlocked
            ? "border-green-200 bg-green-50"
            : "border-yellow-200 bg-yellow-50"
        )}
      >
        {isUnlocked ? (
          <>
            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-green-900">Evidence Upload Unlocked</p>
              <p className="text-green-800 text-xs mt-1">
                {isEarlySubmissionApproved
                  ? "Early submission approved - you may now upload evidence."
                  : `Expected completion date (${formatDate(expectedCompletionDate)}) has passed.`}
              </p>
            </div>
          </>
        ) : (
          <>
            <Lock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-900">Evidence Upload Restricted</p>
              <p className="text-yellow-800">
                Evidence upload restricted until{" "}
                <strong>{formatDate(expectedCompletionDate)}</strong>.
              </p>
            </div>
          </>
        )}
      </div>

      {isUnlocked && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Add from this device (below) or from a connected cloud app.</p>
          <Button type="button" variant="secondary" className="shrink-0 gap-2" onClick={() => setSourcePickerOpen(true)}>
            <FolderUp className="h-4 w-4" />
            Choose evidence source
          </Button>
        </div>
      )}

      <EvidenceSourcePickerModal
        open={sourcePickerOpen}
        onOpenChange={setSourcePickerOpen}
        context={{ surface: "nist-csf/gap-remediation", frameworkId: "nist-csf", questionId, nistId }}
        localUploadDisabled={!isUnlocked}
        onLocalFiles={(fileList) => {
          if (!isUnlocked) return;
          const dt = new DataTransfer();
          fileList.forEach((f) => dt.items.add(f));
          void handleFileSelect(dt.files);
        }}
        onExternal={(ref: ExternalFileReference, mode) => {
          if (!isUnlocked) return;
          setIsUploading(true);
          window.setTimeout(() => {
            onFilesAdded([
              {
                name: ref.name,
                size: ref.sizeBytes,
                uploadedAt: new Date().toISOString(),
                type: ref.mimeType,
                url: `extern://${ref.providerId}/${ref.externalFileId}`,
                sourceKind: "cloud",
                storageMode: mode,
                providerId: ref.providerId,
                externalFileId: ref.externalFileId,
                externalPath: ref.path,
                attachedBy: currentUser?.fullName ?? currentUser?.email,
              },
            ]);
            setIsUploading(false);
            toast({ title: "Evidence attached", description: ref.name });
          }, 400);
        }}
        title="Add remediation evidence"
      />

      {/* Upload Zone - Locked State — drag/drop and click still use local file input */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => isUnlocked && fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          isUnlocked ? "cursor-pointer" : "cursor-not-allowed",
          isUnlocked && isDragging
            ? "border-blue-500 bg-blue-50"
            : isUnlocked
              ? "border-muted-foreground/25 bg-muted/50 hover:border-muted-foreground/50"
              : "border-muted-foreground/15 bg-muted/30",
          !isUnlocked && "opacity-60 grayscale"
        )}
        style={!isUnlocked ? { pointerEvents: "none" } : {}}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.jpg,.jpeg,.png,.txt"
          onChange={(e) => isUnlocked && handleFileSelect(e.target.files)}
          disabled={isUploading || !isUnlocked}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          {isUploading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          ) : isUnlocked ? (
            <CloudUpload className="h-8 w-8 text-muted-foreground" />
          ) : (
            <Lock className="h-8 w-8 text-muted-foreground/50" />
          )}
          <div className="text-center">
            <p className="text-sm font-medium">
              {isUploading
                ? "Uploading..."
                : isUnlocked
                  ? "Upload Evidence Files"
                  : "Evidence Upload Locked"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isUnlocked
                ? "Drag and drop or click to upload PDF, DOCX, JPG, PNG, or TXT files (min 20KB, max 10MB)"
                : `Unlock on ${formatDate(expectedCompletionDate)} or request early submission`}
            </p>
          </div>
        </div>
      </div>

      {/* Validation Requirements Info */}
      {isUnlocked && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-blue-900">File Validation Requirements:</p>
          <ul className="text-xs text-blue-800 space-y-1 ml-3">
            <li>✓ File name cannot be generic (image, screenshot, scan, document, upload)</li>
            <li>✓ Minimum 20KB for audit-grade evidence</li>
            <li>✓ Maximum 10MB file size</li>
            <li>✓ No duplicate files (same name and size)</li>
            <li>✓ Supported: PDF, DOCX, JPG, PNG, TXT</li>
          </ul>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Uploaded Files</p>
            <Badge variant="secondary">{uploadedFiles.length}</Badge>
          </div>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Check className="h-4 w-4 text-green-600" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.name);
                    }}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Text */}
      <p className="text-xs text-muted-foreground">
        Files will be tagged as "Remediation Plan" evidence for {nistId} and appear in the
        Evidence Repository.
      </p>
    </div>
  );
}
