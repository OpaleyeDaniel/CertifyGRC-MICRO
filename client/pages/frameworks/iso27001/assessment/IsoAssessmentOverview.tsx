import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ClipboardList, Search, ChevronRight, LayoutList } from "lucide-react";
import {
  IsoPage,
  MetricCard,
  ProgressBar,
  SectionHeading,
  StatusPill,
  colorForScore,
} from "../_shared";
import { ANNEX_A, ISO_CLAUSES, isQuestionApplicable } from "@/frameworks/iso27001/data";
import type { AnnexDomainGroup, ClauseSection } from "@/frameworks/iso27001/data";
import { useIsoAssessment, scoreClause, scoreDomain } from "@/frameworks/iso27001/hooks/useIsoAssessment";
import { useIsoStore } from "@/frameworks/iso27001/hooks/useIsoStore";
import {
  annexFlowStatus,
  buildAnnexSteps,
  buildClauseSteps,
  clauseFlowStatus,
  countCompletedSteps,
} from "@/frameworks/iso27001/assessment/flowModel";

const BASE = "/frameworks/iso27001/assessment";

export default function IsoAssessmentOverview() {
  const { state } = useIsoStore();
  const { profile, updateOrganisation } = useIsoAssessment();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("clauses");

  const metrics = useMemo(() => {
    const clauseQs = ISO_CLAUSES.flatMap((c) => c.questions.filter((q) => isQuestionApplicable(q, profile)));
    const annexQs = ANNEX_A.flatMap((g) =>
      g.controls.flatMap((c) => c.questions.filter((q) => isQuestionApplicable(q, profile))),
    );
    const total = clauseQs.length + annexQs.length;
    const answered = [...clauseQs, ...annexQs].filter((q) => state.questions[q.id]?.answer).length;
    const evidenceLinked = [...clauseQs, ...annexQs].filter(
      (q) => (state.questions[q.id]?.evidence?.length ?? 0) > 0,
    ).length;
    const avgClause = ISO_CLAUSES.length
      ? Math.round(
          ISO_CLAUSES.reduce((sum, c) => sum + scoreClause(c, profile, state.questions).percent, 0) /
            ISO_CLAUSES.length,
        )
      : 0;
    const avgAnnex = ANNEX_A.length
      ? Math.round(
          ANNEX_A.reduce((sum, d) => sum + scoreDomain(d, profile, state.questions).percent, 0) / ANNEX_A.length,
        )
      : 0;
    return { total, answered, evidenceLinked, avgClause, avgAnnex };
  }, [profile, state.questions]);

  const filteredClauses = useMemo(() => {
    if (!query) return ISO_CLAUSES;
    const q = query.toLowerCase();
    return ISO_CLAUSES.filter(
      (c) =>
        c.number.includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q),
    );
  }, [query]);

  const filteredAnnex = useMemo(() => {
    if (!query) return ANNEX_A;
    const q = query.toLowerCase();
    return ANNEX_A.filter(
      (g) =>
        g.domain.toLowerCase().includes(q) ||
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q),
    );
  }, [query]);

  const clauseCompleted = useMemo(() => {
    return ISO_CLAUSES.filter((c) => {
      const steps = buildClauseSteps(c, profile);
      return clauseFlowStatus(steps, state.questions) === "completed";
    }).length;
  }, [profile, state.questions]);

  const annexCompleted = useMemo(() => {
    return ANNEX_A.filter((g) => {
      const steps = buildAnnexSteps(g, profile);
      return annexFlowStatus(steps, state.questions) === "completed";
    }).length;
  }, [profile, state.questions]);

  return (
    <>
      <IsoPage
        title="ISO 27001:2022 — Assessment"
        description="Open any clause or Annex A domain to see a dedicated overview with subcategory cards, then assess one section at a time."
        actions={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="pl-8 w-64"
            />
          </div>
        }
      >
        <OrganisationStrip profile={profile} onChange={updateOrganisation} />

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <MetricCard label="Applicable questions" value={metrics.total} />
          <MetricCard
            label="Answered"
            value={`${metrics.answered}/${metrics.total}`}
            hint={metrics.total ? `${Math.round((metrics.answered / metrics.total) * 100)}%` : "0%"}
          />
          <MetricCard label="Evidence linked" value={metrics.evidenceLinked} />
          <MetricCard label="Clauses done" value={`${clauseCompleted}/${ISO_CLAUSES.length}`} />
          <MetricCard label="Annex domains done" value={`${annexCompleted}/${ANNEX_A.length}`} />
          <MetricCard
            label="Avg readiness"
            value={`${Math.round((metrics.avgClause + metrics.avgAnnex) / 2)}%`}
            tone={colorForScore((metrics.avgClause + metrics.avgAnnex) / 2) === "danger" ? "danger" : "default"}
          />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clauses">
              <ClipboardList className="h-4 w-4 mr-2" /> Clauses 4–10
            </TabsTrigger>
            <TabsTrigger value="annex">
              <BookOpen className="h-4 w-4 mr-2" /> Annex A
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clauses" className="mt-6 space-y-4">
            <SectionHeading
              title="Clause assessments"
              subtitle="Each clause opens its own hub: progress, descriptions, and a card for every subcategory."
            />
            <div className="grid gap-4 md:grid-cols-2">
              {filteredClauses.map((clause) => (
                <ClauseOverviewCard key={clause.id} clause={clause} profile={profile} states={state.questions} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="annex" className="mt-6 space-y-4">
            <SectionHeading
              title="Annex A domains"
              subtitle="Each domain opens a hub with one card per control, matching the clause experience."
            />
            <div className="grid gap-4 md:grid-cols-2">
              {filteredAnnex.map((group) => (
                <AnnexOverviewCard key={group.domain} group={group} profile={profile} states={state.questions} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </IsoPage>
    </>
  );
}

function ClauseOverviewCard({
  clause,
  profile,
  states,
}: {
  clause: ClauseSection;
  profile: ReturnType<typeof useIsoAssessment>["profile"];
  states: Record<string, { answer?: string | null }>;
}) {
  const steps = buildClauseSteps(clause, profile);
  const status = clauseFlowStatus(steps, states as any);
  const completedSteps = countCompletedSteps(steps, states as any);
  const score = scoreClause(clause, profile, states as any);
  const totalQ = steps.reduce((n, s) => n + s.questions.length, 0);
  const answeredQ = steps.reduce((n, s) => n + s.questions.filter((q) => states[q.id]?.answer).length, 0);
  const stepPct = steps.length ? Math.round((completedSteps / steps.length) * 100) : 0;

  const statusTone =
    status === "completed" ? "success" : status === "not-started" ? "muted" : ("warning" as const);

  return (
    <Card className="overflow-hidden border-border/80 hover:border-primary/30 transition-colors">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-mono text-primary font-semibold">Clause {clause.number}</div>
            <h3 className="font-semibold text-base mt-0.5 leading-snug">{clause.name}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{clause.summary}</p>
          </div>
          <StatusPill
            label={status === "completed" ? "Completed" : status === "not-started" ? "Not started" : "In progress"}
            tone={statusTone}
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Sections · {steps.length} steps</span>
            <span>
              {answeredQ}/{totalQ} questions
            </span>
          </div>
          <ProgressBar value={stepPct} tone={colorForScore(score.percent)} />
          <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
            <span>Step progress</span>
            <span>Readiness {score.percent}%</span>
          </div>
        </div>

        <Button size="sm" className="w-full" asChild>
          <Link
            to={`${BASE}/clause/${clause.number}`}
            className="inline-flex w-full items-center gap-2 [&>svg:last-child]:ml-auto"
          >
            <LayoutList className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {status === "not-started" ? "Open clause overview" : "Continue in clause hub"}
            </span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function AnnexOverviewCard({
  group,
  profile,
  states,
}: {
  group: AnnexDomainGroup;
  profile: ReturnType<typeof useIsoAssessment>["profile"];
  states: Record<string, { answer?: string | null }>;
}) {
  const steps = buildAnnexSteps(group, profile);
  const status = annexFlowStatus(steps, states as any);
  const completedSteps = countCompletedSteps(steps, states as any);
  const score = scoreDomain(group, profile, states as any);
  const totalQ = steps.reduce((n, s) => n + s.questions.length, 0);
  const answeredQ = steps.reduce((n, s) => n + s.questions.filter((q) => states[q.id]?.answer).length, 0);
  const stepPct = steps.length ? Math.round((completedSteps / steps.length) * 100) : 0;
  const statusTone =
    status === "completed" ? "success" : status === "not-started" ? "muted" : ("warning" as const);

  return (
    <Card className="overflow-hidden border-border/80 hover:border-primary/30 transition-colors">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{group.domain}</div>
            <h3 className="font-semibold text-base mt-0.5 leading-snug">{group.name}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{group.description}</p>
          </div>
          <StatusPill
            label={status === "completed" ? "Completed" : status === "not-started" ? "Not started" : "In progress"}
            tone={statusTone}
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Controls · {steps.length} steps</span>
            <span>
              {answeredQ}/{totalQ} questions
            </span>
          </div>
          <ProgressBar value={stepPct} tone={colorForScore(score.percent)} />
          <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
            <span>Control progress</span>
            <span>Readiness {score.percent}%</span>
          </div>
        </div>

        <Button size="sm" className="w-full" asChild>
          <Link
            to={`${BASE}/annex/${encodeURIComponent(group.domain)}`}
            className="inline-flex w-full items-center gap-2 [&>svg:last-child]:ml-auto"
          >
            <LayoutList className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {status === "not-started" ? "Open domain overview" : "Continue in domain hub"}
            </span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function OrganisationStrip({
  profile,
  onChange,
}: {
  profile: ReturnType<typeof useIsoAssessment>["profile"];
  onChange: ReturnType<typeof useIsoAssessment>["updateOrganisation"];
}) {
  const toggles: Array<{ key: keyof typeof profile; label: string }> = [
    { key: "usesCloud", label: "Uses cloud services" },
    { key: "developsSoftware", label: "Develops software" },
    { key: "remoteWorkers", label: "Remote workforce" },
    { key: "thirdPartyProcessors", label: "Third-party processors" },
    { key: "handlesPii", label: "Handles PII" },
    { key: "handlesPayments", label: "Handles payments" },
    { key: "multipleLocations", label: "Multiple locations" },
    { key: "hasPhysicalOffice", label: "Has physical office" },
    { key: "outsourcedOperations", label: "Outsourced operations" },
  ];

  return (
    <Card>
      <CardContent className="p-4 md:p-5 space-y-3">
        <SectionHeading
          title="Organisation profile"
          subtitle="Tailors which questions appear. Update as your context changes."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Organisation name</Label>
            <Input
              value={profile.organisationName ?? ""}
              onChange={(e) => onChange({ organisationName: e.target.value })}
              placeholder="e.g. Acme Ltd"
            />
          </div>
          <div>
            <Label className="text-xs">ISMS scope</Label>
            <Input
              value={profile.ismsScope ?? ""}
              onChange={(e) => onChange({ ismsScope: e.target.value })}
              placeholder="e.g. SaaS product and supporting operations"
            />
          </div>
          <div>
            <Label className="text-xs">Sector</Label>
            <Input
              value={profile.sector ?? ""}
              onChange={(e) => onChange({ sector: e.target.value })}
              placeholder="e.g. Financial services"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {toggles.map((t) => {
            const active = Boolean(profile[t.key]);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onChange({ [t.key]: !active } as any)}
                className={
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors " +
                  (active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted")
                }
              >
                <span className={"h-1.5 w-1.5 rounded-full " + (active ? "bg-primary" : "bg-muted-foreground/40")} />
                {t.label}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
