import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileCheck, Download, ArrowRight, Sparkles } from "lucide-react";
import { IsoPage, SectionHeading, colorForScore, MetricCard, StatusPill, Chip } from "./_shared";
import { useIsoAssessment, scoreClause, scoreDomain } from "@/frameworks/iso27001/hooks/useIsoAssessment";
import { useIsoStore } from "@/frameworks/iso27001/hooks/useIsoStore";
import { ANNEX_A, ISO_CLAUSES } from "@/frameworks/iso27001/data";
import { useIsoSoA } from "@/frameworks/iso27001/hooks/useIsoSoA";
import { useIsoRisks } from "@/frameworks/iso27001/hooks/useIsoRisks";
import { useIsoGovernance } from "@/frameworks/iso27001/hooks/useIsoGovernance";
import { buildIsoGapRegister } from "./workspace/isoGaps";
import { ChartPanel, ReadinessBarChart } from "./workspace/IsoRecharts";

const BASE = "/frameworks/iso27001";

export default function IsoReports() {
  const { state } = useIsoStore();
  const { profile } = useIsoAssessment();
  const { entries: soa } = useIsoSoA();
  const { risks } = useIsoRisks();
  const { findings, audits, reviews } = useIsoGovernance();

  const pack = useMemo(() => {
    const clauseScores = ISO_CLAUSES.map((c) => ({
      n: c.number,
      name: c.name,
      ...scoreClause(c, profile, state.questions),
    }));
    const annexScores = ANNEX_A.map((g) => ({
      domain: g.domain,
      name: g.name,
      ...scoreDomain(g, profile, state.questions),
    }));
    const overallClause = clauseScores.length
      ? Math.round(clauseScores.reduce((s, x) => s + x.percent, 0) / clauseScores.length)
      : 0;
    const overallAnnex = annexScores.length
      ? Math.round(annexScores.reduce((s, x) => s + x.percent, 0) / annexScores.length)
      : 0;
    return {
      generated: new Date().toISOString(),
      organisation: profile.organisationName || "Organisation",
      scope: profile.ismsScope || "—",
      clauseScores,
      annexScores,
      overallReadiness: Math.round(overallClause * 0.45 + overallAnnex * 0.55),
      soaApplicable: soa.filter((e) => e.entry.applicability === "applicable").length,
      soaTotal: soa.length,
      risksOpen: risks.filter((r) => r.status !== "closed" && r.status !== "treated").length,
      findingsOpen: findings.filter((f) => f.status !== "closed").length,
      audits: audits.length,
      mgmtReviews: reviews.length,
    };
  }, [profile, state.questions, soa, risks, findings, audits, reviews]);

  const gaps = useMemo(() => buildIsoGapRegister(state.questions, profile), [state.questions, profile]);

  const clauseChart = useMemo(
    () => pack.clauseScores.map((c) => ({ name: `C${c.n}`, value: c.percent })),
    [pack.clauseScores],
  );

  const downloadText = (name: string, body: string) => {
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const executiveSummary = `
ISO 27001:2022 — Executive readiness summary
Generated: ${pack.generated}
Organisation: ${pack.organisation}
ISMS scope: ${pack.scope}

Overall readiness index: ${pack.overallReadiness}%
Clause readiness (avg): ${pack.clauseScores.length ? Math.round(pack.clauseScores.reduce((s, c) => s + c.percent, 0) / pack.clauseScores.length) : 0}%
Annex A readiness (avg): ${pack.annexScores.length ? Math.round(pack.annexScores.reduce((s, d) => s + d.percent, 0) / pack.annexScores.length) : 0}%

Statement of Applicability: ${pack.soaApplicable} applicable / ${pack.soaTotal} controls in catalogue
Assessment-derived gaps (indicative): ${gaps.length}
Open risks (not treated/closed): ${pack.risksOpen}
Open findings / CAPA: ${pack.findingsOpen}
Internal audits on record: ${pack.audits}
Management reviews on record: ${pack.mgmtReviews}

Clause summary:
${pack.clauseScores.map((c) => `  Clause ${c.n} ${c.name}: ${c.percent}% (${c.answered}/${c.total})`).join("\n")}

Annex A domains:
${pack.annexScores.map((d) => `  ${d.domain} ${d.name}: ${d.percent}% (${d.answered}/${d.total})`).join("\n")}
`.trim();

  const readinessTone = colorForScore(pack.overallReadiness);

  return (
    <IsoPage
      title="Report center"
      description="Structured exports and live readiness visuals for management reviews, certification readiness reviews, and consultant deliverables. Outputs are professional summaries — not a substitute for accredited certification decisions."
    >
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/[0.07] to-transparent">
        <CardContent className="p-6 md:p-8 flex flex-col lg:flex-row gap-8 lg:items-center">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-widest">Executive snapshot</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Readiness at a glance</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Combined clause and Annex A posture with open risk, finding, and governance counts. Use exports for
              distribution; drill into modules for underlying records.
            </p>
            <div className="flex flex-wrap gap-2">
              <StatusPill label={`${pack.overallReadiness}% index`} tone={readinessTone} />
              <StatusPill label={`${gaps.length} indicative gaps`} tone={gaps.length > 10 ? "danger" : gaps.length ? "warning" : "success"} />
              <Chip label={new Date(pack.generated).toLocaleString()} />
            </div>
          </div>
          <div className="w-full lg:w-72 shrink-0 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Composite readiness</span>
              <span className="font-bold">{pack.overallReadiness}%</span>
            </div>
            <Progress value={pack.overallReadiness} className="h-3" />
            <Button className="w-full" variant="outline" onClick={() => downloadText("iso27001-executive-summary", executiveSummary)}>
              <Download className="h-4 w-4 mr-2" /> Download executive summary (.txt)
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Applicable (SoA)" value={`${pack.soaApplicable}/${pack.soaTotal}`} />
        <MetricCard label="Open risks" value={pack.risksOpen} tone={pack.risksOpen ? "warning" : "success"} />
        <MetricCard label="Open findings" value={pack.findingsOpen} tone={pack.findingsOpen ? "warning" : "success"} />
        <MetricCard label="Audits / reviews" value={`${pack.audits} / ${pack.mgmtReviews}`} />
      </div>

      <ChartPanel title="Clause readiness (export preview)" subtitle="Same data as clause score export">
        <ReadinessBarChart data={clauseChart} />
      </ChartPanel>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <SectionHeading
              title="Clause assessment pack"
              right={<StatusToneLabel value={pack.clauseScores.length ? Math.round(pack.clauseScores.reduce((s, c) => s + c.percent, 0) / pack.clauseScores.length) : 0} />}
            />
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Per-clause scoring from the guided assessment. Attach evidence references before external audit.
            </p>
            <Button
              variant="outline"
              onClick={() =>
                downloadText(
                  "iso27001-clauses",
                  pack.clauseScores
                    .map((c) => `Clause ${c.n} — ${c.name}\n  Readiness: ${c.percent}%\n  Answered: ${c.answered}/${c.total}\n`)
                    .join("\n"),
                )
              }
            >
              <FileCheck className="h-4 w-4 mr-2" /> Export clause scores
            </Button>
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <Link to={`${BASE}/assessment`}>
                Open assessment <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading
              title="Annex A domain pack"
              right={<StatusToneLabel value={pack.annexScores.length ? Math.round(pack.annexScores.reduce((s, d) => s + d.percent, 0) / pack.annexScores.length) : 0} />}
            />
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Domain-level readiness for Statement of Applicability alignment.</p>
            <Button
              variant="outline"
              onClick={() =>
                downloadText(
                  "iso27001-annex-a",
                  pack.annexScores
                    .map((d) => `${d.domain} — ${d.name}\n  Domain readiness: ${d.percent}%\n  Progress: ${d.answered}/${d.total}\n`)
                    .join("\n"),
                )
              }
            >
              <FileCheck className="h-4 w-4 mr-2" /> Export domain scores
            </Button>
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <Link to={`${BASE}/gap-analysis`}>
                Gap analysis <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading title="Risk &amp; CAPA extract" />
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Snapshot of the risk register and finding log for steering packs.</p>
            <Button
              variant="outline"
              onClick={() =>
                downloadText(
                  "iso27001-risks-capa",
                  [
                    "Risks:",
                    ...risks.map((r) => `  ${r.title} — residual ${r.residualScore} — ${r.status}`),
                    "",
                    "Findings:",
                    ...findings.map((f) => `  ${f.title} — ${f.severity} — ${f.status}`),
                  ].join("\n"),
                )
              }
            >
              <FileCheck className="h-4 w-4 mr-2" /> Export register extract
            </Button>
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <Link to={`${BASE}/risk-assessment`}>
                Risk assessment <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading title="Governance index" />
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-border/60 py-2">
              <span className="text-muted-foreground">Internal audits</span>
              <span className="font-medium">{pack.audits}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 py-2">
              <span className="text-muted-foreground">Management reviews</span>
              <span className="font-medium">{pack.mgmtReviews}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Indicative gaps (assessment)</span>
              <span className="font-medium">{gaps.length}</span>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" asChild>
              <Link to={`${BASE}/review`}>Comment &amp; review workspace</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </IsoPage>
  );
}

function StatusToneLabel({ value }: { value: number }) {
  const tone = colorForScore(value);
  return (
    <span
      className={`text-sm font-semibold ${
        tone === "success" ? "text-emerald-600" : tone === "warning" ? "text-amber-600" : "text-rose-600"
      }`}
    >
      {value}% avg
    </span>
  );
}
