import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";
import { useRiskAssessment } from "@/hooks/useRiskAssessment";
import { useRemediationEvidence } from "@/hooks/useRemediationEvidence";
import { useGapRemediation } from "@/hooks/useGapRemediation";
import { useAuditorVerification } from "@/hooks/useAuditorVerification";
import { useContinuousImprovement } from "@/hooks/useContinuousImprovement";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  FolderOpen,
  ListChecks,
  RefreshCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Undo2,
} from "lucide-react";

const NIST_FUNCTIONS = ["GOVERN", "IDENTIFY", "PROTECT", "DETECT", "RESPOND", "RECOVER"];

const chartConfig = {
  stage: {
    label: "Workflow stage",
    color: "hsl(var(--primary))",
  },
  count: {
    label: "Count",
    color: "hsl(var(--primary))",
  },
  high: {
    label: "High",
    color: "hsl(var(--destructive))",
  },
  medium: {
    label: "Medium",
    color: "hsl(var(--warning))",
  },
  low: {
    label: "Low",
    color: "hsl(var(--success))",
  },
  maturity: {
    label: "Avg maturity",
    color: "hsl(var(--accent))",
  },
} as const;

function toTimeAgo(value?: string) {
  if (!value) return "No timestamp";
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return "No timestamp";
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { allQuestions } = useAssessmentEngine();
  const { allRiskAssessments, getPendingRisks, getCompletedRisks } = useRiskAssessment();
  const { remediations } = useRemediationEvidence();
  const { allRemediations } = useGapRemediation();
  const { getAllVerifications } = useAuditorVerification();
  const { getAllItems, getItemsByStatus } = useContinuousImprovement();

  const data = useMemo(() => {
    const totalControls = allQuestions.length;
    const assessedControls = allQuestions.filter((q) => q.userAnswer !== null && q.userAnswer !== "").length;
    const unassessedControls = Math.max(totalControls - assessedControls, 0);
    const assessmentEvidenceCount = allQuestions.reduce(
      (sum, q) => sum + (q.evidenceFiles?.length || (q.evidenceUrl ? 1 : 0)),
      0
    );
    const controlsWithAssessmentEvidence = allQuestions.filter(
      (q) => (q.evidenceFiles?.length || 0) > 0 || Boolean(q.evidenceUrl)
    ).length;

    const allRemediationList = Object.values(allRemediations);
    const openGaps = allQuestions.filter((q) => q.userAnswer === "No" || q.userAnswer === "Partial").length;
    const waitingForRemediation = allQuestions.filter((q) => {
      if (!(q.userAnswer === "No" || q.userAnswer === "Partial")) return false;
      const remediation = allRemediations[q.id];
      return !remediation || remediation.status === "Open";
    }).length;
    const inProgressRemediations = allRemediationList.filter((r) => r.status === "Draft").length;
    const treatedRemediations = allRemediationList.filter((r) => r.status === "Treated").length;
    const waitingForEvidence = allRemediationList.filter(
      (r) => (r.status === "Draft" || r.status === "Treated") && (!r.evidenceFiles || r.evidenceFiles.length === 0)
    ).length;

    const remediationEvidenceCount = remediations.reduce((sum, r) => sum + (r.evidenceFiles?.length || 0), 0);
    const totalEvidenceUploaded = assessmentEvidenceCount + remediationEvidenceCount;
    const remediationsWithEvidence = remediations.filter((r) => (r.evidenceFiles?.length || 0) > 0).length;

    const allRisks = Object.values(allRiskAssessments);
    const pendingRiskAssessments = getPendingRisks().length + allRisks.filter((r) => r.status === "In Progress").length;
    const completedRiskAssessments = getCompletedRisks().length;
    const highRisks = allRisks.filter((r) => r.postTreatmentRiskLevel === "HIGH").length;
    const mediumRisks = allRisks.filter((r) => r.postTreatmentRiskLevel === "MEDIUM").length;
    const lowRisks = allRisks.filter((r) => r.postTreatmentRiskLevel === "LOW").length;
    const totalRiskRecords = allRisks.length;

    const verifications = getAllVerifications();
    const pendingAuditorReview = verifications.filter((v) => v.reviewStatus === "Pending Review").length;
    const approvedControls = verifications.filter((v) => v.status === "approved").length;

    const ciItems = getAllItems();
    const revisionRequired = getItemsByStatus("revision_required").length;
    const revisionInProgress = getItemsByStatus("in_progress").length;
    const revisionResubmitted = getItemsByStatus("resubmitted").length;
    const revisionQueue = revisionRequired + revisionInProgress;
    const recentRevision30d = ciItems.filter((item) => {
      if (!item.reviewDate) return false;
      const diff = Date.now() - new Date(item.reviewDate).getTime();
      return diff <= 1000 * 60 * 60 * 24 * 30;
    }).length;

    const activities = [
      ...allRemediationList
        .filter((r) => r.updatedAt)
        .map((r) => ({
          kind: "remediation" as const,
          id: r.questionId || r.nistId,
          title: `Remediation updated`,
          detail: r.nistId || "Control",
          timestamp: r.updatedAt as string,
        })),
      ...allRisks
        .filter((r) => r.updatedAt)
        .map((r) => ({
          kind: "risk" as const,
          id: r.riskId,
          title: `Risk assessment updated`,
          detail: r.nistId || "Risk",
          timestamp: r.updatedAt as string,
        })),
      ...verifications.flatMap((v) => {
        const list: Array<{
          kind: "review";
          id: string;
          title: string;
          detail: string;
          timestamp: string;
        }> = [];
        if (v.submittedForReviewAt) {
          list.push({
            kind: "review",
            id: `${v.questionId}-submitted`,
            title: "Control submitted for review",
            detail: v.nistId,
            timestamp: v.submittedForReviewAt,
          });
        }
        if (v.approvedAt) {
          list.push({
            kind: "review",
            id: `${v.questionId}-approved`,
            title: "Control approved",
            detail: v.nistId,
            timestamp: v.approvedAt,
          });
        }
        if (v.revisionRequestedAt) {
          list.push({
            kind: "review",
            id: `${v.questionId}-revision`,
            title: "Revision requested",
            detail: v.nistId,
            timestamp: v.revisionRequestedAt,
          });
        }
        return list;
      }),
      ...ciItems
        .filter((item) => item.updatedAt)
        .map((item) => ({
          kind: "improvement" as const,
          id: `${item.controlId}-ci`,
          title: "Continuous improvement updated",
          detail: item.nistId,
          timestamp: item.updatedAt,
        })),
    ]
      .filter((a) => Boolean(a.timestamp))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentActivity7d = activities.filter(
      (a) => new Date(a.timestamp).getTime() >= sevenDaysAgo
    ).length;

    const maturityValues = allQuestions
      .map((q) => q.maturityScore)
      .filter((score): score is number => typeof score === "number");
    const avgMaturity = maturityValues.length
      ? maturityValues.reduce((sum, score) => sum + score, 0) / maturityValues.length
      : 0;
    const maturityByFunction = NIST_FUNCTIONS.map((func) => {
      const controls = allQuestions.filter((q) => q.function === func && typeof q.maturityScore === "number");
      const avg = controls.length
        ? controls.reduce((sum, q) => sum + (q.maturityScore || 0), 0) / controls.length
        : 0;
      return { function: func, avg, count: controls.length };
    });
    const maturityLevels = [1, 2, 3, 4, 5].map((level) => ({
      level,
      count: allQuestions.filter((q) => q.maturityScore === level).length,
    }));

    const overallAuditReadiness = totalControls ? Math.round((approvedControls / totalControls) * 100) : 0;
    const completionRate = totalControls ? Math.round((assessedControls / totalControls) * 100) : 0;
    const evidenceCoverage = totalControls
      ? Math.round((controlsWithAssessmentEvidence / totalControls) * 100)
      : 0;

    const systemHealth = Math.round(
      completionRate * 0.35 +
        Math.min(overallAuditReadiness, 100) * 0.35 +
        Math.max(0, 100 - Math.min(openGaps * 2, 100)) * 0.15 +
        evidenceCoverage * 0.15
    );

    const bottleneckItems = [
      { label: "Waiting for remediation", count: waitingForRemediation, route: "/gap-analysis" },
      { label: "Waiting for evidence", count: waitingForEvidence, route: "/evidence" },
      { label: "Pending risk assessments", count: pendingRiskAssessments, route: "/risk-assessment" },
      { label: "Pending auditor review", count: pendingAuditorReview, route: "/review" },
      { label: "Revision queue", count: revisionQueue, route: "/improvement" },
    ].sort((a, b) => b.count - a.count);

    const workflowChart = [
      { stage: "Assessed controls", count: assessedControls },
      { stage: "Open gaps", count: openGaps },
      { stage: "Remediation drafts", count: inProgressRemediations },
      { stage: "Pending risks", count: pendingRiskAssessments },
      { stage: "Pending review", count: pendingAuditorReview },
      { stage: "Revision queue", count: revisionQueue },
    ];

    const riskMixChart = [
      { name: "High", value: highRisks, fill: "hsl(var(--destructive))" },
      { name: "Medium", value: mediumRisks, fill: "hsl(var(--warning))" },
      { name: "Low", value: lowRisks, fill: "hsl(var(--success))" },
    ];

    return {
      totalControls,
      assessedControls,
      unassessedControls,
      completionRate,
      overallAuditReadiness,
      evidenceCoverage,
      systemHealth,
      openGaps,
      waitingForRemediation,
      inProgressRemediations,
      pendingRiskAssessments,
      completedRiskAssessments,
      totalRiskRecords,
      highRisks,
      mediumRisks,
      lowRisks,
      pendingAuditorReview,
      approvedControls,
      revisionRequired,
      revisionInProgress,
      revisionResubmitted,
      revisionQueue,
      recentRevision30d,
      totalEvidenceUploaded,
      assessmentEvidenceCount,
      controlsWithAssessmentEvidence,
      remediationEvidenceCount,
      remediationsWithEvidence,
      waitingForEvidence,
      avgMaturity,
      maturityByFunction,
      maturityLevels,
      workflowChart,
      riskMixChart,
      bottleneckItems,
      activities: activities.slice(0, 8),
      recentActivity7d,
      totalCiItems: ciItems.length,
    };
  }, [
    allQuestions,
    allRiskAssessments,
    getPendingRisks,
    getCompletedRisks,
    remediations,
    allRemediations,
    getAllVerifications,
    getAllItems,
    getItemsByStatus,
  ]);

  const topKpis = [
    {
      label: "System health",
      value: `${data.systemHealth}%`,
      hint: "Composite of readiness, completion, evidence, and open issues",
      icon: Shield,
    },
    {
      label: "Audit readiness",
      value: `${data.overallAuditReadiness}%`,
      hint: `${data.approvedControls} approved controls`,
      icon: ShieldCheck,
    },
    {
      label: "Assessment coverage",
      value: `${data.assessedControls}/${data.totalControls}`,
      hint: `${data.unassessedControls} controls not assessed`,
      icon: ListChecks,
    },
    {
      label: "Recent activity",
      value: `${data.recentActivity7d}`,
      hint: "Updates in the last 7 days",
      icon: RefreshCcw,
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 min-h-screen">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">GRC command center</h1>
          <p className="text-sm text-muted-foreground">
            Real-time posture across assessment, remediation, risk, review, and continuous improvement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Updated live from workflow state</Badge>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {topKpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="pt-5 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Workflow pressure map</CardTitle>
            <CardDescription>
              Current volume by lifecycle stage so bottlenecks are visible immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={data.workflowChart} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="stage"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={70}
                />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={26} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="var(--color-count)" />
              </BarChart>
            </ChartContainer>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.bottleneckItems.slice(0, 3).map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.route)}
                  className="text-left rounded-md border bg-card p-3 transition-colors hover:bg-accent/40"
                >
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-xl font-bold">{item.count}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk mix</CardTitle>
            <CardDescription>
              Post-treatment risk distribution from completed and active assessments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={data.riskMixChart}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={86}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                >
                  {data.riskMixChart.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Total risk records</p>
                <p className="text-xl font-bold">{data.totalRiskRecords}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Pending risk assessments</p>
                <p className="text-xl font-bold">{data.pendingRiskAssessments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Maturity by function</CardTitle>
            <CardDescription>
              Average maturity score by NIST function across assessed controls.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <BarChart data={data.maturityByFunction} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="function" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 5]} tickCount={6} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="avg" radius={[6, 6, 0, 0]} fill="var(--color-maturity)" />
              </BarChart>
            </ChartContainer>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {data.maturityLevels.map((level) => (
                <div key={level.level} className="rounded-md border p-2 text-center">
                  <p className="text-[11px] text-muted-foreground">Level {level.level}</p>
                  <p className="text-base font-bold">{level.count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evidence coverage</CardTitle>
            <CardDescription>
              Evidence depth across assessment responses and remediation actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Controls with evidence</p>
                <span className="text-sm font-semibold">{data.evidenceCoverage}%</span>
              </div>
              <Progress value={data.evidenceCoverage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {data.controlsWithAssessmentEvidence} of {data.totalControls} controls currently include evidence.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Assessment files</p>
                <p className="text-xl font-bold">{data.assessmentEvidenceCount}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Remediation files</p>
                <p className="text-xl font-bold">{data.remediationEvidenceCount}</p>
              </div>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Remediation records with evidence</p>
              <p className="text-xl font-bold">{data.remediationsWithEvidence}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Action Needed</CardTitle>
            <CardDescription>Immediate operational workload and blocked controls.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.bottleneckItems.map((item, index) => (
              <button
                key={item.label}
                onClick={() => navigate(item.route)}
                className="w-full flex items-center justify-between rounded-md border p-3 text-left transition-colors hover:bg-accent/40"
              >
                <span className="text-sm">{item.label}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={index === 0 && item.count > 0 ? "destructive" : "secondary"}>
                    {item.count}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent system activity</CardTitle>
            <CardDescription>Latest workflow events from remediation, risk, review, and revision.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Returned controls</p>
                <p className="text-xl font-bold">{data.totalCiItems}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Under rework</p>
                <p className="text-xl font-bold">{data.revisionInProgress}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Resubmitted</p>
                <p className="text-xl font-bold">{data.revisionResubmitted}</p>
              </div>
            </div>
            <div className="space-y-2">
              {data.activities.length === 0 ? (
                <div className="rounded-md border p-4 text-sm text-muted-foreground">
                  No recent activity recorded yet.
                </div>
              ) : (
                data.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.detail}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {toTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Jump directly to core workflow modules.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => navigate("/assessment")}>Start Assessment</Button>
          <Button variant="outline" onClick={() => navigate("/gap-analysis")}>
            Continue Gap Analysis
          </Button>
          <Button variant="outline" onClick={() => navigate("/evidence")}>
            Upload Evidence
          </Button>
          <Button variant="outline" onClick={() => navigate("/risk-assessment")}>
            Open Risk Register
          </Button>
          <Button variant="outline" onClick={() => navigate("/report")}>
            View Report
          </Button>
          <Button variant="outline" onClick={() => navigate("/improvement")}>
            Review Returned Controls
          </Button>
          <Button variant="outline" onClick={() => navigate("/evidence")} className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Evidence Repository
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
