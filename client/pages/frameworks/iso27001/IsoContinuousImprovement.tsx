import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight, ListChecks, AlertTriangle } from "lucide-react";
import { IsoPage, SectionHeading, MetricCard, ProgressBar, colorForScore, StatusPill, EmptyState } from "./_shared";
import { useIsoAssessment, scoreClause, scoreDomain } from "@/frameworks/iso27001/hooks/useIsoAssessment";
import { useIsoStore } from "@/frameworks/iso27001/hooks/useIsoStore";
import { ANNEX_A, ISO_CLAUSES } from "@/frameworks/iso27001/data";
import { useIsoGovernance } from "@/frameworks/iso27001/hooks/useIsoGovernance";
import { useIsoRisks } from "@/frameworks/iso27001/hooks/useIsoRisks";
import { ChartPanel, DonutDistributionChart, HorizontalBarChart } from "./workspace/IsoRecharts";
import { isOverdueIsoDate } from "./workspace/isoDashboardModel";

const BASE = "/frameworks/iso27001";

export default function IsoContinuousImprovement() {
  const { state } = useIsoStore();
  const { profile } = useIsoAssessment();
  const { findings, comments } = useIsoGovernance();
  const { treatmentActions } = useIsoRisks();

  const clauseAvg =
    ISO_CLAUSES.length > 0
      ? Math.round(
          ISO_CLAUSES.reduce((s, c) => s + scoreClause(c, profile, state.questions).percent, 0) / ISO_CLAUSES.length,
        )
      : 0;
  const annexAvg =
    ANNEX_A.length > 0
      ? Math.round(
          ANNEX_A.reduce((s, g) => s + scoreDomain(g, profile, state.questions).percent, 0) / ANNEX_A.length,
        )
      : 0;

  const openFindings = findings.filter((f) => f.status !== "closed");
  const overdueFindings = openFindings.filter((f) => isOverdueIsoDate(f.targetDate));
  const openActions = treatmentActions.filter((a) => a.status !== "done");
  const overdueActions = openActions.filter((a) => isOverdueIsoDate(a.targetDate));

  const findingStatusChart = useMemo(() => {
    const m: Record<string, number> = {};
    findings.forEach((f) => {
      m[f.status] = (m[f.status] ?? 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [findings]);

  const findingSeverityChart = useMemo(() => {
    const m: Record<string, number> = {};
    findings.forEach((f) => {
      m[f.severity] = (m[f.severity] ?? 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [findings]);

  const actionStatusChart = useMemo(() => {
    const m: Record<string, number> = {};
    treatmentActions.forEach((a) => {
      m[a.status] = (m[a.status] ?? 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [treatmentActions]);

  const ownerActions = useMemo(() => {
    const map = new Map<string, number>();
    treatmentActions.forEach((a) => {
      if (!a.owner?.trim()) return;
      const o = a.owner.trim();
      map.set(o, (map.get(o) ?? 0) + 1);
    });
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [treatmentActions]);

  const closureRate =
    findings.length > 0 ? Math.round((findings.filter((f) => f.status === "closed").length / findings.length) * 100) : 0;

  return (
    <IsoPage
      title="Continuous improvement"
      description="Clause 10 — nonconformity, corrective action, and continual improvement: prioritise assessment gaps, findings, and treatment actions. Align with your management review outputs and internal audit programme."
    >
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard
          label="Clause maturity (avg)"
          value={`${clauseAvg}%`}
          tone={colorForScore(clauseAvg) === "danger" ? "danger" : "default"}
        />
        <MetricCard
          label="Annex A maturity (avg)"
          value={`${annexAvg}%`}
          tone={colorForScore(annexAvg) === "danger" ? "danger" : "default"}
        />
        <MetricCard label="Open findings" value={openFindings.length} tone={openFindings.length ? "warning" : "success"} />
        <MetricCard label="Overdue findings" value={overdueFindings.length} tone={overdueFindings.length ? "danger" : "success"} />
        <MetricCard label="Treatment actions" value={openActions.length} />
        <MetricCard label="Overdue actions" value={overdueActions.length} tone={overdueActions.length ? "danger" : "success"} />
      </div>

      {(overdueFindings.length > 0 || overdueActions.length > 0) && (
        <Card className="border-rose-200/80 dark:border-rose-900/50 bg-rose-500/[0.04]">
          <CardHeader className="pb-2">
            <SectionHeading
              title="Overdue remediation"
              subtitle="Target dates in the past — escalate with risk and process owners."
              right={<AlertTriangle className="h-5 w-5 text-rose-600" />}
            />
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {overdueFindings.length > 0 && (
              <StatusPill label={`${overdueFindings.length} findings overdue`} tone="danger" />
            )}
            {overdueActions.length > 0 && (
              <StatusPill label={`${overdueActions.length} actions overdue`} tone="danger" />
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartPanel title="Finding status" subtitle="Lifecycle across the CAPA register">
          {findingStatusChart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No findings yet</div>
          ) : (
            <DonutDistributionChart data={findingStatusChart} />
          )}
        </ChartPanel>
        <ChartPanel title="Finding severity mix" subtitle="Criticality for steering committees">
          {findingSeverityChart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No findings yet</div>
          ) : (
            <DonutDistributionChart data={findingSeverityChart} />
          )}
        </ChartPanel>
        <ChartPanel title="Treatment action status" subtitle="Linked to risk mitigation work">
          {actionStatusChart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No actions yet</div>
          ) : (
            <HorizontalBarChart data={actionStatusChart} />
          )}
        </ChartPanel>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <SectionHeading title="Trend snapshot" subtitle="Lowest-scoring clauses — prioritise remediation and evidence." />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...ISO_CLAUSES]
              .map((c) => ({ c, score: scoreClause(c, profile, state.questions) }))
              .sort((a, b) => a.score.percent - b.score.percent)
              .slice(0, 4)
              .map(({ c, score }) => (
                <div key={c.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>
                      Clause {c.number} — {c.name}
                    </span>
                    <span className="text-muted-foreground">{score.percent}%</span>
                  </div>
                  <ProgressBar value={score.percent} tone={colorForScore(score.percent)} />
                </div>
              ))}
            <Button variant="outline" asChild>
              <Link to={`${BASE}/gap-analysis`}>
                Open gap analysis <ArrowRight className="h-4 w-4 ml-1 inline" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading
              title="Programme health"
              subtitle={`Finding closure rate: ${closureRate}% · Unresolved comments: ${comments.filter((c) => !c.resolved).length}`}
            />
          </CardHeader>
          <CardContent className="space-y-3">
            {ownerActions.length === 0 ? (
              <EmptyState title="No owned actions" description="Assign owners on treatment actions in Risk Assessment." />
            ) : (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Actions by owner</p>
                <div className="flex flex-wrap gap-2">
                  {ownerActions.map((o) => (
                    <StatusPill key={o.name} label={`${o.name}: ${o.value}`} tone="info" />
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2 pt-2">
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link to={`${BASE}/assessment`}>
                  <span className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4" /> Guided assessment
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link to={`${BASE}/corrective-actions`}>
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Corrective actions register
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link to={`${BASE}/risk-assessment`}>
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Risk &amp; treatment
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </IsoPage>
  );
}
