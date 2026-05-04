import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowRight,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  FileCheck,
  GanttChartSquare,
  LayoutDashboard,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import {
  IsoPage,
  MetricCard,
  ProgressBar,
  SectionHeading,
  StatusPill,
  Chip,
  colorForScore,
  formatRelative,
  EmptyState,
} from "./_shared";
import {
  useIsoAssessment,
  scoreClause,
  scoreDomain,
  type QuestionWithState,
} from "@/frameworks/iso27001/hooks/useIsoAssessment";
import { useIsoRisks, scoreToLevel } from "@/frameworks/iso27001/hooks/useIsoRisks";
import { useIsoSoA } from "@/frameworks/iso27001/hooks/useIsoSoA";
import { useIsoEvidence } from "@/frameworks/iso27001/hooks/useIsoEvidence";
import { useIsoGovernance } from "@/frameworks/iso27001/hooks/useIsoGovernance";
import { useIsoStore } from "@/frameworks/iso27001/hooks/useIsoStore";
import { ANNEX_A, ISO_CLAUSES } from "@/frameworks/iso27001/data";
import { buildIsoGapRegister } from "./workspace/isoGaps";
import {
  reviewStatusDistribution,
  questionsMissingEvidence,
  isOverdueIsoDate,
  completionRatio,
} from "./workspace/isoDashboardModel";
import { ChartPanel, DonutDistributionChart, ReadinessBarChart } from "./workspace/IsoRecharts";

const BASE = "/frameworks/iso27001";

function hrefForAssessmentQuestion(q: QuestionWithState) {
  if (q.sectionKind === "clause") {
    return `${BASE}/assessment/clause/${q.sectionRef}`;
  }
  const ref = q.controlRef ?? q.sectionRef;
  const parts = ref.split(".");
  const domain = parts.length >= 2 ? `${parts[0]}.${parts[1]}` : ref;
  return `${BASE}/assessment/annex/${encodeURIComponent(domain)}/control/${encodeURIComponent(ref)}`;
}

