import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useContinuousImprovement } from "@/hooks/useContinuousImprovement";
import { useGapRemediation } from "@/hooks/useGapRemediation";
import { ContinuousImprovementCard } from "@/components/ContinuousImprovementCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, AlertCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { setReadOnlyInteractiveState } from "@/lib/readOnlyDom";

const NIST_FUNCTIONS = ["All Functions", "GOVERN", "IDENTIFY", "PROTECT", "DETECT", "RESPOND", "RECOVER"];

export default function Improvement() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { hasPermission } = useAuth();
  const PAGE_KEY = "improvement" as const;
  const canView = hasPermission(PAGE_KEY, "view");
  const canEdit = hasPermission(PAGE_KEY, "edit");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { getItemsByFunction, getRevisionRequiredItems, markAsInProgress: markCIAsInProgress } =
    useContinuousImprovement();
  const { getRemediation, updateRemediation } = useGapRemediation();

  const [selectedFunction, setSelectedFunction] = useState("All Functions");
  const [searchTerm, setSearchTerm] = useState("");

  // Get controls that need revision for selected function
  const ciItems = useMemo(() => {
    const functionName = selectedFunction === "All Functions" ? "All" : selectedFunction;
    return getItemsByFunction(functionName as "All" | "GOVERN" | "IDENTIFY" | "PROTECT" | "DETECT" | "RESPOND" | "RECOVER");
  }, [selectedFunction, getItemsByFunction]);

  // Filter by search term
  const filteredItems = useMemo(() => {
    return ciItems.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.nistId.toLowerCase().includes(searchLower) ||
        item.controlTitle.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower)
      );
    });
  }, [ciItems, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const allRevisionRequired = getRevisionRequiredItems();
    return {
      total: allRevisionRequired.length,
      byFunction: {
        GOVERN: allRevisionRequired.filter((i) => i.function === "GOVERN").length,
        IDENTIFY: allRevisionRequired.filter((i) => i.function === "IDENTIFY").length,
        PROTECT: allRevisionRequired.filter((i) => i.function === "PROTECT").length,
        DETECT: allRevisionRequired.filter((i) => i.function === "DETECT").length,
        RESPOND: allRevisionRequired.filter((i) => i.function === "RESPOND").length,
        RECOVER: allRevisionRequired.filter((i) => i.function === "RECOVER").length,
      },
    };
  }, [getRevisionRequiredItems]);

  const handleResumeRework = (controlId: string) => {
    // Mark CI record as in progress
    markCIAsInProgress(controlId);

    // Re-open existing remediation as an active gap without creating new records.
    // All previous remediation/risk/evidence data stays intact in the same control record.
    const remediation = getRemediation(controlId);
    if (remediation && remediation.status === "Treated") {
      updateRemediation(controlId, { status: "Open" });
    }

    // Route back into the real Gap Analysis workflow using the existing control ID.
    navigate(`/gap-analysis?controlId=${encodeURIComponent(controlId)}`);
  };

  useEffect(() => {
    if (!canView) navigate("/", { replace: true });
  }, [canView, navigate]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!canEdit) setReadOnlyInteractiveState(containerRef.current, true);
  }, [canEdit]);

  useEffect(() => {
    const q = params.get("q");
    if (q) setSearchTerm(q);
  }, [params]);

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 p-4 md:p-8">
      {canView && !canEdit && (
        <div
          style={{
            padding: "9px 14px",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            background: "var(--color-info-bg)",
            color: "var(--color-info-text)",
            border: "0.5px solid var(--color-info-text)",
          }}
        >
          You have view-only access to this page. Contact your administrator to request edit access.
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-8 w-8 text-orange-500" />
              <h1 className="text-4xl font-bold text-gray-900">
                Continuous Improvement
              </h1>
            </div>
            <p className="text-muted-foreground">
              Rework queue for controls requiring revision
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats.total > 0 && (
          <div className="grid md:grid-cols-7 gap-3">
            {/* Total */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Total Revisions
                  </p>
                  <p className="text-3xl font-bold text-orange-600">
                    {stats.total}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* By Function */}
            {NIST_FUNCTIONS.slice(1).map((func) => {
              const count =
                stats.byFunction[func as keyof typeof stats.byFunction] || 0;
              if (count === 0) return null;

              return (
                <Card key={func}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        {func}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {count}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Filter Section */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by NIST ID, Control Name, or Category..."
              className="pl-10 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Function Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {NIST_FUNCTIONS.map((func) => (
              <Button
                key={func}
                onClick={() => setSelectedFunction(func)}
                variant={selectedFunction === func ? "default" : "outline"}
                className={cn(
                  "text-sm",
                  selectedFunction === func
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-gray-300 hover:border-gray-400"
                )}
              >
                {func}
                {func !== "All Functions" && stats.byFunction[func as keyof typeof stats.byFunction] > 0 && (
                  <Badge
                    className={cn(
                      "ml-2 text-xs",
                      selectedFunction === func
                        ? "bg-blue-400"
                        : "bg-gray-200 text-gray-800"
                    )}
                  >
                    {stats.byFunction[func as keyof typeof stats.byFunction]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center space-y-4">
              <Zap className="h-12 w-12 mx-auto text-gray-300" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {ciItems.length === 0 ? "No Controls Requiring Revision" : "No Results Found"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {ciItems.length === 0
                    ? "All controls have been approved or are in progress. Great work!"
                    : "Try adjusting your search or filter criteria."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Controls List - All start from Gap Analysis */}
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <ContinuousImprovementCard
                  key={item.controlId}
                  item={item}
                  onResumeRework={handleResumeRework}
                />
              ))}
            </div>

            {/* Summary Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Rework Process</p>
                    <ul className="space-y-1 text-xs">
                      <li>
                        • Click <strong>Resume Rework</strong> to start reworking a control
                      </li>
                      <li>
                        • Workflow: <strong>Gap Analysis → Remediation → Risk Assessment → Report → Submit</strong>
                      </li>
                      <li>
                        • Previous data loads automatically for editing
                      </li>
                      <li>
                        • Submit again for auditing when complete
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
