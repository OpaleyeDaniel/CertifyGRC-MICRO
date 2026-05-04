import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/lib/integrations/types";

const LABELS: Record<ConnectionStatus, string> = {
  disconnected: "Not connected",
  connected: "Connected",
  expired: "Reconnect required",
  error: "Error",
  pending: "Connecting…",
};

const STYLES: Record<ConnectionStatus, string> = {
  disconnected: "bg-muted text-muted-foreground border-border",
  connected: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
  expired: "bg-amber-500/10 text-amber-800 border-amber-500/25 dark:text-amber-300",
  error: "bg-destructive/10 text-destructive border-destructive/20",
  pending: "bg-primary/10 text-primary border-primary/20",
};

const VALID: ConnectionStatus[] = ["disconnected", "connected", "expired", "error", "pending"];

function normalizeStatus(s: string | undefined | null): ConnectionStatus {
  if (s && VALID.includes(s as ConnectionStatus)) return s as ConnectionStatus;
  return "disconnected";
}

export function IntegrationStatusBadge({ status, className }: { status: ConnectionStatus | string; className?: string }) {
  const key = normalizeStatus(status);
  return (
    <Badge variant="outline" className={cn("font-medium", STYLES[key], className)}>
      {LABELS[key]}
    </Badge>
  );
}
