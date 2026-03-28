import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";
import { useRevisionControls } from "@/hooks/useRevisionControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft } from "lucide-react";
import { GapDetailView } from "./GapDetailView";
import { useState, useEffect } from "react";

interface RevisionDetailViewProps {
  revisionControlId: string;
  onBack: () => void;
}

export function RevisionDetailView({ revisionControlId, onBack }: RevisionDetailViewProps) {
  const { allQuestions } = useAssessmentEngine();
  const { getRevisionControl, isLoaded } = useRevisionControls();
  const [showGapDetail, setShowGapDetail] = useState(false);
  const [revision, setRevision] = useState<any>(null);

  // Load the revision control from the shared dataset
  useEffect(() => {
    if (isLoaded) {
      const control = getRevisionControl(revisionControlId);
      setRevision(control);
      console.log(`📂 Loaded revision control for ${revisionControlId}:`, control);
    }
  }, [revisionControlId, isLoaded, getRevisionControl]);

  const question = allQuestions.find((q) => q.id === revisionControlId);

  if (!revision || !question) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Revision record not found</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  // If user clicked to open the Gap Detail, show it with a modified back handler
  if (showGapDetail) {
    return (
      <div>
        <GapDetailView
          gap={question}
          onBack={() => setShowGapDetail(false)}
          isRevision={true}
          revisionComment={revision?.auditorComment}
          onRevisionComplete={() => {
            // Remove control from revisionControls dataset when remediation is submitted
            removeRevisionControl(revisionControlId);
            console.log(`✅ Removed ${revisionControlId} from revisionControls`);
            // Go back to revision list
            setShowGapDetail(false);
            onBack();
          }}
        />
      </div>
    );
  }

  // Show revision summary with auditor comment banner
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={onBack} className="mb-4">
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back to Revision List
      </Button>

      {/* Auditor Comment Banner */}
      {revision.auditorComment && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6 flex gap-4">
            <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-2">
                Returned for revision by auditor
              </h3>
              <p className="text-sm text-orange-800 mb-2">{revision.auditorComment}</p>
              {revision.auditorScore && (
                <p className="text-xs text-orange-700">
                  Auditor Score: <span className="font-semibold">{revision.auditorScore}/5</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Control Details Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{question.nist_id}</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">{question.question}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Category
              </p>
              <p className="text-sm">{question.category}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Function
              </p>
              <p className="text-sm">{question.function}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Current Maturity
              </p>
              <p className="text-sm font-semibold">{question.maturityScore || "Not assessed"}/5</p>
            </div>
            {revision.oldGapData?.targetState !== undefined && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Target Maturity (Previous)
                </p>
                <p className="text-sm font-semibold">{revision.oldGapData.targetState}/5</p>
              </div>
            )}
          </div>

          {/* Old Remediation Context */}
          {revision.oldRemediationData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm text-blue-900">
                Previous Remediation Work (for reference)
              </h4>

              {revision.oldRemediationData.rootCauseAnalysis && (
                <div>
                  <p className="text-xs font-semibold text-blue-700 mb-1">Root Cause Analysis</p>
                  <p className="text-sm text-blue-900">{revision.oldRemediationData.rootCauseAnalysis}</p>
                </div>
              )}

              {revision.oldRemediationData.actionPlan && (
                <div>
                  <p className="text-xs font-semibold text-blue-700 mb-1">Action Plan</p>
                  <p className="text-sm text-blue-900">{revision.oldRemediationData.actionPlan}</p>
                </div>
              )}

              {revision.oldRemediationData.expectedCompletionDate && (
                <div>
                  <p className="text-xs font-semibold text-blue-700 mb-1">
                    Expected Completion Date
                  </p>
                  <p className="text-sm text-blue-900">
                    {new Date(revision.oldRemediationData.expectedCompletionDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Open in Editor Button */}
          <Button
            className="w-full"
            onClick={() => setShowGapDetail(true)}
          >
            Open in Editor to Continue Reworking
          </Button>

          <p className="text-xs text-muted-foreground text-center pt-4">
            Click "Open in Editor" to view and edit all remediation details
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
