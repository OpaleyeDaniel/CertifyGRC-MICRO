import { useMemo, useState } from "react";
import { useGapRemediation } from "@/hooks/useGapRemediation";
import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";
import { useContinuousImprovement } from "@/hooks/useContinuousImprovement";
import { GapRemediation } from "@/lib/gapRemediationTypes";
import { AssessmentQuestion } from "@/lib/assessmentQuestions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Clock } from "lucide-react";

interface InProgressGapsListProps {
  searchTerm?: string;
  functionFilter?: string;
  onResume: (gap: AssessmentQuestion) => void;
}

export function InProgressGapsList({
  searchTerm = "",
  functionFilter = "all",
  onResume,
}: InProgressGapsListProps) {
  const { allRemediations } = useGapRemediation();
  const { allQuestions } = useAssessmentEngine();
  const { getCIRecord } = useContinuousImprovement();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Filter only draft remediations (status = "Draft")
  const draftGaps = useMemo(() => {
    const allValues = Object.values(allRemediations);
    const filtered = allValues.filter(
      (remediation) => remediation.status === "Draft"
    );
    console.log(`📊 InProgressGapsList: Total remediations=${allValues.length}, Draft remediations=${filtered.length}`, {
      statuses: allValues.map(r => ({ nistId: r.nistId, status: r.status }))
    });
    return filtered;
  }, [allRemediations]);

  // Apply search and function filters
  const filteredDraftGaps = useMemo(() => {
    return draftGaps.filter((gap) => {
      const matchesSearch =
        gap.question.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        gap.nistId.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        gap.category.toLowerCase().includes(localSearchTerm.toLowerCase());
      const matchesFunction = functionFilter === "all" || gap.function === functionFilter;
      return matchesSearch && matchesFunction;
    });
  }, [draftGaps, localSearchTerm, functionFilter]);

  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const handleResume = (remediation: GapRemediation) => {
    // Find the original question by matching NIST ID (primary lookup)
    let question = allQuestions.find((q) => q.nist_id === remediation.nistId);

    // Fallback: try matching by question ID if NIST ID lookup fails
    if (!question) {
      question = allQuestions.find((q) => q.id === remediation.questionId);
    }

    if (question) {
      onResume(question);
    } else {
      // Last resort: construct a synthetic question from remediation data
      // This allows resuming even if the original question is not in allQuestions
      const syntheticQuestion = {
        id: remediation.questionId,
        function: remediation.function,
        category: remediation.category,
        nist_id: remediation.nistId,
        question: remediation.question,
        requiresEvidence: true,
        userAnswer: null,
        maturityScore: null,
        comment: "",
        evidenceUrl: null,
        sidebarHome: "Description",
        gap_flag: true,
      } as AssessmentQuestion;

      onResume(syntheticQuestion);
    }
  };

  if (draftGaps.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-900">No Drafts in Progress</p>
            <p className="text-sm text-blue-700 mt-1">
              Remediation drafts will appear here when you save a worksheet as draft
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm font-medium text-muted-foreground">Total Drafts</p>
          <p className="text-3xl font-bold mt-2">{draftGaps.length}</p>
          <p className="text-xs text-muted-foreground mt-2">Remediation worksheets in progress</p>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search drafts by question, NIST ID, or category..."
          className="pl-10"
          value={localSearchTerm}
          onChange={(e) => setLocalSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      {filteredDraftGaps.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-8">
            <p className="text-muted-foreground">No drafts match your search</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Showing {filteredDraftGaps.length} of {draftGaps.length} drafts
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">NIST ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Question</th>
                  <th className="text-left py-3 px-4 font-semibold">Category</th>
                  <th className="text-left py-3 px-4 font-semibold">Function</th>
                  <th className="text-left py-3 px-4 font-semibold">Draft Saved</th>
                  <th className="text-center py-3 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDraftGaps.map((gap) => {
                  const ciRecord = getCIRecord(gap.questionId);
                  const isRevision = !!ciRecord && ciRecord.status !== "resubmitted";
                  return (
                  <tr key={gap.questionId} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {gap.nistId}
                        </code>
                        {isRevision && (
                          <Badge className="text-[10px] bg-red-100 text-red-700 border border-red-200">
                            REVISION
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 max-w-sm">
                      <p className="text-sm leading-tight">{gap.question}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs text-muted-foreground">{gap.category}</p>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="text-xs">
                        {gap.function}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(gap.draftSavedDate || gap.updatedAt)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Button
                        size="sm"
                        onClick={() => handleResume(gap)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Resume
                      </Button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
