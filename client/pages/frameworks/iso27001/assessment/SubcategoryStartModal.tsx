import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusPill } from "../_shared";
import type { FlowStatus } from "@/frameworks/iso27001/assessment/flowModel";

function statusToLabel(s: FlowStatus): string {
  if (s === "completed") return "Complete";
  if (s === "not-started") return "Not started";
  return "In progress";
}

export function SubcategoryStartModal({
  open,
  onOpenChange,
  referenceId,
  title,
  description,
  questionCount,
  answeredCount,
  status,
  onStart,
  frameworkLabel = "ISO 27001:2022",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referenceId: string;
  title: string;
  description: string;
  questionCount: number;
  answeredCount: number;
  status: FlowStatus;
  onStart: () => void;
  frameworkLabel?: string;
}) {
  const pct = questionCount ? Math.round((answeredCount / questionCount) * 100) : 0;
  const estMinutes = Math.max(2, Math.min(45, Math.round(questionCount * 2)));
  const done = status === "completed";
  const cta = done ? "Review answers" : answeredCount > 0 ? "Continue assessment" : "Start assessment";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden border-border/80 shadow-xl">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background px-6 pt-8 pb-6 border-b border-border/60">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">{frameworkLabel}</p>
          <DialogHeader className="space-y-3 text-left">
            <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight leading-snug pr-6">
              <span className="font-mono text-primary text-lg md:text-xl mr-2">{referenceId}</span>
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm md:text-base text-muted-foreground leading-relaxed">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              label={statusToLabel(status)}
              tone={done ? "success" : status === "not-started" ? "muted" : "warning"}
            />
            <span className="text-sm text-muted-foreground">
              {questionCount} question{questionCount === 1 ? "" : "s"}
            </span>
            <span className="text-sm text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">~{estMinutes} min estimated</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress in this subsection</span>
              <span className="font-semibold tabular-nums">
                {answeredCount}/{questionCount} · {pct}%
              </span>
            </div>
            <Progress value={pct} className="h-2.5" />
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            You will answer one question at a time in a focused view. All responses save automatically. You can leave
            anytime and return from the overview.
          </p>
        </div>

        <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/60 gap-2 sm:gap-2 flex-col sm:flex-row sm:justify-end">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="w-full sm:w-auto" onClick={onStart}>
            {cta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
