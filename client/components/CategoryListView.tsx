import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

interface CategoryListViewProps {
  functionName: string;
  onBack: () => void;
  onSelectCategory: (categoryName: string) => void;
}

export function CategoryListView({
  functionName,
  onBack,
  onSelectCategory,
}: CategoryListViewProps) {
  const { getCategoriesForFunction, getCategoryMetrics } = useAssessmentEngine();

  const categories = getCategoriesForFunction(functionName);

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        <h2 className="text-2xl font-bold">{functionName} Function</h2>
        <p className="text-muted-foreground">
          Select a category to view and answer the assessment questions within that area.
        </p>
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        {categories.map((category) => {
          const metrics = getCategoryMetrics(functionName, category);
          const completionPercent =
            metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0;
          const isComplete = metrics.completed === metrics.total && metrics.total > 0;

          return (
            <Card
              key={category}
              className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
              onClick={() => onSelectCategory(category)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{category}</CardTitle>
                  </div>
                  {isComplete && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Progress Metrics */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {metrics.completed} of {metrics.total} questions answered
                  </span>
                  <span className="font-semibold">{completionPercent}%</span>
                </div>

                {/* Progress Bar */}
                <Progress value={completionPercent} className="h-2" />

                {/* CTA Button */}
                <Button
                  variant="outline"
                  className="w-full justify-between group"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCategory(category);
                  }}
                >
                  <span>
                    {isComplete ? "Review Answers" : "Answer Questions"}
                  </span>
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
