import { useState, useRef } from "react";
import { CloudUpload, X, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface EvidenceFile {
  name: string;
  size: number;
  uploadedAt: string;
  type: string;
}

interface RemediationEvidenceUploadProps {
  nistId: string;
  questionId: string;
  onFilesAdded: (files: EvidenceFile[]) => void;
  uploadedFiles?: EvidenceFile[];
}

export function RemediationEvidenceUpload({
  nistId,
  questionId,
  onFilesAdded,
  uploadedFiles = [],
}: RemediationEvidenceUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const ACCEPTED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png", "text/plain"];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: `${file.name} is not supported. Please upload PDF, DOCX, JPG, PNG, or TXT files.`,
        variant: "destructive",
      });
      return false;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: `${file.name} exceeds 10MB limit.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: EvidenceFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (validateFile(file)) {
        validFiles.push({
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          type: file.type,
        });
      }
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
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (fileName: string) => {
    // Note: In a real implementation, this would trigger a state update in the parent
    console.log("Would remove file:", fileName);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-muted-foreground/25 bg-muted/50 hover:border-muted-foreground/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.jpg,.jpeg,.png,.txt"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          {isUploading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          ) : (
            <CloudUpload className="h-8 w-8 text-muted-foreground" />
          )}
          <div className="text-center">
            <p className="text-sm font-medium">
              {isUploading ? "Uploading..." : "Upload Evidence Files"}
            </p>
            <p className="text-xs text-muted-foreground">
              Drag and drop or click to upload PDF, DOCX, JPG, PNG, or TXT files (max 10MB)
            </p>
          </div>
        </div>
      </div>

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
        Files will be tagged as "Remediation Plan" evidence for {nistId} and appear in the Evidence Repository.
      </p>
    </div>
  );
}
