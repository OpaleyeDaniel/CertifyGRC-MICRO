import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { FrameworkModule } from "@/frameworks/types";

/**
 * Small coloured pill representing a framework — used in tables,
 * lists and activity feeds on every Omega page.
 */
export function FrameworkPill({
  framework,
  className,
  compact = false,
  linked = false,
}: {
  framework: Pick<FrameworkModule, "shortCode" | "name" | "id" | "basePath">;
  className?: string;
  compact?: boolean;
  linked?: boolean;
}) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary",
        className,
      )}
      title={framework.name}
    >
      <span className="font-mono text-[10px] tracking-wide">
        {framework.shortCode}
      </span>
      {!compact && <span className="hidden sm:inline">{framework.name}</span>}
    </span>
  );
  if (linked) {
    return (
      <Link to={framework.basePath} className="hover:opacity-80">
        {content}
      </Link>
    );
  }
  return content;
}
