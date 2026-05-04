import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

const toneClass: Record<NonNullable<KpiTone>, string> = {
  default: "text-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-rose-600 dark:text-rose-400",
  info: "text-sky-600 dark:text-sky-400",
  primary: "text-primary",
};

const toneBorder: Record<NonNullable<KpiTone>, string> = {
  default: "border-border/60",
  success: "border-emerald-500/30",
  warning: "border-amber-500/30",
  danger: "border-rose-500/30",
  info: "border-sky-500/30",
  primary: "border-primary/30",
};

export type KpiTone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "primary";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  footer,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: KpiTone;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm transition-colors hover:shadow-md",
        toneBorder[tone],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <div className={cn("text-2xl font-semibold tabular-nums", toneClass[tone])}>
            {value}
          </div>
          {hint && (
            <p className="truncate text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-muted/60",
              toneClass[tone],
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      {footer && <div className="mt-3 text-xs text-muted-foreground">{footer}</div>}
    </div>
  );
}
