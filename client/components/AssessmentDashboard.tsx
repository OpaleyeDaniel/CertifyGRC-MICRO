import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";
import { ArrowRight, CheckCircle2, AlertCircle, FileText } from "lucide-react";

const functionDescriptions: Record<string, string> = {
  GOVERN: "Establish the organization's governance structure for cybersecurity",
  IDENTIFY: "Understand and prioritize information assets and risks",
  PROTECT: "Implement safeguards to prevent or reduce impacts",
  DETECT: "Define and implement activities to discover cybersecurity events",
  RESPOND: "Take actions regarding detected cybersecurity incidents",
  RECOVER: "Restore normal operations and improve capabilities",
};

const functionColors: Record<string, { bg: string; text: string; border: string }> = {
  GOVERN: { bg: "bg-blue-50 dark:bg-blue-950", text: "text-blue-700 dark:text-blue-200", border: "border-blue-200 dark:border-blue-700" },
  IDENTIFY: { bg: "bg-purple-50 dark:bg-purple-950", text: "text-purple-700 dark:text-purple-200", border: "border-purple-200 dark:border-purple-700" },
  PROTECT: { bg: "bg-green-50 dark:bg-green-950", text: "text-green-700 dark:text-green-200", border: "border-green-200 dark:border-green-700" },
  DETECT: { bg: "bg-amber-50 dark:bg-amber-950", text: "text-amber-700 dark:text-amber-200", border: "border-amber-200 dark:border-amber-700" },
  RESPOND: { bg: "bg-red-50 dark:bg-red-950", text: "text-red-700 dark:text-red-200", border: "border-red-200 dark:border-red-700" },
  RECOVER: { bg: "bg-cyan-50 dark:bg-cyan-950", text: "text-cyan-700 dark:text-cyan-200", border: "border-cyan-200 dark:border-cyan-700" },
};

interface AssessmentDashboardProps {
  onSelectFunction: (functionName: string) => void;
}

export function AssessmentDashboard({ onSelectFunction }: AssessmentDashboardProps) {
  const { nistFunctions, getFunctionMetrics } = useAssessmentEngine();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">NIST CSF 2.0 Assessment Dashboard</h2>
        <p className="text-muted-foreground">
          Select a NIST Function to begin the assessment. Progress is automatically saved as you work.
        </p>
      </div>

      {/* Function Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nistFunctions.map((functionName) => {
          const metrics = getFunctionMetrics(functionName);
          const completionPercent = metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0;
          const colors = functionColors[functionName];
          const description = functionDescriptions[functionName];

          return (
            <Card
              key={functionName}
              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${colors.border}`}
              onClick={() => onSelectFunction(functionName)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className={`text-lg ${colors.text}`}>{functionName}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {description}
                    </p>
                  </div>
                  <FileText className={`h-5 w-5 flex-shrink-0 ${colors.text}`} />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Questions</p>
                    <p className="text-2xl font-bold">{metrics.total}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Answered</p>
                    <p className="text-2xl font-bold text-green-600">{metrics.completed}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">Progress</span>
                    <span className="text-xs font-semibold">{completionPercent}%</span>
                  </div>
                  <Progress value={completionPercent} className="h-2" />
                </div>

                {/* Gap Indicator */}
                {metrics.gaps > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded bg-amber-50 dark:bg-amber-950/20">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span className="text-xs text-amber-700 dark:text-amber-300">
                      {metrics.gaps} potential gap{metrics.gaps !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                {/* Status Badge */}
                {metrics.completed === metrics.total && metrics.total > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded bg-green-50 dark:bg-green-950/20">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">
                      Complete
                    </span>
                  </div>
                )}

                {/* CTA Button */}
                <Button
                  variant="ghost"
                  className="w-full justify-between group"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFunction(functionName);
                  }}
                >
                  <span>{metrics.completed === metrics.total ? "Review" : "Continue"}</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
