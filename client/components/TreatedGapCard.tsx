import { GapRemediation } from "@/lib/gapRemediationTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye, Check, X } from "lucide-react";

interface TreatedGapCardProps {
  remediation: GapRemediation;
  onPreview: (remediation: GapRemediation) => void;
}

export function TreatedGapCard({ remediation, onPreview }: TreatedGapCardProps) {
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

  const hasEvidence = remediation.evidenceFiles && remediation.evidenceFiles.length > 0;
  const completionDate = new Date(remediation.expectedCompletionDate);
  const formattedDate = completionDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="hover:border-primary/50 transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header Row: NIST ID and Function */}
          <div className="flex items-start gap-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                {remediation.function} | <code className="font-mono font-semibold text-foreground">{remediation.nistId}</code>
              </p>
              <h3 className="text-base font-semibold mt-1 line-clamp-2">
                {remediation.question}
              </h3>
            </div>
          </div>

          {/* Metadata Row: Priority, Completion Date, and Preview */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={`text-xs font-medium ${getPriorityColor(remediation.priority)}`}
              >
                {remediation.priority} Priority
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onPreview(remediation)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          </div>

          {/* Status Badge and Evidence Status Indicator */}
          <div className="flex items-center gap-2 pt-1">
            <Badge
              variant="secondary"
              className="text-xs"
            >
              {remediation.status}
            </Badge>

            {/* Evidence Status Indicator - Right of Treated Badge */}
            {hasEvidence ? (
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-green-600">Evidence</span>
                <Check className="h-3.5 w-3.5 text-green-600" />
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-red-600">No Evidence</span>
                <X className="h-3.5 w-3.5 text-red-600" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