export default function IsoOverview() {
  const { state } = useIsoStore();
  const { profile, allApplicableQuestions } = useIsoAssessment();
  const { risks, metrics: riskMetrics, treatmentActions } = useIsoRisks();
  const { entries: soaEntries } = useIsoSoA();
  const { files, metrics: evidenceMetrics } = useIsoEvidence();
  const { findings, audits, reviews, comments } = useIsoGovernance();

  const clauseScores = useMemo(
    () => ISO_CLAUSES.map((c) => ({ clause: c, score: scoreClause(c, profile, state.questions) })),
    [profile, state.questions],
  );

  const domainScores = useMemo(
    () => ANNEX_A.map((g) => ({ group: g, score: scoreDomain(g, profile, state.questions) })),
    [profile, state.questions],
  );

  const clauseOverall = clauseScores.length
    ? Math.round(clauseScores.reduce((sum, c) => sum + c.score.percent, 0) / clauseScores.length)
    : 0;
  const annexOverall = domainScores.length
    ? Math.round(domainScores.reduce((sum, d) => sum + d.score.percent, 0) / domainScores.length)
    : 0;
  const overallReadiness = Math.round(clauseOverall * 0.45 + annexOverall * 0.55);

  const applicableSoA = soaEntries.filter((e) => e.entry.applicability === "applicable");
  const notApplicableSoA = soaEntries.filter((e) => e.entry.applicability === "not-applicable");
  const implementedSoA = soaEntries.filter((e) => e.entry.status === "implemented");
  const soaApproved = soaEntries.filter((e) => e.entry.reviewStatus === "approved").length;

  const evidenceCoverage = allApplicableQuestions.length
    ? Math.round(
        (allApplicableQuestions.filter((q) => (q.state.evidence?.length ?? 0) > 0).length /
          allApplicableQuestions.length) *
          100,
      )
    : 0;

  const assessmentCompletion = completionRatio(
    allApplicableQuestions.filter((q) => q.state.answer).length,
    allApplicableQuestions.length,
  );

  const gaps = useMemo(
    () => buildIsoGapRegister(state.questions, profile),
    [state.questions, profile],
  );

  const missingEvidenceQs = useMemo(
    () => questionsMissingEvidence(allApplicableQuestions).slice(0, 6),
    [allApplicableQuestions],
  );

  const reviewDist = useMemo(() => reviewStatusDistribution(state.questions), [state.questions]);

  const riskDist = useMemo(
    () =>
      (["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((lvl) => ({
        name: lvl.charAt(0) + lvl.slice(1).toLowerCase(),
        value: riskMetrics.byResidualLevel[lvl],
      })),
    [riskMetrics.byResidualLevel],
  );

  const clauseChartData = useMemo(
    () =>
      clauseScores.map(({ clause, score }) => ({
        name: `C${clause.number}`,
        value: score.percent,
      })),
    [clauseScores],
  );

  const annexChartData = useMemo(
    () =>
      domainScores.map(({ group, score }) => ({
        name: group.domain.replace("A.", ""),
        value: score.percent,
      })),
    [domainScores],
  );

  const highRisks = risks.filter((r) => {
    const l = scoreToLevel(r.residualScore);
    return l === "CRITICAL" || l === "HIGH";
  }).length;

  const overdueFindings = findings.filter(
    (f) => f.status !== "closed" && isOverdueIsoDate(f.targetDate),
  ).length;
  const overdueTreatments = treatmentActions.filter(
    (a) => a.status !== "done" && isOverdueIsoDate(a.targetDate),
  ).length;
  const overdueActions = overdueFindings + overdueTreatments;

  const ownerWorkload = useMemo(() => {
    const m = new Map<string, number>();
    for (const qs of Object.values(state.questions)) {
      if (!qs.owner?.trim()) continue;
      const o = qs.owner.trim();
      m.set(o, (m.get(o) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [state.questions]);

  const openFindings = findings.filter((f) => f.status !== "closed").length;
  const openCapa = findings.filter((f) => f.correctiveAction && f.status !== "closed").length;
  const upcomingReviews = [...audits]
    .filter((a) => a.status !== "closed")
    .sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime())
    .slice(0, 4);

  const topRisks = useMemo(
    () => [...risks].sort((a, b) => b.residualScore - a.residualScore).slice(0, 5),
    [risks],
  );

  const weakestClauses = useMemo(
    () =>
      [...clauseScores]
        .sort((a, b) => a.score.percent - b.score.percent)
        .slice(0, 3),
    [clauseScores],
  );

  const weakestDomains = useMemo(
    () =>
      [...domainScores]
        .sort((a, b) => a.score.percent - b.score.percent)
        .slice(0, 3),
    [domainScores],
  );

  const recentActivity = useMemo(() => {
    return [
      ...Object.entries(state.questions)
        .filter(([, qs]) => qs.updatedAt)
        .map(([id, qs]) => ({
          id: `q-${id}`,
          title: "Assessment updated",
          detail: id,
          timestamp: qs.updatedAt!,
          href: `${BASE}/assessment`,
        })),
      ...risks.map((r) => ({
        id: `r-${r.id}`,
        title: `Risk: ${r.title}`,
        detail: r.owner ?? "",
        timestamp: r.updatedAt,
        href: `${BASE}/risk-assessment`,
      })),
      ...findings.map((f) => ({
        id: `f-${f.id}`,
        title: `Finding: ${f.title}`,
        detail: f.severity,
        timestamp: f.updatedAt,
        href: `${BASE}/improvement`,
      })),
      ...files.map((f) => ({
        id: `e-${f.id}`,
        title: `Evidence: ${f.name}`,
        detail: "",
        timestamp: f.uploadedAt,
        href: `${BASE}/evidence`,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [state.questions, risks, findings, files]);

  const topGapsPreview = useMemo(
    () =>
      [...gaps].sort((a, b) => {
        const rank = (s: string) => (s === "critical" ? 0 : s === "major" ? 1 : 2);
        return rank(a.severity) - rank(b.severity);
      }).slice(0, 5),
    [gaps],
  );

  return (
    <IsoPage
      title="ISO/IEC 27001:2022 workspace"
      description="Executive view of ISMS readiness: mandatory management clauses (4–10), Annex A control themes, risk and evidence posture, and improvement backlog — structured for serious certification programmes (see ISO.org for the normative standard)."
      actions={
        <>
          <Button asChild variant="outline">
            <Link to={`${BASE}/report`}>
              <FileCheck className="h-4 w-4 mr-2" /> Report center
            </Link>
          </Button>
          <Button asChild>
            <Link to={`${BASE}/assessment`}>
              <ArrowRight className="h-4 w-4 mr-2" /> Assessment
            </Link>
          </Button>
        </>
      }
    >
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-card shadow-md">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">Framework dashboard</span>
                <Chip label={profile.organisationName || "Organisation"} tone="info" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">ISMS readiness overview</h2>
                <p className="text-muted-foreground mt-2 text-sm md:text-base max-w-3xl">
                  Weighted index across clause assessment and Annex A implementation. Use charts below to prioritise
                  remediation, evidence, and risk treatment.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill
                  label={`${gaps.length} open gaps`}
                  tone={gaps.length > 10 ? "danger" : gaps.length > 0 ? "warning" : "success"}
                />
                <StatusPill
                  label={`${highRisks} high/critical risks`}
                  tone={highRisks > 0 ? "danger" : "success"}
                />
                <StatusPill
                  label={`${assessmentCompletion}% assessment complete`}
                  tone={colorForScore(assessmentCompletion)}
                />
                <StatusPill
                  label={overdueActions ? `${overdueActions} overdue actions` : "No overdue actions"}
                  tone={overdueActions ? "danger" : "success"}
                />
              </div>
            </div>
            <div className="w-full lg:w-80 shrink-0 space-y-3 rounded-xl border border-border/80 bg-card/90 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Overall readiness</span>
                <span
                  className={
                    "text-2xl font-bold tabular-nums " +
                    (overallReadiness >= 80
                      ? "text-emerald-600 dark:text-emerald-400"
                      : overallReadiness >= 50
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-rose-600 dark:text-rose-400")
                  }
                >
                  {overallReadiness}%
                </span>
              </div>
              <Progress value={overallReadiness} className="h-3" />
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  Clauses avg <span className="font-semibold text-foreground">{clauseOverall}%</span>
                </div>
                <div>
                  Annex A avg <span className="font-semibold text-foreground">{annexOverall}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        <MetricCard
          label="Readiness index"
          value={`${overallReadiness}%`}
          hint="Clause + Annex A weighted"
          tone={colorForScore(overallReadiness) === "danger" ? "danger" : overallReadiness >= 80 ? "success" : "warning"}
        />
        <MetricCard
          label="Assessment done"
          value={`${assessmentCompletion}%`}
          hint={`${allApplicableQuestions.filter((q) => q.state.answer).length}/${allApplicableQuestions.length} answered`}
        />
        <MetricCard
          label="Open gaps"
          value={gaps.length}
          hint="From answers & maturity"
          tone={gaps.length > 15 ? "danger" : gaps.length > 0 ? "warning" : "success"}
        />
        <MetricCard
          label="High / critical risk"
          value={highRisks}
          tone={highRisks > 0 ? "danger" : "success"}
        />
        <MetricCard
          label="Evidence coverage"
          value={`${evidenceCoverage}%`}
          hint={`${evidenceMetrics.unreviewed} pending review`}
          tone={evidenceCoverage >= 70 ? "success" : evidenceCoverage >= 40 ? "warning" : "danger"}
        />
        <MetricCard
          label="Overdue actions"
          value={overdueActions}
          hint="Findings + treatments"
          tone={overdueActions > 0 ? "danger" : "success"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Readiness by clause" subtitle="Mandatory ISMS clauses 4–10 (average % per clause)">
          <ReadinessBarChart data={clauseChartData} />
        </ChartPanel>
        <ChartPanel title="Readiness by Annex A theme" subtitle="Organisational, people, physical, technological groupings">
          <ReadinessBarChart data={annexChartData} />
        </ChartPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Residual risk profile" subtitle="Count of registered risks by residual band">
          <DonutDistributionChart data={riskDist.filter((d) => d.value > 0)} />
        </ChartPanel>
        <ChartPanel title="Question review posture" subtitle="Assessment item workflow states in the register">
          <DonutDistributionChart data={reviewDist} />
        </ChartPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Priority gaps
            </CardTitle>
            <p className="text-xs text-muted-foreground">Highest-severity themes from the gap register — hand off to CAPA as needed.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {topGapsPreview.length === 0 ? (
              <EmptyState title="No gaps yet" description="Complete assessments with implementation responses to populate." />
            ) : (
              topGapsPreview.map((g) => (
                <Link
                  key={g.id}
                  to={`${BASE}/gap-analysis`}
                  className="block rounded-lg border border-border p-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-primary">{g.reference}</span>
                    <StatusPill
                      label={g.severity}
                      tone={g.severity === "critical" ? "danger" : g.severity === "major" ? "warning" : "info"}
                    />
                  </div>
                  <div className="text-sm font-medium mt-1 line-clamp-2">{g.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{g.domain}</div>
                </Link>
              ))
            )}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to={`${BASE}/gap-analysis`}>Open gap analysis</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              Evidence attention
            </CardTitle>
            <p className="text-xs text-muted-foreground">Answered items still missing required artefacts.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {missingEvidenceQs.length === 0 ? (
              <EmptyState title="No mandatory evidence gaps flagged" description="Or no answered items require evidence yet." />
            ) : (
              missingEvidenceQs.map((q) => (
                <Link
                  key={q.id}
                  to={hrefForAssessmentQuestion(q)}
                  className="block rounded-lg border border-amber-200/60 dark:border-amber-900/40 bg-amber-500/[0.04] p-3 text-sm hover:bg-amber-500/[0.08] transition-colors"
                >
                  <span className="font-mono text-xs">{q.reference}</span>
                  <div className="font-medium mt-0.5 line-clamp-2">{q.title}</div>
                </Link>
              ))
            )}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to={`${BASE}/evidence`}>Evidence library</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <GanttChartSquare className="h-4 w-4 text-primary" />
              Lowest-scoring areas
            </CardTitle>
            <p className="text-xs text-muted-foreground">Focus remediation and internal audit sampling.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Clauses</p>
              {weakestClauses.map(({ clause, score }) => (
                <div key={clause.id} className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <Link to={`${BASE}/assessment/clause/${clause.number}`} className="font-medium hover:underline">
                      {clause.number} · {clause.name}
                    </Link>
                    <span>{score.percent}%</span>
                  </div>
                  <ProgressBar value={score.percent} tone={colorForScore(score.percent)} />
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Annex A</p>
              {weakestDomains.map(({ group, score }) => (
                <div key={group.domain} className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <Link
                      to={`${BASE}/assessment/annex/${encodeURIComponent(group.domain)}`}
                      className="font-medium hover:underline"
                    >
                      {group.domain}
                    </Link>
                    <span>{score.percent}%</span>
                  </div>
                  <ProgressBar value={score.percent} tone={colorForScore(score.percent)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {ownerWorkload.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <SectionHeading title="Activity by owner" subtitle="Assigned assessment owners (question-level)" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ownerWorkload.map((o) => (
                <StatusPill key={o.name} label={`${o.name}: ${o.value}`} tone="info" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Clause assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {clauseScores.map(({ clause, score }) => (
              <Link
                key={clause.id}
                to={`${BASE}/assessment/clause/${clause.number}`}
                className="block rounded-lg border border-border p-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      Clause {clause.number} — {clause.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {score.answered}/{score.total} questions answered
                    </div>
                  </div>
                  <StatusPill label={`${score.percent}%`} tone={colorForScore(score.percent)} />
                </div>
                <div className="mt-2">
                  <ProgressBar value={score.percent} tone={colorForScore(score.percent)} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Annex A domains
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {domainScores.map(({ group, score }) => (
              <Link
                key={group.domain}
                to={`${BASE}/assessment/annex/${encodeURIComponent(group.domain)}`}
                className="block rounded-lg border border-border p-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      {group.domain} · {group.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {score.answered}/{score.total} answered · {group.controls.length} controls
                    </div>
                  </div>
                  <StatusPill label={`${score.percent}%`} tone={colorForScore(score.percent)} />
                </div>
                <div className="mt-2">
                  <ProgressBar value={score.percent} tone={colorForScore(score.percent)} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Top residual risks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topRisks.length === 0 ? (
              <EmptyState
                title="No risks yet"
                description="Register risks in Risk Assessment."
                action={
                  <Button asChild size="sm" variant="outline">
                    <Link to={`${BASE}/risk-assessment`}>Risk Assessment</Link>
                  </Button>
                }
              />
            ) : (
              topRisks.map((r) => {
                const level = scoreToLevel(r.residualScore);
                const tone =
                  level === "CRITICAL" || level === "HIGH" ? "danger" : level === "MEDIUM" ? "warning" : "success";
                return (
                  <div key={r.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 text-sm font-semibold truncate">{r.title}</div>
                      <StatusPill label={level} tone={tone} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Residual {r.residualScore} · {r.owner ?? "unassigned"}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" />
              SoA &amp; findings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <MetricRow label="Applicable controls (SoA)" value={`${applicableSoA.length}/${soaEntries.length}`} />
            <MetricRow label="Excluded (justified)" value={notApplicableSoA.length} />
            <MetricRow label="Implemented (SoA)" value={implementedSoA.length} />
            <MetricRow label="SoA approved rows" value={soaApproved} />
            <MetricRow label="Open findings" value={openFindings} />
            <MetricRow label="Open corrective actions" value={openCapa} />
            <Button asChild size="sm" variant="outline" className="w-full mt-2">
              <Link to={`${BASE}/improvement`}>Continuous improvement</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Reviews &amp; audits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingReviews.length === 0 ? (
              <EmptyState title="No scheduled audits" description="Plan internal audit activity to support clause 9." />
            ) : (
              upcomingReviews.map((a) => (
                <div key={a.id} className="rounded-lg border border-border p-3">
                  <div className="text-sm font-semibold">{a.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Planned: {new Date(a.plannedDate).toLocaleDateString()}
                  </div>
                  <Chip label={a.status} />
                </div>
              ))
            )}
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link to={`${BASE}/review`}>Comment &amp; review</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Review workload
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <MetricRow label="Management reviews" value={reviews.length} />
            <MetricRow label="Open comments" value={comments.filter((c) => !c.resolved).length} />
            <MetricRow label="Evidence files" value={evidenceMetrics.total} />
            <MetricRow label="Unreviewed evidence" value={evidenceMetrics.unreviewed} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentActivity.length === 0 ? (
              <EmptyState title="No recent activity" description="Work in assessment, risks, or evidence to see a trail." />
            ) : (
              recentActivity.map((a) => (
                <Link
                  key={a.id}
                  to={a.href}
                  className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted/50 text-sm border-b border-border/40 last:border-0"
                >
                  <div className="min-w-0 truncate">{a.title}</div>
                  <div className="text-xs text-muted-foreground shrink-0">{formatRelative(a.timestamp)}</div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <SectionHeading
            title="Workspace navigation"
            subtitle="Same structure as the framework sidebar — jump to operational modules."
            right={<Chip label="ISO/IEC 27001:2022" tone="info" />}
          />
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <Button asChild variant="outline" className="justify-start h-auto py-3">
            <Link to={`${BASE}/dashboard`}>
              <ClipboardCheck className="h-4 w-4 mr-2 shrink-0" />
              Framework Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start h-auto py-3">
            <Link to={`${BASE}/assessment`}>
              <LayoutDashboard className="h-4 w-4 mr-2 shrink-0" /> Assessment
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start h-auto py-3">
            <Link to={`${BASE}/gap-analysis`}>
              <BarChart3 className="h-4 w-4 mr-2 shrink-0" /> Gap Analysis
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start h-auto py-3">
            <Link to={`${BASE}/risk-assessment`}>
              <AlertCircle className="h-4 w-4 mr-2 shrink-0" /> Risk Assessment
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start h-auto py-3">
            <Link to={`${BASE}/evidence`}>
              <Archive className="h-4 w-4 mr-2 shrink-0" /> Evidence
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start h-auto py-3">
            <Link to={`${BASE}/report`}>
              <FileCheck className="h-4 w-4 mr-2 shrink-0" /> Report
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start h-auto py-3">
            <Link to={`${BASE}/review`}>
              <MessageSquare className="h-4 w-4 mr-2 shrink-0" /> Comment &amp; Review
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start h-auto py-3">
            <Link to={`${BASE}/improvement`}>
              <Zap className="h-4 w-4 mr-2 shrink-0" /> Continuous Improvement
            </Link>
          </Button>
        </CardContent>
      </Card>
    </IsoPage>
  );
}

function MetricRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
