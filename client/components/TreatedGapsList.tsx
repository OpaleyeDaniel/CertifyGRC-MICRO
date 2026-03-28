import { useMemo, useState } from "react";
import { useGapRemediation } from "@/hooks/useGapRemediation";
import { GapRemediation } from "@/lib/gapRemediationTypes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle2, TrendingUp } from "lucide-react";
import { TreatedGapCard } from "./TreatedGapCard";
import { TreatedGapPreview } from "./TreatedGapPreview";

interface TreatedGapsListProps {
  searchTerm?: string;
  functionFilter?: string;
}

export function TreatedGapsList({ searchTerm = "", functionFilter = "all" }: TreatedGapsListProps) {
  const { allRemediations } = useGapRemediation();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedRemediation, setSelectedRemediation] = useState<GapRemediation | null>(null);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Filter only treated remediations (status = "Treated")
  const treatedGaps = useMemo(() => {
    return Object.values(allRemediations).filter(
      (remediation) => remediation.status === "Treated"
    );
  }, [allRemediations]);

  // Apply search and function filters
  const filteredTreatedGaps = useMemo(() => {
    return treatedGaps.filter((gap) => {
      const matchesSearch =
        gap.question.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        gap.nistId.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        gap.category.toLowerCase().includes(localSearchTerm.toLowerCase());
      const matchesFunction = functionFilter === "all" || gap.function === functionFilter;
      return matchesSearch && matchesFunction;
    });
  }, [treatedGaps, localSearchTerm, functionFilter]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = treatedGaps.length;
    const withEvidence = treatedGaps.filter(
      (gap) => gap.evidenceFiles && gap.evidenceFiles.length > 0
    ).length;
    const evidenceCoverage = total > 0 ? Math.round((withEvidence / total) * 100) : 0;

    return { total, withEvidence, evidenceCoverage };
  }, [treatedGaps]);

  const handlePreview = (remediation: GapRemediation) => {
    setSelectedRemediation(remediation);
    setPreviewOpen(true);
  };

  if (treatedGaps.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-900">No Treated Gaps Yet</p>
            <p className="text-sm text-blue-700 mt-1">
              Open gaps and complete the remediation worksheet to track your progress here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Total Treated</p>
            <p className="text-3xl font-bold mt-2">{metrics.total}</p>
            <p className="text-xs text-muted-foreground mt-2">Gaps remediated</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Evidence Provided</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{metrics.withEvidence}</p>
            <p className="text-xs text-muted-foreground mt-2">With supporting evidence</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Evidence Coverage</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{metrics.evidenceCoverage}%</p>
            <p className="text-xs text-muted-foreground mt-2">Evidence completeness</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search treated gaps by question, NIST ID, or category..."
          className="pl-10"
          value={localSearchTerm}
          onChange={(e) => setLocalSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      {filteredTreatedGaps.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-8">
            <p className="text-muted-foreground">No treated gaps match your search</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredTreatedGaps.length} of {treatedGaps.length} treated gaps
          </p>
          {filteredTreatedGaps.map((gap) => (
            <TreatedGapCard
              key={gap.questionId}
              remediation={gap}
              onPreview={handlePreview}
            />
          ))}
        </div>
      )}

      {/* Preview Sheet */}
      <TreatedGapPreview
        remediation={selectedRemediation}
        isOpen={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
