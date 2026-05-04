import { useEffect, useMemo } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { ANNEX_A } from "@/frameworks/iso27001/data";
import {
  buildAnnexSteps,
  countAnsweredInList,
  firstIncompleteQuestionIndex,
} from "@/frameworks/iso27001/assessment/flowModel";
import { useIsoAssessment, scoreDomain } from "@/frameworks/iso27001/hooks/useIsoAssessment";
import { useIsoStore } from "@/frameworks/iso27001/hooks/useIsoStore";
import { AssessmentQuestionBlock } from "./AssessmentQuestionBlock";

const BASE = "/frameworks/iso27001/assessment";

export default function IsoAssessmentAnnexQuestionFlow() {
  const { domain: domainParam, controlRef: controlRefParam } = useParams<{
    domain: string;
    controlRef: string;
  }>();
  const domain = domainParam ? decodeURIComponent(domainParam) : "";
  const controlRef = controlRefParam ? decodeURIComponent(controlRefParam) : "";
  const [searchParams, setSearchParams] = useSearchParams();
  const { state } = useIsoStore();
  const { profile } = useIsoAssessment();

  const group = useMemo(() => ANNEX_A.find((g) => g.domain === domain), [domain]);

  const steps = useMemo(
    () => (group ? buildAnnexSteps(group, profile) : []),
    [group, profile],
  );

  const step = useMemo(
    () => steps.find((s) => s.control.reference === controlRef),
    [steps, controlRef],
  );

  const questions = step?.questions ?? [];
  const control = step?.control;

  const defaultQ = useMemo(
    () => firstIncompleteQuestionIndex(questions, state.questions),
    [questions, state.questions],
  );

  const rawQ = searchParams.get("q");
  const parsedQ = rawQ !== null && rawQ !== "" ? parseInt(rawQ, 10) : NaN;
  const validQ = Number.isFinite(parsedQ) && parsedQ >= 0 && parsedQ < questions.length;
  const qIndex = validQ ? parsedQ : defaultQ;

  useEffect(() => {
    if (!step || questions.length === 0) return;
    if (!validQ) {
      setSearchParams({ q: String(defaultQ) }, { replace: true });
    }
  }, [step, questions.length, validQ, defaultQ, setSearchParams]);

  const hubHref = `${BASE}/annex/${encodeURIComponent(domain)}`;

  if (!group || !step || !control) {
    return <Navigate to={group ? hubHref : BASE} replace />;
  }

  const question = questions[qIndex];
  const answeredInControl = countAnsweredInList(questions, state.questions);
  const controlPct = questions.length ? Math.round((answeredInControl / questions.length) * 100) : 0;
  const domainScore = scoreDomain(group, profile, state.questions);

  const setQ = (i: number) => {
    const c = Math.max(0, Math.min(questions.length - 1, i));
    setSearchParams({ q: String(c) }, { replace: true });
  };

  const atLast = qIndex >= questions.length - 1;

  return (
    <div className="p-4 md:p-8 space-y-8 pb-16">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link to={BASE} className="hover:text-foreground transition-colors">
          Assessment
        </Link>
        <span>/</span>
        <Link to={hubHref} className="hover:text-foreground transition-colors">
          {group.domain} · {group.name}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium font-mono">{control.reference}</span>
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">{control.name}</h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base font-mono">{control.reference}</p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="font-medium text-foreground">
            Question {qIndex + 1} of {questions.length}
          </span>
          <span className="text-muted-foreground tabular-nums">
            Control {answeredInControl}/{questions.length} answered · Domain readiness {domainScore.percent}%
          </span>
        </div>
        <Progress value={questions.length ? ((qIndex + 1) / questions.length) * 100 : 0} className="h-2.5" />
        <p className="text-xs text-muted-foreground">{controlPct}% of questions answered for this control</p>
      </div>

      {question ? (
        <AssessmentQuestionBlock question={question} controlRef={control.reference} variant="focused" />
      ) : (
        <p className="text-muted-foreground">No questions for this control.</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setQ(qIndex - 1)} disabled={qIndex === 0} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button variant="outline" onClick={() => setQ(qIndex + 1)} disabled={atLast} className="gap-2">
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild className="gap-2">
            <Link to={hubHref}>
              <ChevronLeft className="h-4 w-4" />
              Return to control list
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to={BASE}>Assessment home</Link>
          </Button>
        </div>
      </div>

      {atLast && (
        <Button size="lg" className="w-full sm:w-auto gap-2" asChild>
          <Link to={hubHref}>
            <CheckCircle className="h-5 w-5" />
            Complete control & return to domain
          </Link>
        </Button>
      )}

      <p className="text-xs text-muted-foreground">Answers save automatically. Use Previous and Next to review or edit.</p>
    </div>
  );
}
