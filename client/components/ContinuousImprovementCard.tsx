import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ContinuousImprovementItem } from "@/hooks/useContinuousImprovement";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContinuousImprovementCardProps {
  item: ContinuousImprovementItem;
  onResumeRework: (controlId: string) => void;
}

export function ContinuousImprovementCard({
  item,
  onResumeRework,
}: ContinuousImprovementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rawOverallComment = item.auditorOverallComment || "";

  // UI-only parsing fallback for legacy aggregated comments.
  // Keeps section comments in dedicated boxes instead of duplicating in overall.
  const commentParts = rawOverallComment
    ? rawOverallComment.split(" | ").map((part) => part.trim()).filter(Boolean)
    : [];
  const parsedGapComment = commentParts
    .find((part) => part.startsWith("Gap Analysis & Remediation Comments:"))
    ?.replace("Gap Analysis & Remediation Comments:", "")
    .trim();
  const parsedRiskComment = commentParts
    .find((part) => part.startsWith("Risk Assessment Comments:"))
    ?.replace("Risk Assessment Comments:", "")
    .trim();
  const parsedInitialComment = commentParts
    .find((part) => part.startsWith("Initial Assessment Comments:"))
    ?.replace("Initial Assessment Comments:", "")
    .trim();
  const gapComment = item.auditorGapComment || parsedGapComment;
  const riskComment = item.auditorRiskComment || parsedRiskComment;
  const overallComment = item.auditorOverallComment || "";
  const initialComment = item.auditorInitialComment || parsedInitialComment;

  // Get status badge styling
  const getStatusBadge = () => {
    switch (item.status) {
      case "revision_required":
        return {
          label: "Revision Required",
          color: "bg-orange-100 text-orange-700 border-orange-200",
          icon: AlertCircle,
        };
      case "in_progress":
        return {
          label: "In Progress",
          color: "bg-blue-100 text-blue-700 border-blue-200",
          icon: Clock,
        };
      case "resubmitted":
        return {
          label: "Resubmitted",
          color: "bg-green-100 text-green-700 border-green-200",
          icon: CheckCircle2,
        };
      default:
        return {
          label: "Unknown",
          color: "bg-gray-100 text-gray-700 border-gray-200",
          icon: Clock,
        };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "border transition-all cursor-pointer",
          isExpanded
            ? "border-orange-300 bg-orange-50"
            : "border-gray-200 hover:border-orange-200 hover:bg-orange-50/50"
        )}
      >
        <div
          className="p-4 space-y-3"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Header - Control ID and Status */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-gray-900">{item.nistId}</h3>
                <Badge className="text-xs border bg-red-100 text-red-700 border-red-200">
                  REVISION
                </Badge>
                <Badge
                  className={cn(
                    "text-xs border flex items-center gap-1",
                    statusBadge.color
                  )}
                >
                  <StatusIcon className="h-3 w-3" />
                  {statusBadge.label}
                </Badge>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">
                {item.controlTitle}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-gray-600 transition-transform flex-shrink-0 ml-2",
                isExpanded && "rotate-180"
              )}
            />
          </div>

          {/* Summary Row - Category, Function, Review Date */}
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="bg-white">
              {item.function}
            </Badge>
            <span className="text-muted-foreground">
              {formatDate(item.reviewDate)}
            </span>
          </div>
        </div>

        {/* Expandable Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-gray-200 p-4 space-y-4">
                {/* Category and Function Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">
                      Category
                    </p>
                    <p className="text-gray-900">{item.category}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">
                      Function
                    </p>
                    <p className="text-gray-900">{item.function}</p>
                  </div>
                </div>

                {/* Auditor Feedback */}
                <div className="space-y-2">
                  {initialComment && (
                    <div className="bg-blue-50 rounded p-3 border border-blue-200">
                      <p className="text-xs font-semibold text-blue-900 mb-1">
                        Auditor Comment: Initial Assessment
                      </p>
                      <p className="text-sm text-blue-900">{initialComment}</p>
                    </div>
                  )}
                  {gapComment && (
                    <div className="bg-amber-50 rounded p-3 border border-amber-200">
                      <p className="text-xs font-semibold text-amber-900 mb-1">
                        Auditor Comment: Gap Analysis & Remediation Comments
                      </p>
                      <p className="text-sm text-amber-900">{gapComment}</p>
                    </div>
                  )}
                  {riskComment && (
                    <div className="bg-purple-50 rounded p-3 border border-purple-200">
                      <p className="text-xs font-semibold text-purple-900 mb-1">
                        Auditor Comment: Risk Assessment
                      </p>
                      <p className="text-sm text-purple-900">{riskComment}</p>
                    </div>
                  )}
                </div>

                {/* Auditor Scores */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {item.initialAuditorScore !== undefined && (
                    <div className="bg-blue-50 rounded p-3 border border-blue-200">
                      <p className="text-xs font-semibold text-blue-900 mb-1">
                        Initial Assessment
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        {item.initialAuditorScore}
                      </p>
                    </div>
                  )}
                  {item.remediationAuditorScore !== undefined && (
                    <div className="bg-amber-50 rounded p-3 border border-amber-200">
                      <p className="text-xs font-semibold text-amber-900 mb-1">
                        Gap & Remediation
                      </p>
                      <p className="text-lg font-bold text-amber-600">
                        {item.remediationAuditorScore}
                      </p>
                    </div>
                  )}
                  {item.riskAuditorScore !== undefined && (
                    <div className="bg-purple-50 rounded p-3 border border-purple-200">
                      <p className="text-xs font-semibold text-purple-900 mb-1">
                        Risk Assessment
                      </p>
                      <p className="text-lg font-bold text-purple-600">
                        {item.riskAuditorScore}
                      </p>
                    </div>
                  )}
                </div>

                {/* Auditor Comment */}
                {overallComment && (
                  <div className="bg-orange-50 rounded p-3 border border-orange-200">
                    <p className="text-xs font-semibold text-orange-900 mb-2">
                      Auditor Overall Comment
                    </p>
                    <p className="text-sm text-orange-900">
                      {overallComment}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground pt-3 border-t border-gray-200">
                  <div>
                    <p className="font-semibold text-gray-700 mb-1">
                      Review Date
                    </p>
                    <p>{formatDate(item.reviewDate)}</p>
                  </div>
                  {item.lastResumedAt && (
                    <div>
                      <p className="font-semibold text-gray-700 mb-1">
                        Last Resumed
                      </p>
                      <p>{formatDate(item.lastResumedAt)}</p>
                    </div>
                  )}
                </div>

                {(item.auditorOverallScore !== undefined || item.auditorScore !== undefined) && (
                  <div className="bg-slate-50 rounded p-3 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-700 mb-1">Auditor Overall Score</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {(item.auditorOverallScore ?? item.auditorScore)}/5
                    </p>
                  </div>
                )}

                {/* Resume Rework Button */}
                {item.status !== "resubmitted" && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onResumeRework(item.controlId);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Resume Rework
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
