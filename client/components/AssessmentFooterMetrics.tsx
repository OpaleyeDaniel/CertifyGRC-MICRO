import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, CheckCircle2, AlertCircle, TrendingUp, Zap } from "lucide-react";

export interface FooterMetricsProps {
  totalQuestions: number;
  completed: number;
  detectedGaps: number;
  completionRate: number;
  readinessScore?: number;
}

export function AssessmentFooterMetrics({
  totalQuestions,
  completed,
  detectedGaps,
  completionRate,
  readinessScore,
}: FooterMetricsProps) {
  // Determine readiness score color based on value
  const getReadinessColor = (score: number | undefined) => {
    if (score === undefined || score === 0) return "text-gray-400";
    if (score >= 4) return "text-success";
    if (score >= 3) return "text-blue-600";
    return "text-warning";
  };

  const readinessColor = getReadinessColor(readinessScore);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
      {/* Total Questions */}
      <Card className="border border-gray-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Questions</p>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalQuestions}</p>
            <p className="text-xs text-gray-500">across all functions</p>
          </div>
        </CardContent>
      </Card>

      {/* Completed */}
      <Card className="border border-gray-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completed</p>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
            <p className="text-2xl font-bold text-success">{completed}</p>
            <p className="text-xs text-gray-500">answered</p>
          </div>
        </CardContent>
      </Card>

      {/* Detected Gaps */}
      <Card className="border border-gray-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Detected Gaps</p>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-destructive">{detectedGaps}</p>
            <p className="text-xs text-gray-500">maturity &lt; 3</p>
          </div>
        </CardContent>
      </Card>

      {/* Completion Rate */}
      <Card className="border border-gray-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completion Rate</p>
              <TrendingUp className="h-4 w-4 text-[#0052CC]" />
            </div>
            <p className="text-2xl font-bold text-[#0052CC]">{completionRate}%</p>
            <p className="text-xs text-gray-500">progress</p>
          </div>
        </CardContent>
      </Card>

      {/* Readiness Score */}
      {readinessScore !== undefined && (
        <Card className="border border-gray-200">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Readiness Score</p>
                <Zap className={`h-4 w-4 ${readinessColor}`} />
              </div>
              <p className={`text-2xl font-bold ${readinessColor}`}>
                {readinessScore.toFixed(1)}/5
              </p>
              <p className="text-xs text-gray-500">avg maturity</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
