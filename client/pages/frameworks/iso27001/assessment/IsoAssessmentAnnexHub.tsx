import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BookMarked, ChevronRight, Shield } from "lucide-react";
import { ProgressBar, StatusPill, colorForScore } from "../_shared";
import { ANNEX_A } from "@/frameworks/iso27001/data";
import type { AnnexStep } from "@/frameworks/iso27001/assessment/flowModel";
import {
  annexFlowStatus,
  buildAnnexSteps,
  countAnsweredInList,
  countCompletedSteps,
  subsectionStatus,
} from "@/frameworks/iso27001/assessment/flowModel";
import { useIsoAssessment, scoreDomain } from "@/frameworks/iso27001/hooks/useIsoAssessment";
import { useIsoStore } from "@/frameworks/iso27001/hooks/useIsoStore";
import { SubcategoryStartModal } from "./SubcategoryStartModal";

const BASE = "/frameworks/iso27001/assessment";

export default function IsoAssessmentAnnexHub() {
  const { domain: domainParam } = useParams<{ domain: string }>();
  const domain = domainParam ? decodeURIComponent(domainParam) : "";
  const navigate = useNavigate();
  const { state } = useIsoStore();
  const { profile } = useIsoAssessment();

  const group = useMemo(() => ANNEX_A.find((g) => g.domain === domain), [domain]);

  const steps = useMemo(
    () => (group ? buildAnnexSteps(group, profile) : []),
    [group, profile],
  );

  const [modalStep, setModalStep] = useState<AnnexStep | null>(null);

  if (!group) {
    return <Navigate to={BASE} replace />;
  }

  if (steps.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <p className="text-muted-foreground max-w-md">
          No applicable controls in this Annex domain for your organisation profile.
        </p>
        <Button asChild>
          <Link to={BASE}>Back to assessment</Link>
        </Button>
      </div>
    );
  }

  const domainScore = scoreDomain(group, profile, state.questions);
  const flowStatus = annexFlowStatus(steps, state.questions);
  const completedControls = countCompletedSteps(steps, state.questions);
  const controlPct = Math.round((completedControls / steps.length) * 100);

  const openAssessment = (step: AnnexStep) => {
    const enc = encodeURIComponent(step.control.reference);
    navigate(`${BASE}/annex/${encodeURIComponent(group.domain)}/control/${enc}`);
    setModalStep(null);
  };

  return (
    <div className="min-h-full bg-background">
      <div className="border-b border-border/80 bg-background">
        <div className="w-full px-4 md:px-8 py-8 md:py-10">
          <Button variant="ghost" size="sm" className="-ml-2 mb-6 text-muted-foreground" asChild>
            <Link to={BASE}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Assessment overview
            </Link>
          </Button>

          <div className="flex flex-wrap items-start gap-4 mb-2">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <BookMarked className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">
                ISO 27001:2022 · Annex A · {group.domain}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{group.name}</h1>
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">{group.description}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card className="border-border/80 shadow-sm md:col-span-2">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">Domain progress</span>
                  <StatusPill
                    label={
                      flowStatus === "completed"
                        ? "Complete"
                        : flowStatus === "not-started"
                          ? "Not started"
                          : "In progress"
                    }
                    tone={flowStatus === "completed" ? "success" : flowStatus === "not-started" ? "muted" : "warning"}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Controls completed</span>
                    <span className="font-semibold tabular-nums">
                      {completedControls}/{steps.length} · {controlPct}%
                    </span>
                  </div>
                  <Progress value={controlPct} className="h-2.5" />
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-border/60">
                  <span className="text-muted-foreground">Weighted readiness</span>
                  <span className={"font-bold " + (domainScore.percent >= 80 ? "text-emerald-600" : "")}>
                    {domainScore.percent}%
                  </span>
                </div>
                <ProgressBar value={domainScore.percent} tone={colorForScore(domainScore.percent)} />
              </CardContent>
            </Card>
            <Card className="border-border/80 shadow-sm bg-card/80">
              <CardContent className="p-6 space-y-2">
                <p className="text-sm font-medium">In this domain</p>
                <p className="text-2xl font-bold tabular-nums">{steps.length}</p>
                <p className="text-sm text-muted-foreground leading-snug">applicable controls · one focused flow each</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="w-full px-4 md:px-8 py-10 md:py-14">
        <h2 className="text-lg font-semibold text-foreground mb-2">Controls</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Select a control to preview scope and start the question-by-question assessment. The same structure applies
          across every Annex A domain.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {steps.map((step) => {
            const c = step.control;
            const answered = countAnsweredInList(step.questions, state.questions);
            const total = step.questions.length;
            const pct = total ? Math.round((answered / total) * 100) : 0;
            const sub = subsectionStatus(step.questions, state.questions);

            return (
              <button
                key={c.reference}
                type="button"
                onClick={() => setModalStep(step)}
                className="text-left rounded-2xl border border-border/80 bg-card p-6 md:p-7 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-2 font-mono text-sm font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                      <Shield className="h-3.5 w-3.5" />
                      {c.reference}
                    </span>
                    <h3 className="text-lg font-semibold mt-3 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">{c.objective}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1 group-hover:text-emerald-600 transition-colors" />
                </div>
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <StatusPill
                      label={sub === "completed" ? "Complete" : sub === "not-started" ? "Not started" : "In progress"}
                      tone={sub === "completed" ? "success" : sub === "not-started" ? "muted" : "warning"}
                    />
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {answered}/{total} answered · {pct}%
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
                <div className="mt-4">
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {sub === "not-started" ? "Start assessment" : sub === "completed" ? "Review answers" : "Continue"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {modalStep && (
        <SubcategoryStartModal
          open={!!modalStep}
          onOpenChange={(o) => !o && setModalStep(null)}
          referenceId={modalStep.control.reference}
          title={modalStep.control.name}
          description={modalStep.control.objective}
          questionCount={modalStep.questions.length}
          answeredCount={countAnsweredInList(modalStep.questions, state.questions)}
          status={subsectionStatus(modalStep.questions, state.questions)}
          onStart={() => openAssessment(modalStep)}
        />
      )}
    </div>
  );
}
