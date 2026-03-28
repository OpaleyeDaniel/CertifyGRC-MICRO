import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssessmentQuestion } from "@/components/AssessmentQuestion";
import { useAssessment } from "@/hooks/useAssessment";
import { useToast } from "@/hooks/use-toast";
import { getQuestionsByFunction } from "@/lib/nistQuestions";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const GOVERN_CATEGORIES = ["GV.OC – Organizational Context", "GV.RM – Risk Management Strategy", "GV.PO – Roles, Responsibilities, and Authorities", "GV.RR – Risk Management Oversight", "GV.OT – Cybersecurity Supply Chain Risk Management"];

export function GovernanceAssessmentSection() {
  const { saveResponse, getResponse, getCompletionStats } = useAssessment();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState("GV.OC – Organizational Context");

  const governQuestions = useMemo(() => getQuestionsByFunction("GOVERN"), []);

  const categoryQuestions = useMemo(() => {
    return governQuestions.filter((q) => q.category === activeCategory);
  }, [governQuestions, activeCategory]);

  const completionStats = useMemo(() => {
    return getCompletionStats(governQuestions.map((q) => q.nist_id));
  }, [governQuestions, getCompletionStats]);

  const detectedGaps = useMemo(() => {
    return governQuestions.filter((q) => {
      const response = getResponse(q.nist_id);
      return response && response.score <= 2;
    });
  }, [governQuestions, getResponse]);

  const handleSaveResponse = (score: number, comment?: string) => {
    const currentQuestion = categoryQuestions[currentQuestionIndex];
    if (currentQuestion) {
      saveResponse(currentQuestion.nist_id, score, comment);

      // Check if this creates a gap
      if (score <= 2) {
        toast({
          title: "Governance Gap Detected!",
          description: `${currentQuestion.nist_id}: ${currentQuestion.question}. Action item auto-created in the Improvement page.`,
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Response Saved",
          description: `Question ${currentQuestionIndex + 1} of ${categoryQuestions.length} completed.`,
          duration: 3000,
        });
      }

      // Auto-advance to next question
      if (currentQuestionIndex < categoryQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentQuestionIndex(0);
  };

  const handleSaveGovernanceSection = async () => {
    if (completionStats.completed === 0) {
      toast({
        title: "No Responses",
        description: "Please answer at least one question before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      const responses = governQuestions
        .filter((q) => getResponse(q.nist_id))
        .map((q) => {
          const response = getResponse(q.nist_id);
          return {
            nist_id: q.nist_id,
            question_text: q.question,
            score: response?.score || 0,
            comment: response?.comment,
            page: "Description",
            timestamp: response?.timestamp,
          };
        });

      const payload = {
        function: "GOVERN",
        responses,
        completionStats,
        detectedGaps: detectedGaps.length,
      };

      // Submit to API endpoint
      const response = await fetch("/api/assessment/submit?function=GOVERN", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Governance Assessment Saved!",
          description: `${completionStats.completed} questions answered. ${detectedGaps.length > 0 ? `${detectedGaps.length} gaps detected.` : "No gaps detected."}`,
          variant: "default",
          duration: 5000,
        });
      } else {
        toast({
          title: "Save Failed",
          description: "Could not save the assessment. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving governance assessment:", error);
      toast({
        title: "Save Error",
        description: "An error occurred while saving. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (governQuestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                NIST Governance Assessment
                <Badge variant="outline">{completionStats.percentage}% Complete</Badge>
              </CardTitle>
              <CardDescription className="mt-2">
                Assess your organization's governance and risk management practices (NIST CSF 2.0 - GOVERN Function)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Progress: {completionStats.completed} of {completionStats.total} questions</span>
              <span className="font-medium">{completionStats.percentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${completionStats.percentage}%` }}
              />
            </div>

            {detectedGaps.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg mt-4">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-destructive">Governance Gaps Detected</p>
                  <p className="text-xs text-destructive/80 mt-1">
                    {detectedGaps.length} area(s) with maturity score ≤ 2. Action items have been auto-created in the Improvement page.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Navigation */}
      <Tabs value={activeCategory} onValueChange={handleCategoryChange}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          {GOVERN_CATEGORIES.map((cat) => {
            const catQuestions = governQuestions.filter((q) => q.category === cat);
            const catCompleted = catQuestions.filter((q) => getResponse(q.nist_id)).length;

            return (
              <TabsTrigger key={cat} value={cat} className="text-xs">
                <span className="flex items-center gap-1">
                  {cat.split(" – ")[0]}
                  {catCompleted > 0 && <Badge variant="secondary" className="text-xs">{catCompleted}/{catQuestions.length}</Badge>}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {GOVERN_CATEGORIES.map((category) => (
          <TabsContent key={category} value={category} className="space-y-6">
            {/* Current Question */}
            {categoryQuestions.length > 0 && (
              <>
                <AssessmentQuestion
                  nist_id={categoryQuestions[currentQuestionIndex].nist_id}
                  category={categoryQuestions[currentQuestionIndex].category}
                  question={categoryQuestions[currentQuestionIndex].question}
                  initialScore={getResponse(categoryQuestions[currentQuestionIndex].nist_id)?.score}
                  initialComment={getResponse(categoryQuestions[currentQuestionIndex].nist_id)?.comment}
                  onSave={handleSaveResponse}
                />

                {/* Navigation */}
                <div className="flex gap-2 justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                  >
                    ← Previous
                  </Button>

                  <div className="text-sm text-muted-foreground text-center flex items-center">
                    Question {currentQuestionIndex + 1} of {categoryQuestions.length}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(Math.min(categoryQuestions.length - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === categoryQuestions.length - 1}
                  >
                    Next →
                  </Button>
                </div>
              </>
            )}

            {/* Category Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoryQuestions.map((question) => {
                    const response = getResponse(question.nist_id);
                    const isAnswered = !!response;
                    const hasGap = response && response.score <= 2;

                    return (
                      <div
                        key={question.nist_id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{question.nist_id}</span>
                            {isAnswered && (
                              <CheckCircle2 className={`h-4 w-4 ${hasGap ? "text-destructive" : "text-success"}`} />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {response && (
                            <Badge
                              variant={hasGap ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {response.score}/5
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleSaveGovernanceSection} className="flex-1" size="lg">
          Save Governance Section
        </Button>
      </div>

      {/* Questions Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assessment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Questions</p>
              <p className="text-2xl font-bold">{completionStats.total}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-success">{completionStats.completed}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Detected Gaps</p>
              <p className="text-2xl font-bold text-destructive">{detectedGaps.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold text-primary">{completionStats.percentage}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
