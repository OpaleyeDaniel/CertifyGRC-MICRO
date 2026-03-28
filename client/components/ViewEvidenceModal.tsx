import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatFileSize } from "@/lib/fileUtils";

interface ViewEvidenceModalProps {
  open: boolean;
  onClose: () => void;
  evidence: {
    id: string;
    nist_id: string;
    document_name: string;
    file_size: number;
    uploaded_at: string;
    evidence_source: string;
    assessment_answer: string | null;
  } | null;
}

export function ViewEvidenceModal({ open, onClose, evidence }: ViewEvidenceModalProps) {
  if (!evidence) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const getAnswerColor = (answer: string | null) => {
    switch (answer) {
      case "Yes":
        return "bg-green-100 text-green-800";
      case "No":
        return "bg-red-100 text-red-800";
      case "Partial":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Evidence Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Document Icon and Name */}
          <div className="flex items-start gap-3 pb-4 border-b">
            <div className="rounded-lg bg-blue-100 p-2 flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate text-sm">{evidence.document_name}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatFileSize(evidence.file_size)}</p>
            </div>
          </div>

          {/* NIST Reference */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              NIST Reference
            </label>
            <code className="text-sm bg-muted px-2 py-1 rounded font-mono font-semibold inline-block mt-1">
              {evidence.nist_id}
            </code>
          </div>

          {/* Assessment Answer */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Assessment Answer
            </label>
            <div className="mt-1">
              <Badge className={getAnswerColor(evidence.assessment_answer)}>
                {evidence.assessment_answer || "—"}
              </Badge>
            </div>
          </div>

          {/* Evidence Source */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Source
            </label>
            <Badge
              variant="outline"
              className={`mt-1 ${
                evidence.evidence_source === "Initial Assessment"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-purple-50 text-purple-700 border-purple-200"
              }`}
            >
              {evidence.evidence_source}
            </Badge>
          </div>

          {/* Upload Date */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Uploaded
            </label>
            <p className="text-sm text-foreground mt-1">{formatDate(evidence.uploaded_at)}</p>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                // In a real implementation, this would download or open the file
                alert(`Opening: ${evidence.document_name}`);
              }}
            >
              View Document
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
