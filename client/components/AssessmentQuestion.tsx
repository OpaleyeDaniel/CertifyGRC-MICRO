import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface AssessmentQuestionProps {
  nist_id: string;
  category: string;
  question: string;
  onSave: (score: number, comment?: string) => void;
  initialScore?: number;
  initialComment?: string;
}

export function AssessmentQuestion({
  nist_id,
  category,
  question,
  onSave,
  initialScore,
  initialComment,
}: AssessmentQuestionProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(initialScore ?? null);
  const [comment, setComment] = useState(initialComment || "");

  const getScoreLabel = (score: number) => {
    const labels: { [key: number]: string } = {
      0: "Not Implemented",
      1: "Partially Implemented",
      2: "Inconsistently Implemented",
      3: "Implemented",
      4: "Managed",
      5: "Optimized",
    };
    return labels[score] || "";
  };

  const getScoreColor = (score: number) => {
    if (score === null) return "bg-muted text-muted-foreground";
    if (score <= 1) return "bg-destructive/10 text-destructive";
    if (score === 2) return "bg-warning/10 text-warning";
    if (score === 3) return "bg-accent/10 text-accent";
    return "bg-success/10 text-success";
  };

  const handleSave = () => {
    if (selectedScore !== null) {
      onSave(selectedScore, comment);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex gap-2 mb-2">
              <Badge variant="outline">{nist_id}</Badge>
              <Badge variant="secondary" className="text-xs">{category}</Badge>
            </div>
            <CardTitle className="text-base">{question}</CardTitle>
          </div>
          {selectedScore !== null && (
            <Badge className={getScoreColor(selectedScore)}>
              {selectedScore}/5
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Maturity Level Selector */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Select a maturity level (choose one):</p>
          <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
            {[0, 1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                onClick={() => setSelectedScore(score)}
                className={`p-2 rounded-md border-2 transition-all text-xs font-medium
                  ${
                    selectedScore === score
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }
                `}
              >
                <div className="font-bold">[{score}]</div>
                <div className="text-xs mt-1">{getScoreLabel(score)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Comment Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            (Optional) Add a comment about your answer:
          </label>
          <Textarea
            placeholder="Enter any notes, evidence, or context for this assessment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-20"
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={selectedScore === null}
          className="w-full"
        >
          Save Response
        </Button>
      </CardContent>
    </Card>
  );
}
