import { GapRemediation } from "@/lib/gapRemediationTypes";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download, ExternalLink, Calendar, AlertCircle } from "lucide-react";

interface TreatedGapPreviewProps {
  remediation: GapRemediation | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TreatedGapPreview({ remediation, isOpen, onOpenChange }: TreatedGapPreviewProps) {
  if (!remediation) return null;

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

  const completionDate = new Date(remediation.expectedCompletionDate);
  const formattedDate = completionDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hasEvidence = remediation.evidenceFiles && remediation.evidenceFiles.length > 0;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-2xl">{remediation.function} | {remediation.nistId}</SheetTitle>
          <SheetDescription className="text-base mt-2">
            {remediation.question}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 my-6">
          <div className="space-y-6 pr-4">
            {/* Status and Priority Row */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Status & Priority
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary">{remediation.status}</Badge>
                <Badge variant="outline" className={`${getPriorityColor(remediation.priority)}`}>
                  {remediation.priority} Priority
                </Badge>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Expected Completion
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="font-medium">{formattedDate}</span>
              </div>
            </div>

            {/* Root Cause */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Root Cause Analysis
              </p>
              <div className="bg-muted/50 rounded-lg p-4 border border-muted">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {remediation.rootCause}
                </p>
              </div>
            </div>

            {/* Action Plan */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Remediation Action Plan
              </p>
              <div className="bg-muted/50 rounded-lg p-4 border border-muted">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {remediation.actionPlan}
                </p>
              </div>
            </div>

            {/* Category Info */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Details
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-3 border border-muted">
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <p className="text-sm font-medium">{remediation.category}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 border border-muted">
                  <p className="text-xs text-muted-foreground mb-1">Function</p>
                  <p className="text-sm font-medium">{remediation.function}</p>
                </div>
              </div>
            </div>

            {/* Evidence Section */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Evidence Files
              </p>
              {hasEvidence ? (
                <div className="space-y-2">
                  {remediation.evidenceFiles!.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-green-200 bg-green-50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-green-700 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-green-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-green-700">
                            {(file.size / 1024).toFixed(2)} KB • {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-700 hover:text-green-900 hover:bg-green-100 flex-shrink-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-50 border border-orange-200">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-900">No Evidence Uploaded</p>
                    <p className="text-xs text-orange-700 mt-1">
                      No supporting evidence files have been provided for this remediation yet.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="space-y-3 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Created: {new Date(remediation.createdAt).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                Last Updated: {new Date(remediation.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            className="flex-1 gap-2"
            disabled={!hasEvidence}
          >
            <ExternalLink className="h-4 w-4" />
            View All Evidence
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
