import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IntegrationProviderDefinition, UserIntegrationConnection } from "@/lib/integrations/types";
import { IntegrationStatusBadge } from "./IntegrationStatusBadge";
import { ConnectIntegrationButton } from "./ConnectIntegrationButton";
import { Unplug } from "lucide-react";
import { ProviderLogo } from "./ProviderLogo";

function formatWhen(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

type Props = {
  def: IntegrationProviderDefinition;
  connection?: UserIntegrationConnection;
  onConnect: (id: IntegrationProviderDefinition["id"]) => void;
  onDisconnect: (id: IntegrationProviderDefinition["id"]) => void;
};

export function IntegrationProviderCard({ def, connection, onConnect, onDisconnect }: Props) {
  const status = connection?.status ?? "disconnected";
  return (
    <Card className="relative overflow-hidden border-border/80 bg-card/50 shadow-sm transition-shadow hover:shadow-md">
      <div className={cn("absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary/40 to-primary/5")} />
      <CardHeader className="pb-2 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <ProviderLogo providerId={def.id} def={def} size="md" />
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold leading-tight text-foreground">{def.name}</h3>
                <IntegrationStatusBadge status={status} />
              </div>
              <p className="text-xs text-muted-foreground">Scopes: {def.scopesSummary}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
            <ConnectIntegrationButton
              providerId={def.id}
              status={status}
              onConnect={onConnect}
              onReconnect={onConnect}
              size="sm"
            />
            {status === "connected" && (
              <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => onDisconnect(def.id)}>
                <Unplug className="h-3.5 w-3.5" />
                Disconnect
              </Button>
            )}
          </div>
        </div>
        <CardDescription className="pl-0 pt-2 text-sm leading-relaxed text-muted-foreground">{def.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 border-t border-border/50 bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
        {connection?.accountEmail && (
          <p>
            <span className="font-medium text-foreground">Account: </span>
            {connection.accountEmail}
          </p>
        )}
        {connection?.lastError && (status === "error" || status === "expired" || status === "pending") && (
          <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">{connection.lastError}</p>
        )}
        <p>
          <span className="font-medium text-foreground">Last connected: </span>
          {formatWhen(connection?.connectedAt ?? connection?.lastSuccessfulSyncAt)}
        </p>
      </CardContent>
    </Card>
  );
}
