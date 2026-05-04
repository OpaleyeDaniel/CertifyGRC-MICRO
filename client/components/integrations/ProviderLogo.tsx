import { useState } from "react";
import { cn } from "@/lib/utils";
import { getProvider } from "@/lib/integrations/providers";
import { INTEGRATION_LOGO_PATHS } from "@/lib/integrations/providerLogos";
import type { IntegrationProviderDefinition, IntegrationProviderId } from "@/lib/integrations/types";
import { ProviderBrandMark } from "./ProviderBrandMark";

type Props = {
  providerId: IntegrationProviderId;
  /** @deprecated prefer providerId + registry */
  def?: IntegrationProviderDefinition;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeToPx: Record<NonNullable<Props["size"]>, number> = { sm: 32, md: 44, lg: 56 };

/**
 * Renders the provider’s official-style logo (Simple Icons, MIT).
 * White backing ensures multi-tone marks read in dark mode; falls back to monogram on error.
 */
export function ProviderLogo({ providerId, def: defProp, size = "md", className }: Props) {
  const def = defProp ?? getProvider(providerId);
  const [failed, setFailed] = useState(false);
  const px = sizeToPx[size];
  const src = INTEGRATION_LOGO_PATHS[providerId];
  const label = def?.name ?? providerId;
  const markSize = size === "lg" ? "lg" : size === "sm" ? "sm" : "md";

  if (!def) {
    return <div className={cn("h-9 w-9 rounded-xl border border-border/60 bg-muted", className)} aria-hidden />;
  }
  if (failed) {
    return <ProviderBrandMark def={def} size={markSize} className={className} />;
  }

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-white p-1.5 shadow-sm dark:ring-1 dark:ring-white/10",
        className,
      )}
      style={{ width: px, height: px }}
    >
      <img
        src={src}
        alt={label}
        className="max-h-[85%] max-w-[85%] object-contain [filter:none] dark:opacity-95"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
