import { AssessmentQuestion } from "@/lib/assessmentQuestions";
import { GapRemediation } from "@/lib/gapRemediationTypes";
import { RiskAssessment } from "@/lib/gapRiskTypes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportPageCardProps {
  question: AssessmentQuestion;
  remediation?: GapRemediation;
  riskAssessment?: RiskAssessment;
  onClick: () => void;
  isDisabled?: boolean;
}

export function ReportPageCard({
  question,
  remediation,
  riskAssessment,
  onClick,
  isDisabled = false,
}: ReportPageCardProps) {
  // Determine assessment status color
  const getAssessmentBadge = () => {
    if (!question.userAnswer) {
      return {
        label: "Pending",
        color: "bg-gray-100 text-gray-700",
        icon: null,
      };
    }

    // Check for all YES variations (maturity 3, 4, 5)
    if (question.userAnswer === "Yes" || question.userAnswer?.startsWith("Yes")) {
      let label = "ANSWERED: YES";
      if (question.userAnswer === "Yes - Managed") {
        label = "YES (Managed - L4)";
      } else if (question.userAnswer === "Yes - Optimized") {
        label = "YES (Optimized - L5)";
      }
      return {
        label,
        color: "bg-green-500 text-white",
        icon: <CheckCircle2 className="h-3 w-3" />,
      };
    }

    switch (question.userAnswer) {
      case "Partial":
        return {
          label: "PARTIAL",
          color: "bg-amber-500 text-white",
          icon: <AlertCircle className="h-3 w-3" />,
        };
      case "No":
        return {
          label: "NO",
          color: "bg-red-500 text-white",
          icon: <AlertCircle className="h-3 w-3" />,
        };
      default:
        return {
          label: "Unknown",
          color: "bg-gray-100 text-gray-700",
          icon: null,
        };
    }
  };

  // Determine risk level color
  const getRiskLevelBadge = () => {
    if (!riskAssessment) {
      return {
        label: "Not Assessed",
        color: "bg-gray-100 text-gray-700",
      };
    }

    const level = riskAssessment.postTreatmentRiskLevel || riskAssessment.inherentRiskLevel;
    switch (level) {
      case "LOW":
        return {
          label: "Low Risk",
          color: "bg-green-100 text-green-700",
        };
      case "MEDIUM":
        return {
          label: "Medium Risk",
          color: "bg-yellow-100 text-yellow-700",
        };
      case "HIGH":
        return {
          label: "High Risk",
          color: "bg-red-100 text-red-700",
        };
      default:
        return {
          label: "Unknown",
          color: "bg-gray-100 text-gray-700",
        };
    }
  };

  // Determine audit readiness
  const getAuditReadiness = () => {
    // Ready only if:
    // 1. Status is "Treated" (final submission)
    // 2. Has evidence files
    // 3. Is remediation evidence (not initial assessment evidence)
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

  // Get Risk Assessment maturity score badge
  const getRiskMaturityBadge = () => {
    if (!riskAssessment || riskAssessment.status !== "Completed" || riskAssessment.maturityScore === undefined) {
      return null;
    }

    return {
      label: `L${riskAssessment.maturityScore}`,
      color: "bg-purple-100 text-purple-700",
      score: riskAssessment.maturityScore,
    };
  };

  const assessmentBadge = getAssessmentBadge();
  const riskBadge = getRiskLevelBadge();
  const readinessBadge = getAuditReadiness();
  const riskMaturityBadge = getRiskMaturityBadge();

  return (
    <Card
      className={cn(
        "w-full transition-all",
        isDisabled
          ? "opacity-60 bg-gray-50 cursor-not-allowed"
          : "cursor-pointer hover:shadow-md hover:border-primary"
      )}
      onClick={() => !isDisabled && onClick()}
    >
      <div className="p-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            {/* NIST ID and Subcategory */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-lg text-primary">{question.nist_id}</span>
              <span className="text-sm text-muted-foreground font-medium">
                {question.category}
              </span>
            </div>

            {/* Question Text */}
            <p className="text-base font-medium text-gray-900 line-clamp-2">
              {question.question}
            </p>
          </div>

          {/* Status Indicators - Right Side */}
          <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end lg:gap-3">
            {/* Assessment Status */}
            <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium", assessmentBadge.color)}>
              {assessmentBadge.icon}
              <span>{assessmentBadge.label}</span>
            </div>

            {/* Risk Level - Hidden for all YES answers (maturity 3, 4, 5) */}
            {!question.userAnswer?.startsWith("Yes") && (
              <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium", riskBadge.color)}>
                <span>{riskBadge.label}</span>
              </div>
            )}

            {/* Audit Readiness - Hidden for all YES answers (maturity 3, 4, 5) */}
            {!question.userAnswer?.startsWith("Yes") && (
              <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium", readinessBadge.color)}>
                {readinessBadge.icon}
                <span>{readinessBadge.label}</span>
              </div>
            )}

            {/* Risk Assessment Maturity Score - Hidden for all YES answers (maturity 3, 4, 5) */}
            {!question.userAnswer?.startsWith("Yes") && riskMaturityBadge && (
              <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium", riskMaturityBadge.color)}>
                <span>Risk Assessment: {riskMaturityBadge.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            {/* Hide Remediation Status details for all YES answers (maturity 3, 4, 5) */}
            {!question.userAnswer?.startsWith("Yes") && remediation && (
              <span>
                Status:{" "}
                <span
                  className={cn(
                    "font-medium ml-1",
                    remediation.status === "Open"
                      ? "text-blue-600"
                      : remediation.status === "Draft"
                        ? "text-amber-600"
                        : "text-green-600"
                  )}
                >
                  {remediation.status}
                </span>
              </span>
            )}
            {/* Hide Due date for all YES answers (maturity 3, 4, 5) */}
            {!question.userAnswer?.startsWith("Yes") && remediation?.expectedCompletionDate && (
              <span>
                Due: <span className="font-medium ml-1">{remediation.expectedCompletionDate}</span>
              </span>
            )}
          </div>

          {/* Pending Assessment Badge */}
          {isDisabled && (
            <Badge variant="outline" className="bg-yellow-50">
              Pending Assessment
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
