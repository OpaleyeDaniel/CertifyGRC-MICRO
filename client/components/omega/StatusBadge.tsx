import { cn } from "@/lib/utils";

const palette = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  danger: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  critical: "bg-rose-600/20 text-rose-700 dark:text-rose-200",
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
} as const;

export type StatusTone = keyof typeof palette;

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
        palette[tone],
        className,
      )}
    >
      {label.replace(/[-_]/g, " ")}
    </span>
  );
}

/* --- tone mappers used across pages --- */
export function severityTone(
  level: "critical" | "high" | "medium" | "low",
): StatusTone {
  return level === "critical"
    ? "critical"
    : level === "high"
      ? "danger"
      : level === "medium"
        ? "warning"
        : "info";
}

export function riskTone(
  level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
): StatusTone {
  return level === "CRITICAL"
    ? "critical"
    : level === "HIGH"
      ? "danger"
      : level === "MEDIUM"
        ? "warning"
        : "success";
}

export function gapStatusTone(
  status: "open" | "in-progress" | "treated",
): StatusTone {
  return status === "open"
    ? "danger"
    : status === "in-progress"
      ? "warning"
      : "success";
}

export function reviewTone(
  status: "pending" | "approved" | "revision-requested",
): StatusTone {
  return status === "approved"
    ? "success"
    : status === "revision-requested"
      ? "danger"
      : "warning";
}

export function improvementTone(
  status: "revision-required" | "in-progress" | "resubmitted" | "approved",
): StatusTone {
  return status === "approved"
    ? "success"
    : status === "resubmitted"
      ? "info"
      : status === "in-progress"
        ? "warning"
        : "danger";
}

export function assessmentTone(
  status: "not-started" | "in-progress" | "answered" | "approved",
): StatusTone {
  return status === "approved"
    ? "success"
    : status === "answered"
      ? "info"
      : status === "in-progress"
        ? "warning"
        : "neutral";
}
