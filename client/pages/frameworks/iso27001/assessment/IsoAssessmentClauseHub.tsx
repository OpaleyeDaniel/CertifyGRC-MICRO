import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ChevronRight, Layers } from "lucide-react";
import { ProgressBar, StatusPill, colorForScore } from "../_shared";
import { ISO_CLAUSES } from "@/frameworks/iso27001/data";
import { getClauseSubsectionLabel } from "@/frameworks/iso27001/assessment/sectionMetadata";
import {
  buildClauseSteps,
  clauseFlowStatus,
  countAnsweredInList,
  countCompletedSteps,
  subsectionStatus,
} from "@/frameworks/iso27001/assessment/flowModel";
import type { ClauseStep } from "@/frameworks/iso27001/assessment/flowModel";
import { useIsoAssessment, scoreClause } from "@/frameworks/iso27001/hooks/useIsoAssessment";
import { useIsoStore } from "@/frameworks/iso27001/hooks/useIsoStore";
import { SubcategoryStartModal } from "./SubcategoryStartModal";

const BASE = "/frameworks/iso27001/assessment";

export default function IsoAssessmentClauseHub() {
  const { clauseNumber } = useParams<{ clauseNumber: string }>();
  const navigate = useNavigate();
  const { state } = useIsoStore();
  const { profile } = useIsoAssessment();

  const clause = useMemo(
    () => ISO_CLAUSES.find((c) => c.number === clauseNumber),
    [clauseNumber],
  );

  const steps = useMemo(
    () => (clause ? buildClauseSteps(clause, profile) : []),
    [clause, profile],
  );

  const [modalStep, setModalStep] = useState<ClauseStep | null>(null);

  if (!clause) {
    return <Navigate to={BASE} replace />;
  }

  if (steps.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <p className="text-muted-foreground max-w-md">
          No applicable subsections for this clause with your current organisation profile. Adjust the profile from the
          main assessment page.
        </p>
        <Button asChild>
          <Link to={BASE}>Back to assessment</Link>
        </Button>
      </div>
    );
  }

  const clauseScore = scoreClause(clause, profile, state.questions);
  const flowStatus = clauseFlowStatus(steps, state.questions);
  const completedSections = countCompletedSteps(steps, state.questions);
  const sectionPct = Math.round((completedSections / steps.length) * 100);

  const openAssessment = (step: ClauseStep) => {
    const enc = encodeURIComponent(step.reference);
    navigate(`${BASE}/clause/${clause.number}/section/${enc}`);
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
            <div className="h-12 w-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Layers className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">
                ISO 27001:2022 · Clause {clause.number}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{clause.name}</h1>
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">{clause.summary}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card className="border-border/80 shadow-sm md:col-span-2">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">Clause progress</span>
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
                    <span className="text-muted-foreground">Subsections completed</span>
                    <span className="font-semibold tabular-nums">
                      {completedSections}/{steps.length} · {sectionPct}%
                    </span>
                  </div>
                  <Progress value={sectionPct} className="h-2.5" />
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-border/60">
                  <span className="text-muted-foreground">Weighted readiness</span>
                  <span className={"font-bold " + (clauseScore.percent >= 80 ? "text-emerald-600" : "")}>
                    {clauseScore.percent}%
                  </span>
                </div>
                <ProgressBar value={clauseScore.percent} tone={colorForScore(clauseScore.percent)} />
              </CardContent>
            </Card>
            <Card className="border-border/80 shadow-sm bg-card/80">
              <CardContent className="p-6 space-y-2">
                <p className="text-sm font-medium">In this clause</p>
                <p className="text-2xl font-bold tabular-nums">{steps.length}</p>
                <p className="text-sm text-muted-foreground leading-snug">guided subsections · select a card to begin</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="w-full px-4 md:px-8 py-10 md:py-14">
        <h2 className="text-lg font-semibold text-foreground mb-2">Subsections</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Each subsection is assessed separately. Open a card to preview requirements, then start or continue the focused
          question flow.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {steps.map((step) => {
            const copy = getClauseSubsectionLabel(step.reference, step.questions[0]?.title);
            const answered = countAnsweredInList(step.questions, state.questions);
            const total = step.questions.length;
            const pct = total ? Math.round((answered / total) * 100) : 0;
            const sub = subsectionStatus(step.questions, state.questions);

            return (
              <button
                key={step.reference}
                type="button"
                onClick={() => setModalStep(step)}
                className="text-left rounded-2xl border border-border/80 bg-card p-6 md:p-7 shadow-sm hover:shadow-md hover:border-primary/25 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <span className="inline-flex font-mono text-sm font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                      {step.reference}
                    </span>
                    <h3 className="text-lg font-semibold mt-3 leading-snug group-hover:text-primary transition-colors">
                      {copy.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">{copy.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
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
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-xs font-medium text-primary">
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
          referenceId={modalStep.reference}
          title={getClauseSubsectionLabel(modalStep.reference, modalStep.questions[0]?.title).title}
          description={getClauseSubsectionLabel(modalStep.reference).description}
          questionCount={modalStep.questions.length}
          answeredCount={countAnsweredInList(modalStep.questions, state.questions)}
          status={subsectionStatus(modalStep.questions, state.questions)}
          onStart={() => openAssessment(modalStep)}
        />
      )}
    </div>
  );
}
