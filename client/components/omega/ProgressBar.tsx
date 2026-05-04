import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  tone = "primary",
  className,
}: {
  /** 0..100 */
  value: number;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  const toneClass = {
    primary: "bg-primary",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-sky-500",
  }[tone];
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all", toneClass)}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}
