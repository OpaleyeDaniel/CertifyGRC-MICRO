import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, FileText, FolderUp, Paperclip } from "lucide-react";
import { EvidenceSourcePickerModal } from "@/components/integrations/EvidenceSourcePickerModal";
import { useAuth } from "@/context/AuthContext";
import type { ExternalFileReference } from "@/lib/integrations/types";
import { StatusPill } from "../_shared";
import {
  ANSWER_OPTIONS,
  MATURITY_LABELS,
  type AssessmentQuestion,
} from "@/frameworks/iso27001/data";
import {
  useIsoAssessment,
  implementationScore,
} from "@/frameworks/iso27001/hooks/useIsoAssessment";
import { useIsoEvidence } from "@/frameworks/iso27001/hooks/useIsoEvidence";
import { useIsoStore, type ReviewStatus } from "@/frameworks/iso27001/hooks/useIsoStore";

export function AssessmentQuestionBlock({
  question,
  controlRef,
  variant = "default",
}: {
  question: AssessmentQuestion;
  controlRef?: string;
  /** Larger typography and spacing for focused (single-question) assessment mode. */
  variant?: "default" | "focused";
}) {
  const { state } = useIsoStore();
  const { answerQuestion } = useIsoAssessment();
  const { files, add, linkToQuestion, unlinkFromQuestion } = useIsoEvidence();
  const { currentUser } = useAuth();
  const [evidencePickerOpen, setEvidencePickerOpen] = useState(false);
  const qs = state.questions[question.id] ?? {};

  const needsJustification =
    question.followUp?.requireJustificationWhenAnswerIn?.includes(qs.answer ?? "") ?? false;

  const score = implementationScore({
    ...question,
    sectionRef: controlRef ?? question.reference,
    sectionKind: controlRef ? "control" : "clause",
    state: qs,
  });
  const tone = score >= 4 ? "success" : score >= 2 ? "warning" : "danger";

  const linkedFiles = files.filter((f) => f.linkedQuestions.includes(question.id));
  const evidenceMissing = (question.evidenceRequired ?? false) && linkedFiles.length === 0 && qs.answer;

  const isFocused = variant === "focused";

  const body = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
            <span className="font-mono text-foreground">{question.reference}</span>
            <span>·</span>
            <span className="capitalize">{question.depth}</span>
          </div>
          <CardTitle
            className={
              isFocused
                ? "text-xl md:text-2xl font-semibold leading-snug text-foreground"
                : "text-sm font-semibold leading-snug"
            }
          >
            {question.title}
          </CardTitle>
          <p
            className={
              (isFocused ? "text-base md:text-lg " : "text-sm ") +
              "text-muted-foreground leading-relaxed"
            }
          >
            {question.text}
          </p>
        </div>
        <StatusPill
          label={qs.answer ? `Score ${Math.max(0, score)}/5` : "Unanswered"}
          tone={qs.answer ? (tone as "success" | "warning" | "danger") : "muted"}
        />
      </div>

      {question.guidance && (
        <div
          className={
            (isFocused ? "text-sm p-5 md:p-6 " : "text-xs p-4 ") +
            "text-muted-foreground bg-muted/40 rounded-lg border border-border leading-relaxed"
          }
        >
          <span className="font-semibold text-foreground">Guidance: </span>
          {question.guidance}
        </div>
      )}
      {question.whyItMatters && (
        <p className={(isFocused ? "text-sm " : "text-xs ") + "text-muted-foreground leading-relaxed"}>
          <span className="font-semibold text-foreground">Why it matters: </span>
          {question.whyItMatters}
        </p>
      )}

      <div className={"space-y-6 " + (isFocused ? "pt-2" : "")}>
        <div className="space-y-3">
          <Label className={(isFocused ? "text-sm " : "text-xs ") + "font-medium text-foreground"}>
            {isFocused && (question.answerType === "yes-no" || question.answerType === "implementation-status")
              ? "How well does this apply?"
              : "Answer"}
          </Label>
          <AnswerInput
            question={question}
            value={qs.answer ?? null}
            onChange={(v) => answerQuestion(question.id, { answer: v })}
            variant={isFocused ? "focused" : "default"}
          />
          {question.answerType === "maturity" && (
            <p className={"text-muted-foreground mt-1 " + (isFocused ? "text-sm" : "text-[11px]")}>
              Maturity: {qs.answer ? MATURITY_LABELS[Number(qs.answer)] : "Select level (0–5)"}
            </p>
          )}
          {needsJustification && (
            <Textarea
              className={"mt-2 " + (isFocused ? "min-h-[100px]" : "")}
              placeholder="Justification required for this answer"
              value={qs.justification ?? ""}
              onChange={(e) => answerQuestion(question.id, { justification: e.target.value })}
            />
          )}
        </div>

        {!isFocused && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1.5 block">Owner</Label>
              <Input
                placeholder="Assign owner (e.g. CISO, IT manager)"
                value={qs.owner ?? ""}
                onChange={(e) => answerQuestion(question.id, { owner: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Notes</Label>
              <Textarea
                rows={2}
                placeholder="Notes / implementation detail"
                value={qs.notes ?? ""}
                onChange={(e) => answerQuestion(question.id, { notes: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-2">
          <Label className={isFocused ? "text-sm font-medium text-foreground" : "text-xs"}>
            Evidence (supporting documentation)
          </Label>
          {evidenceMissing && <StatusPill label="Evidence required" tone="danger" />}
        </div>

        <div className={"space-y-1.5 text-muted-foreground " + (isFocused ? "text-sm" : "text-xs")}>
          {question.evidence.map((e) => (
            <div key={e.id} className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span>{e.label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {linkedFiles.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => unlinkFromQuestion(f.id, question.id)}
              className={
                "inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 " +
                (isFocused ? "text-xs" : "text-[11px]")
              }
              title="Click to unlink"
            >
              <Paperclip className="h-3 w-3" />
              {f.sourceKind === "cloud" && f.sourceProviderId
                ? `${f.sourceProviderId.replace(/_/g, " ")} · ${f.name}`
                : f.name}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className={
              "h-auto w-full flex-col items-center gap-1 border-2 border-dashed border-border bg-muted/10 " +
              (isFocused ? "p-6 text-sm" : "p-3 text-xs")
            }
            onClick={() => setEvidencePickerOpen(true)}
          >
            <FolderUp className={"text-muted-foreground " + (isFocused ? "h-6 w-6" : "h-4 w-4")} />
            <span>{isFocused ? "Upload or attach evidence" : "Attach evidence"}</span>
            {isFocused && <span className="text-xs font-normal text-muted-foreground">Device or connected cloud</span>}
          </Button>
          <EvidenceSourcePickerModal
            open={evidencePickerOpen}
            onOpenChange={setEvidencePickerOpen}
            context={{
              surface: "iso27001/assessment-question",
              frameworkId: "iso27001",
              questionId: question.id,
              controlRef: controlRef ?? question.reference,
            }}
            onLocalFiles={async (fileList) => {
              for (const file of fileList) {
                const dataUrl = await fileToDataUrl(file).catch(() => undefined);
                const id = add({
                  name: file.name,
                  sizeBytes: file.size,
                  type: file.type || "application/octet-stream",
                  linkedQuestions: [question.id],
                  linkedControls: controlRef ? [controlRef] : [],
                  linkedRisks: [],
                  reviewStatus: "unreviewed",
                  dataUrl,
                  sourceKind: "local",
                  storageMode: "import",
                  attachedByLabel: currentUser?.fullName ?? currentUser?.email,
                });
                linkToQuestion(id, question.id);
              }
            }}
            onExternal={(ref: ExternalFileReference, mode) => {
              const id = add({
                name: ref.name,
                sizeBytes: ref.sizeBytes,
                type: ref.mimeType || "application/octet-stream",
                linkedQuestions: [question.id],
                linkedControls: controlRef ? [controlRef] : [],
                linkedRisks: [],
                reviewStatus: "unreviewed",
                sourceKind: "cloud",
                storageMode: mode,
                sourceProviderId: ref.providerId,
                externalFileId: ref.externalFileId,
                externalPath: ref.path,
                accessState: mode === "link" ? "available" : "imported_copy",
                attachedByLabel: currentUser?.fullName ?? currentUser?.email,
              });
              linkToQuestion(id, question.id);
            }}
            title="Add evidence to this question"
            multipleLocal
          />
        </div>
      </div>

      {isFocused && (
        <div className="space-y-2 pt-2">
          <Label className="text-sm font-medium text-foreground">Notes / context</Label>
          <Textarea
            className="min-h-24 border-border"
            placeholder="Add any additional context or notes about this assessment…"
            value={qs.notes ?? ""}
            onChange={(e) => answerQuestion(question.id, { notes: e.target.value })}
          />
        </div>
      )}

      {!isFocused && <ReviewRow question={question} />}
    </>
  );

  if (isFocused) {
    return (
      <Card className="w-full shadow-lg border border-border">
        <CardContent className="space-y-8 p-4 sm:p-6 md:p-8 md:pb-10">{body}</CardContent>
      </Card>
    );
  }

  return <div className="rounded-xl border border-border bg-card p-4 md:p-5 space-y-4 shadow-sm">{body}</div>;
}

function AnswerInput({
  question,
  value,
  onChange,
  variant = "default",
}: {
  question: AssessmentQuestion;
  value: string | null;
  onChange: (v: string) => void;
  variant?: "default" | "focused";
}) {
  const isFocused = variant === "focused";

  if (question.answerType === "yes-no") {
    if (isFocused) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {ANSWER_OPTIONS["yes-no"].map((o) => (
            <Button
              key={o}
              type="button"
              variant={value === o ? "default" : "outline"}
              className="h-11"
              onClick={() => onChange(o)}
            >
              {o}
            </Button>
          ))}
        </div>
      );
    }
    return (
      <Select value={value ?? undefined} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select answer" />
        </SelectTrigger>
        <SelectContent>
          {ANSWER_OPTIONS["yes-no"].map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (question.answerType === "implementation-status") {
    if (isFocused) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ANSWER_OPTIONS["implementation-status"].map((o) => (
            <Button
              key={o}
              type="button"
              variant={value === o ? "default" : "outline"}
              className="h-auto min-h-11 py-2 whitespace-normal text-center leading-snug"
              onClick={() => onChange(o)}
            >
              {o}
            </Button>
          ))}
        </div>
      );
    }
    return (
      <Select value={value ?? undefined} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select implementation status" />
        </SelectTrigger>
        <SelectContent>
          {ANSWER_OPTIONS["implementation-status"].map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (question.answerType === "maturity") {
    return (
      <Select value={value ?? undefined} onValueChange={onChange}>
        <SelectTrigger className={isFocused ? "h-11 text-base" : undefined}>
          <SelectValue placeholder="Select maturity level (0–5)" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(MATURITY_LABELS).map(([k, label]) => (
            <SelectItem key={k} value={k}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (question.answerType === "single-select") {
    return (
      <Select value={value ?? undefined} onValueChange={onChange}>
        <SelectTrigger className={isFocused ? "h-11 text-base" : undefined}>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {(question.options ?? []).map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (question.answerType === "multi-select") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {(question.options ?? []).map((o) => {
          const selected = (value ?? "").split("|").filter(Boolean).includes(o);
          return (
            <button
              type="button"
              key={o}
              onClick={() => {
                const parts = (value ?? "").split("|").filter(Boolean);
                const next = selected ? parts.filter((p) => p !== o) : [...parts, o];
                onChange(next.join("|"));
              }}
              className={
                "rounded-full border px-3 py-1 text-xs " +
                (selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground")
              }
            >
              {o}
            </button>
          );
        })}
      </div>
    );
  }
  if (question.answerType === "numeric") {
    return (
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter a number"
      />
    );
  }
  if (question.answerType === "date") {
    return (
      <Input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    );
  }
  return (
    <Textarea
      rows={2}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter your answer"
    />
  );
}

function ReviewRow({ question }: { question: AssessmentQuestion }) {
  const { state } = useIsoStore();
  const { setReviewStatus } = useIsoAssessment();
  const qs = state.questions[question.id] ?? {};
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
      <span className="text-xs text-muted-foreground">Review status:</span>
      <Select
        value={qs.reviewStatus ?? "draft"}
        onValueChange={(v) => setReviewStatus(question.id, v as ReviewStatus)}
      >
        <SelectTrigger className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(
            [
              "draft",
              "submitted",
              "under-review",
              "changes-requested",
              "approved",
              "rejected",
              "closed",
            ] as const
          ).map((s) => (
            <SelectItem key={s} value={s}>
              {s.replace("-", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {question.reviewerApprovalRequired && (
        <StatusPill label="Reviewer approval required" tone="warning" />
      )}
      {qs.reviewStatus === "approved" && (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" /> Approved
        </span>
      )}
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string | undefined> {
  if (file.size > 1_000_000) return Promise.resolve(undefined);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
