import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Filter, PlusCircle } from "lucide-react";
import { Chip, IsoPage, MetricCard, SectionHeading, StatusPill, EmptyState } from "./_shared";
import { useIsoStore } from "@/frameworks/iso27001/hooks/useIsoStore";
import { useIsoAssessment } from "@/frameworks/iso27001/hooks/useIsoAssessment";
import { useIsoGovernance } from "@/frameworks/iso27001/hooks/useIsoGovernance";
import { buildIsoGapRegister, type IsoGapItem } from "./workspace/isoGaps";
import { ChartPanel, DonutDistributionChart, HorizontalBarChart } from "./workspace/IsoRecharts";

export default function IsoGapAnalysis() {
  const { state } = useIsoStore();
  const { profile } = useIsoAssessment();
  const { addFinding } = useIsoGovernance();

  const gaps = useMemo(
    () => buildIsoGapRegister(state.questions, profile),
    [state.questions, profile],
  );

  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const filtered = useMemo(
    () =>
      gaps.filter((g) => {
        if (severityFilter !== "all" && g.severity !== severityFilter) return false;
        if (domainFilter !== "all" && g.domain !== domainFilter) return false;
        return true;
      }),
    [gaps, severityFilter, domainFilter],
  );

  const domains = useMemo(() => Array.from(new Set(gaps.map((g) => g.domain))), [gaps]);

  const metrics = {
    total: gaps.length,
    critical: gaps.filter((g) => g.severity === "critical").length,
    major: gaps.filter((g) => g.severity === "major").length,
    minor: gaps.filter((g) => g.severity === "minor").length,
  };

  const severityChart = [
    { name: "Critical", value: metrics.critical },
    { name: "Major", value: metrics.major },
    { name: "Minor", value: metrics.minor },
  ].filter((d) => d.value > 0);

  const domainChart = useMemo(() => {
    const m = new Map<string, number>();
    gaps.forEach((g) => m.set(g.domain, (m.get(g.domain) ?? 0) + 1));
    return [...m.entries()]
      .map(([name, value]) => ({ name: name.length > 28 ? name.slice(0, 26) + "…" : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [gaps]);

  const priorityBlocks = useMemo(() => {
    const crit = gaps.filter((g) => g.severity === "critical").slice(0, 4);
    const maj = gaps.filter((g) => g.severity === "major").slice(0, 4);
    const min = gaps.filter((g) => g.severity === "minor").slice(0, 3);
    return { crit, maj, min };
  }, [gaps]);

  return (
    <IsoPage
      title="Gap analysis"
      description="Assessment-derived gap register aligned with ISO/IEC 27001 ISMS expectations: clause and Annex A posture, evidence needs, and remediation hand-off to findings and corrective action."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Open gaps" value={metrics.total} />
        <MetricCard label="Critical" value={metrics.critical} tone={metrics.critical > 0 ? "danger" : "success"} />
        <MetricCard label="Major" value={metrics.major} tone={metrics.major > 0 ? "warning" : "success"} />
        <MetricCard label="Minor" value={metrics.minor} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel
          title="Severity distribution"
          subtitle="Concentration of implementation and maturity gaps"
        >
          {severityChart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No gaps to chart</div>
          ) : (
            <DonutDistributionChart data={severityChart} />
          )}
        </ChartPanel>
        <ChartPanel title="Top affected areas" subtitle="Count of gaps by clause or Annex A theme">
          {domainChart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No gaps to chart</div>
          ) : (
            <HorizontalBarChart data={domainChart} />
          )}
        </ChartPanel>
      </div>

      {gaps.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-rose-200/80 dark:border-rose-900/50 bg-rose-500/[0.03]">
            <CardHeader className="pb-2">
              <SectionHeading title="Critical attention" subtitle="Highest-priority control gaps" />
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {priorityBlocks.crit.length === 0 ? (
                <p className="text-muted-foreground">None in this tier.</p>
              ) : (
                priorityBlocks.crit.map((g) => (
                  <div key={g.id} className="rounded-lg border border-border/80 bg-card/80 p-3">
                    <div className="font-mono text-xs text-primary">{g.reference}</div>
                    <div className="font-medium mt-0.5">{g.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{g.domain}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="border-amber-200/80 dark:border-amber-900/50 bg-amber-500/[0.03]">
            <CardHeader className="pb-2">
              <SectionHeading title="Major gaps" subtitle="Substantive remediation expected" />
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {priorityBlocks.maj.length === 0 ? (
                <p className="text-muted-foreground">None in this tier.</p>
              ) : (
                priorityBlocks.maj.map((g) => (
                  <div key={g.id} className="rounded-lg border border-border/80 bg-card/80 p-3">
                    <div className="font-mono text-xs text-primary">{g.reference}</div>
                    <div className="font-medium mt-0.5">{g.name}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <SectionHeading title="Lower priority" subtitle="Monitor and plan" />
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {priorityBlocks.min.length === 0 ? (
                <p className="text-muted-foreground">None listed.</p>
              ) : (
                priorityBlocks.min.map((g) => (
                  <div key={g.id} className="rounded-lg border border-border p-3">
                    <div className="font-mono text-xs">{g.reference}</div>
                    <div className="text-sm font-medium mt-0.5">{g.name}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <SectionHeading
            title="Gap register"
            subtitle="Sorted by severity — use Create finding to hand off to CAPA."
            right={
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Severity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={domainFilter} onValueChange={setDomainFilter}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="Domain" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All domains</SelectItem>
                    {domains.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            }
          />
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle className="h-8 w-8" />}
              title={gaps.length === 0 ? "No gaps detected" : "No rows match filters"}
              description={
                gaps.length === 0
                  ? "Complete clause and Annex A assessments with honest implementation status to surface prioritised improvement themes."
                  : "Adjust severity or domain filters to see other gap groups."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Ref</TableHead>
                    <TableHead>Gap</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Recommendation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered
                    .sort((a, b) =>
                      a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : b.severity === "critical" ? 1 : a.severity === "major" ? -1 : 1,
                    )
                    .map((gap: IsoGapItem) => (
                      <TableRow key={gap.id}>
                        <TableCell className="font-mono text-xs align-top">{gap.reference}</TableCell>
                        <TableCell className="align-top">
                          <div className="text-sm font-semibold">{gap.name}</div>
                          <div className="text-xs text-muted-foreground">{gap.domain}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Current answer: <Chip label={gap.answer ?? "—"} />
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <StatusPill
                            label={gap.severity}
                            tone={gap.severity === "critical" ? "danger" : gap.severity === "major" ? "warning" : "info"}
                          />
                        </TableCell>
                        <TableCell className="align-top text-sm">{gap.owner ?? "—"}</TableCell>
                        <TableCell className="align-top text-xs text-muted-foreground max-w-md">
                          {gap.recommendation}
                        </TableCell>
                        <TableCell className="text-right align-top">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              addFinding({
                                source: "self-identified",
                                title: `Gap — ${gap.reference} ${gap.name}`,
                                description: gap.recommendation,
                                severity: gap.severity,
                                owner: gap.owner,
                                clauseRef: gap.source === "clause" ? gap.reference : undefined,
                                controlRef: gap.source === "control" ? gap.reference : undefined,
                                status: "open",
                              })
                            }
                          >
                            <PlusCircle className="h-3.5 w-3.5 mr-1" /> Create finding
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </IsoPage>
  );
}
