import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FrameworkModule } from "@/frameworks/types";

/**
 * Simple filter strip that lets users limit an Omega aggregation
 * to one or more frameworks. Single-select for simplicity.
 */
export function FrameworkFilter({
  frameworks,
  value,
  onChange,
  includeAll = true,
  counts,
}: {
  frameworks: Pick<FrameworkModule, "id" | "name" | "shortCode">[];
  value: string;
  onChange: (id: string) => void;
  includeAll?: boolean;
  counts?: Record<string, number>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {includeAll && (
        <Button
          size="sm"
          variant={value === "all" ? "default" : "outline"}
          onClick={() => onChange("all")}
          className="h-8 px-3 text-xs"
        >
          All frameworks
          {counts && (
            <span className="ml-1.5 text-[10px] opacity-80">
              · {Object.values(counts).reduce((s, v) => s + v, 0)}
            </span>
          )}
        </Button>
      )}
      {frameworks.map((fw) => (
        <Button
          key={fw.id}
          size="sm"
          variant={value === fw.id ? "default" : "outline"}
          onClick={() => onChange(fw.id)}
          className={cn("h-8 px-3 text-xs font-medium")}
          title={fw.name}
        >
          <span className="font-mono text-[10px] opacity-80">{fw.shortCode}</span>
          <span className="ml-1.5">{fw.name}</span>
          {counts && (
            <span className="ml-1.5 text-[10px] opacity-80">
              · {counts[fw.id] ?? 0}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
