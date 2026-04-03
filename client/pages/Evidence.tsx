import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";
import { useRemediationEvidence } from "@/hooks/useRemediationEvidence";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { FileText, Search, AlertCircle, Eye, Loader2, ChevronDown } from "lucide-react";
import { EvidencePieChart } from "@/components/EvidencePieChart";
import { ViewEvidenceModal } from "@/components/ViewEvidenceModal";
import { formatFileSize, fetchRemoteFileSize } from "@/lib/fileUtils";
import { useAuth } from "@/context/AuthContext";
import { setReadOnlyInteractiveState } from "@/lib/readOnlyDom";

const NIST_FUNCTIONS = ["GOVERN", "IDENTIFY", "PROTECT", "DETECT", "RESPOND", "RECOVER"];

interface UnifiedEvidenceRecord {
  id: string;
  nist_id: string;
  function: string;
  category: string;
  assessment_answer: "Yes" | "No" | "Partial" | null;
  evidence_source: "Initial Assessment" | "Remediation Plan";
  document_name: string;
  file_size: number;
  uploaded_at: string;
  file_url?: string;
}

export default function Evidence() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { hasPermission } = useAuth();
  const PAGE_KEY = "evidence" as const;
  const canView = hasPermission(PAGE_KEY, "view");
  const canEdit = hasPermission(PAGE_KEY, "edit");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { allQuestions } = useAssessmentEngine();
  const { remediations } = useRemediationEvidence();
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "initial" | "remediation">("all");
  const [activeCategory, setActiveCategory] = useState<string>("GOVERN");
  const [selectedEvidence, setSelectedEvidence] = useState<UnifiedEvidenceRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [fileSizeCache, setFileSizeCache] = useState<Record<string, number | "loading">>({});
  const [loadingFileIds, setLoadingFileIds] = useState<Set<string>>(new Set());
  const [expandedNistIds, setExpandedNistIds] = useState<Set<string>>(new Set());

  // Fetch missing file sizes from remote URLs (only for remediation evidence with missing sizes)
  useEffect(() => {
    const fetchMissingSizes = async () => {
      const toFetch: Array<{ id: string; url: string }> = [];

      // Only check remediation evidence with missing sizes
      remediations.forEach((remediation) => {
        if (remediation.evidenceFiles && remediation.evidenceFiles.length > 0) {
          remediation.evidenceFiles.forEach((file) => {
            const fileId = `remediation-${remediation.questionId}-${file.name}`;
            // If file.size is 0 or missing, try to fetch it
            if ((file.size === 0 || !file.size) && !fileSizeCache[fileId] && !loadingFileIds.has(fileId)) {
              if (file.url) {
                toFetch.push({ id: fileId, url: file.url });
              }
            }
          });
        }
      });

      // Fetch sizes for files with missing data
      if (toFetch.length > 0) {
        // Mark all as loading
        setLoadingFileIds((prev) => new Set([...prev, ...toFetch.map((f) => f.id)]));

        // Fetch each file size
        for (const { id, url } of toFetch) {
          try {
            const size = await fetchRemoteFileSize(url);
            setFileSizeCache((prev) => ({
              ...prev,
              [id]: size || 0,
            }));
          } catch (error) {
            console.error(`Failed to fetch size for ${id}:`, error);
            setFileSizeCache((prev) => ({
              ...prev,
              [id]: 0,
            }));
          }
        }

        // Mark all as done loading
        setLoadingFileIds((prev) => {
          const newSet = new Set(prev);
          toFetch.forEach((f) => newSet.delete(f.id));
          return newSet;
        });
      }
    };

    fetchMissingSizes();
  }, [remediations, fileSizeCache, loadingFileIds]);

  // Collect evidence from assessment phase (evidenceFiles array)
  const assessmentEvidence = useMemo(() => {
    const records: UnifiedEvidenceRecord[] = [];

    allQuestions.forEach((question) => {
      // Process new multi-file structure
      if (question.evidenceFiles && question.evidenceFiles.length > 0) {
        question.evidenceFiles.forEach((file) => {
          const fileName = file.name;

          records.push({
            id: `assessment-${question.nist_id}-${file.url}`,
            nist_id: question.nist_id,
            function: question.function,
            category: question.category,
            assessment_answer: (question.userAnswer as "Yes" | "No" | "Partial") || null,
            evidence_source: "Initial Assessment",
            document_name: fileName,
            file_size: file.size,
            uploaded_at: new Date().toISOString(),
            file_url: file.url,
          });
        });
      }
      // Fallback to legacy single-file structure for backward compatibility
      else if (question.evidenceUrl) {
        const fileName = question.evidenceUrl.split("/").pop() || question.evidenceUrl;

        records.push({
          id: `assessment-${question.nist_id}`,
          nist_id: question.nist_id,
          function: question.function,
          category: question.category,
          assessment_answer: (question.userAnswer as "Yes" | "No" | "Partial") || null,
          evidence_source: "Initial Assessment",
          document_name: fileName,
          file_size: question.evidenceFileSize || 0,
          uploaded_at: new Date().toISOString(),
          file_url: question.evidenceUrl,
        });
      }
    });

    return records;
  }, [allQuestions]);

  // Collect evidence from remediation phase
  const remediationEvidence = useMemo(() => {
    const records: UnifiedEvidenceRecord[] = [];

    remediations.forEach((remediation) => {
      if (remediation.evidenceFiles && Array.isArray(remediation.evidenceFiles) && remediation.evidenceFiles.length > 0) {
        // Find matching question by questionId (more reliable than nist_id lookup)
        const question = allQuestions.find((q) => q.id === remediation.questionId);

        remediation.evidenceFiles.forEach((file) => {
          records.push({
            id: `remediation-${remediation.questionId}-${file.name}`,
            nist_id: remediation.nistId,
            function: remediation.function,
            category: remediation.category,
            assessment_answer: question?.userAnswer as "Yes" | "No" | "Partial" | null,
            evidence_source: "Remediation Plan",
            document_name: file.name,
            file_size: file.size,
            uploaded_at: file.uploadedAt,
          });
        });
      }
    });

    return records;
  }, [remediations, allQuestions]);

  // Combine all evidence records
  const allEvidenceRecords = useMemo(() => {
    return [...assessmentEvidence, ...remediationEvidence];
  }, [assessmentEvidence, remediationEvidence]);

  // Filter evidence
  const filteredRecords = useMemo(() => {
    return allEvidenceRecords.filter((record) => {
      const matchesSearch = record.nist_id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSource =
        sourceFilter === "all" ||
        (sourceFilter === "initial" && record.evidence_source === "Initial Assessment") ||
        (sourceFilter === "remediation" && record.evidence_source === "Remediation Plan");

      return matchesSearch && matchesSource;
    });
  }, [allEvidenceRecords, searchTerm, sourceFilter]);

  // Group by function
  const groupedByFunction = useMemo(() => {
    const grouped: Record<string, UnifiedEvidenceRecord[]> = {};

    NIST_FUNCTIONS.forEach((func) => {
      grouped[func] = filteredRecords.filter((r) => r.function === func);
    });

    return grouped;
  }, [filteredRecords]);

  // Calculate metrics
  const metrics = useMemo(() => {
    return {
      total: allEvidenceRecords.length,
      byFunction: NIST_FUNCTIONS.reduce(
        (acc, func) => {
          acc[func] = allEvidenceRecords.filter((r) => r.function === func).length;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }, [allEvidenceRecords]);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  // Get answer color
  const getAnswerColor = (answer: string | null) => {
    switch (answer) {
      case "Yes":
        return "bg-green-100 text-green-800";
      case "No":
        return "bg-red-100 text-red-800";
      case "Partial":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleViewEvidence = (record: UnifiedEvidenceRecord) => {
    setSelectedEvidence(record);
    setModalOpen(true);
  };

  // Toggle expanded state for a NIST ID
  const toggleNistIdExpanded = (nistId: string) => {
    setExpandedNistIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nistId)) {
        newSet.delete(nistId);
      } else {
        newSet.add(nistId);
      }
      return newSet;
    });
  };

  // Group records by NIST ID
  const groupByNistId = (records: UnifiedEvidenceRecord[]) => {
    const grouped: Record<string, UnifiedEvidenceRecord[]> = {};
    records.forEach((record) => {
      if (!grouped[record.nist_id]) {
        grouped[record.nist_id] = [];
      }
      grouped[record.nist_id].push(record);
    });
    return grouped;
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

  // Empty state
  if (allEvidenceRecords.length === 0) {
    return (
      <div ref={containerRef} className="p-4 md:p-8 space-y-8">
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Evidence Repository</h1>
            <p className="text-muted-foreground mt-2">Global compliance artifacts library</p>
          </div>
        </div>

        {/* Empty State */}
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 flex flex-col items-center text-center gap-4">
            <div className="rounded-full bg-blue-100 p-3">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No Evidence Has Been Uploaded Yet</h3>
              <p className="text-muted-foreground max-w-md">
                Files appear here once you attach evidence during the Assessment phase to prove your answers to NIST compliance questions.
              </p>
            </div>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">To upload evidence:</p>
              <ol className="text-sm text-left space-y-2 text-muted-foreground max-w-md">
                <li>Go to <strong>Assessment</strong> section</li>
                <li>Answer a question with "Yes", "No", or "Partial"</li>
                <li>Attach supporting documentation or evidence files</li>
                <li>Evidence will appear here automatically after upload</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main view with evidence
  return (
    <div ref={containerRef} className="p-4 md:p-8 space-y-8">
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Evidence Repository</h1>
          <p className="text-muted-foreground mt-2">Global compliance artifacts library</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Total Evidence</p>
            <p className="text-2xl font-bold mt-2">{metrics.total}</p>
            <p className="text-xs text-muted-foreground mt-2">Files collected</p>
          </CardContent>
        </Card>

        {NIST_FUNCTIONS.map((func) => (
          <Card key={func}>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">{func}</p>
              <p className="text-2xl font-bold mt-2">{metrics.byFunction[func] || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">items</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Evidence Distribution Chart */}
      <EvidencePieChart metrics={metrics.byFunction} />

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by NIST Subcategory Code (e.g., GV.OC-01, ID.AM-01)..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Source Filter */}
          <Select value={sourceFilter} onValueChange={(value: any) => setSourceFilter(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Evidence</SelectItem>
              <SelectItem value="initial">Initial Assessment Only</SelectItem>
              <SelectItem value="remediation">Remediation Plan Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Accordion Layout for Evidence by Category */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Evidence by NIST Function</h2>

        <Accordion
          type="single"
          collapsible
          value={activeCategory}
          onValueChange={setActiveCategory}
          defaultValue="GOVERN"
        >
          {NIST_FUNCTIONS.map((func) => {
            const functionRecords = groupedByFunction[func];

            if (functionRecords.length === 0) {
              return null;
            }

            return (
              <AccordionItem
                key={func}
                value={func}
                className="border rounded-lg mb-2 overflow-hidden border-b-0"
              >
                <AccordionTrigger
                  className={cn(
                    "hover:no-underline px-4 py-3 bg-muted/50 hover:bg-muted transition-colors",
                    "data-[state=open]:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-base">{func}</span>
                    <Badge variant="secondary" className="ml-2">
                      {functionRecords.length} item{functionRecords.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="p-0 pb-0">
                  <div className="space-y-0 border-t">
                    {/* Group records by NIST ID */}
                    {(() => {
                      const nistIdGroups = groupByNistId(functionRecords);
                      const nistIds = Object.keys(nistIdGroups).sort();

                      return nistIds.map((nistId) => {
                        const nistRecords = nistIdGroups[nistId];
                        const isExpanded = expandedNistIds.has(nistId);
                        const firstRecord = nistRecords[0];
                        const totalFiles = nistRecords.length;

                        return (
                          <div key={nistId} className="border-b last:border-b-0">
                            {/* Parent Row - NIST ID */}
                            <button
                              onClick={() => toggleNistIdExpanded(nistId)}
                              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/50 transition-colors text-left"
                            >
                              {/* Chevron Icon */}
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex-shrink-0"
                              >
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              </motion.div>

                              {/* NIST Reference Code */}
                              <code className="text-xs bg-muted px-2 py-1 rounded font-mono font-semibold flex-shrink-0">
                                {nistId}
                              </code>

                              {/* Assessment Answer Badge */}
                              <Badge className={cn("flex-shrink-0", getAnswerColor(firstRecord.assessment_answer))}>
                                {firstRecord.assessment_answer || "—"}
                              </Badge>

                              {/* File Count */}
                              <div className="flex-1">
                                <p className="text-sm text-muted-foreground">
                                  {totalFiles} file{totalFiles !== 1 ? "s" : ""} attached
                                </p>
                              </div>

                              {/* Category (right side) */}
                              <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:inline">
                                {firstRecord.category}
                              </span>
                            </button>

                            {/* Child Section - File Details */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2, ease: "easeInOut" }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-muted/20 border-t">
                                    <div className="space-y-0">
                                      {/* Child Table Header */}
                                      <div className="grid grid-cols-12 gap-0 px-4 py-3 bg-muted/30 border-b text-xs font-semibold">
                                        <div className="col-span-1"></div>
                                        <div className="col-span-3">Document Name</div>
                                        <div className="col-span-2">Evidence Source</div>
                                        <div className="col-span-2">File Size</div>
                                        <div className="col-span-2">Upload Date</div>
                                        <div className="col-span-2 text-center">Action</div>
                                      </div>

                                      {/* Child Rows - Individual Files */}
                                      {nistRecords.map((record) => (
                                        <motion.div
                                          key={record.id}
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{ duration: 0.15 }}
                                          className="grid grid-cols-12 gap-0 px-4 py-3 border-b last:border-b-0 hover:bg-muted/40 transition-colors items-center"
                                        >
                                          {/* Indent */}
                                          <div className="col-span-1"></div>

                                          {/* Document Name */}
                                          <div className="col-span-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                              <span className="text-sm font-medium truncate">{record.document_name}</span>
                                            </div>
                                          </div>

                                          {/* Evidence Source */}
                                          <div className="col-span-2">
                                            <Badge
                                              variant="outline"
                                              className={cn(
                                                "text-xs",
                                                record.evidence_source === "Initial Assessment"
                                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                                  : "bg-purple-50 text-purple-700 border-purple-200"
                                              )}
                                            >
                                              {record.evidence_source}
                                            </Badge>
                                          </div>

                                          {/* File Size */}
                                          <div className="col-span-2">
                                            {loadingFileIds.has(record.id) ? (
                                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                <span>Loading...</span>
                                              </div>
                                            ) : (
                                              <p className="text-sm text-muted-foreground">{formatFileSize(record.file_size)}</p>
                                            )}
                                          </div>

                                          {/* Upload Date */}
                                          <div className="col-span-2">
                                            <p className="text-sm text-muted-foreground">{formatDate(record.uploaded_at)}</p>
                                          </div>

                                          {/* Action */}
                                          <div className="col-span-2 flex justify-center">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="gap-2"
                                              onClick={() => handleViewEvidence(record)}
                                            >
                                              <Eye className="h-4 w-4" />
                                              <span className="sr-only">View evidence</span>
                                            </Button>
                                          </div>
                                        </motion.div>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* No results message */}
      {filteredRecords.length === 0 && allEvidenceRecords.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
            <AlertCircle className="h-5 w-5 inline-block mb-2 opacity-50" />
            <p>No evidence matches your search filters</p>
          </CardContent>
        </Card>
      )}

      {/* Information Footer */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base">About This Repository</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900 space-y-2">
          <p>
            This global evidence library collects all compliance artifacts uploaded during your NIST CSF 2.0 assessment.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Assessment Evidence:</strong> Files uploaded when answering assessment questions (Yes/No/Partial answers)</li>
            <li>Supporting documentation, screenshots, policies, certifications, and other compliance proof</li>
          </ul>
          <p className="pt-2">
            This complete audit trail ensures traceability from your NIST CSF 2.0 assessment to compliance proof and demonstrates your organization's security posture.
          </p>
        </CardContent>
      </Card>

      {/* View Evidence Modal */}
      <ViewEvidenceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        evidence={selectedEvidence}
      />
    </div>
  );
}
