import { useMemo } from "react";
import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";
import { useRiskAssessment } from "@/hooks/useRiskAssessment";
import { useGapRemediation } from "@/hooks/useGapRemediation";
import { useContinuousImprovement } from "@/hooks/useContinuousImprovement";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";

interface RiskPendingListProps {
  onStartAssessment: (
    questionId: string,
    nistId: string,
    gapDescription: string,
    functionName: string,
    category: string
  ) => void;
}

export function RiskPendingList({ onStartAssessment }: RiskPendingListProps) {
  const { getQuestionsWithGapFlag } = useAssessmentEngine();
  const { allRiskAssessments } = useRiskAssessment();
  const { allRemediations } = useGapRemediation();
  const { getCIRecord } = useContinuousImprovement();

  const gapQuestions = useMemo(() => {
    return getQuestionsWithGapFlag().filter((q) => q.gap_flag === true);
  }, [getQuestionsWithGapFlag]);

  // A gap appears in the pending list when:
  //   (a) It has a Treated remediation AND no risk assessment at all yet, OR
  //   (b) Its risk assessment was reset back to "Pending" (revision rework path)
  const unassessedGaps = useMemo(() => {
    return gapQuestions.filter((gap) => {
      const remediation = allRemediations[gap.id];
      const isRemediated = remediation?.status === "Treated";
      if (!isRemediated) return false;

      const existingRisk = Object.values(allRiskAssessments).find(
        (r) => r.questionId === gap.id
      );
      // Show if: no risk record yet, OR risk was explicitly reset to Pending for revision
      return !existingRisk || existingRisk.status === "Pending";
    });
  }, [gapQuestions, allRiskAssessments, allRemediations]);

  if (unassessedGaps.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <ArrowRight className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-900">All Gaps Assessed</p>
            <p className="text-sm text-blue-700 mt-1">
              All identified gaps have been assessed for risk. Review the Risk Register to see completed assessments.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-orange-600" />
        <h2 className="text-lg font-semibold">Pending Risk Assessments</h2>
        <Badge variant="destructive">{unassessedGaps.length}</Badge>
      </div>

      {/* Pending Gaps List */}
      <div className="space-y-4">
        {unassessedGaps.map((gap) => {
          const ciRecord = getCIRecord(gap.id);
          const isRevision = !!ciRecord && ciRecord.status !== "resubmitted";
          const existingRisk = Object.values(allRiskAssessments).find(
            (r) => r.questionId === gap.id
          );
          const isResuming = isRevision && !!existingRisk;

          return (
            <Card key={gap.id} className={`hover:border-primary/50 transition-all ${isRevision ? "border-orange-300 bg-orange-50/30" : ""}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono font-semibold">
                        {gap.nist_id}
                      </code>
                      {gap.userAnswer === "No" ? (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          No
                        </Badge>
                      ) : gap.userAnswer === "Partial" ? (
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                          Partial
                        </Badge>
                      ) : null}
                      {isRevision ? (
                        <Badge className="text-xs bg-orange-100 text-orange-800 border-orange-300 gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Revision
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                          Unassessed
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base font-semibold mb-1">{gap.question}</h3>
                    <p className="text-sm text-muted-foreground">
                      {gap.category} • {gap.function}
                    </p>
                    {isRevision && ciRecord?.auditorRiskComment && (
                      <div className="mt-2 p-2 bg-orange-100 border border-orange-200 rounded text-xs text-orange-900">
                        <span className="font-semibold">Auditor comment: </span>
                        {ciRecord.auditorRiskComment}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() =>
                      onStartAssessment(gap.id, gap.nist_id, gap.question, gap.function, gap.category)
                    }
                    className={`gap-2 flex-shrink-0 ${isRevision ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                  >
                    {isResuming ? (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Revise Assessment
                      </>
                    ) : (
                      <>
                        Start Assessment
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
