import { cn } from "@/lib/utils";
import type { IntegrationProviderDefinition } from "@/lib/integrations/types";

type Props = {
  def: IntegrationProviderDefinition;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = { sm: "h-8 w-8 text-[10px]", md: "h-10 w-10 text-xs", lg: "h-12 w-12 text-sm" } as const;

/**
 * Monogram in vendor palette — readable, on-brand *feel*, no third-party SVG logos
 * (avoids redistributing registered trademarks).
 */
export function ProviderBrandMark({ def, size = "md", className }: Props) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg font-bold leading-none shadow-sm",
        def.brandTileClassName,
        sizeMap[size],
        className,
      )}
      aria-hidden
    >
      {def.monogram}
    </div>
  );
}
