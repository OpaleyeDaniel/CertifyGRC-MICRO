import { INTEGRATION_PROVIDERS } from "@/lib/integrations/providers";
import { isIntegrationsApiConfigured } from "@/lib/integrations/integrationEnv";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConnectionStatus, IntegrationProviderId } from "@/lib/integrations/types";
import { ConnectIntegrationButton } from "./ConnectIntegrationButton";
import { ProviderLogo } from "./ProviderLogo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileSearch, ServerOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ConnMap = Partial<Record<IntegrationProviderId, ConnectionStatus | undefined>>;

type Props = { connections: ConnMap; onConnect: (id: IntegrationProviderId) => void; onBrowse: (id: IntegrationProviderId) => void };

/** Connected providers first, then the rest (stable by registry order). */
function orderedProviders(connections: ConnMap) {
  const list = INTEGRATION_PROVIDERS.filter((p) => p.filePicker);
  return [...list].sort((a, b) => {
    const ac = connections[a.id] === "connected" ? 0 : 1;
    const bc = connections[b.id] === "connected" ? 0 : 1;
    return ac - bc;
  });
}

export function ExternalProviderPickerPanel({ connections, onConnect, onBrowse }: Props) {
  const navigate = useNavigate();
  const ordered = orderedProviders(connections);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Use a connected cloud library, or add accounts in{" "}
        <button
          type="button"
          className="font-medium text-primary underline-offset-2 hover:underline"
          onClick={() => navigate("/settings?tab=integrations")}
        >
          Settings → Connected apps
        </button>
        . Cloud import needs a real connection from your organization&apos;s CertifyGRC integrations service.
      </p>
      {!isIntegrationsApiConfigured() && (
        <Alert className="border-amber-500/30 bg-amber-500/5 text-amber-950 dark:text-amber-100 [&>svg]:text-amber-700 dark:[&>svg]:text-amber-400">
          <ServerOff className="h-4 w-4" />
          <AlertTitle>Connect setup required</AlertTitle>
          <AlertDescription>
            Set <code className="rounded bg-background/80 px-1 py-0.5 text-xs">VITE_INTEGRATIONS_API_URL</code> to your
            backend base URL, then use Connect in Settings. Local uploads from this device are unaffected.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {ordered.map((p) => {
          const st = (connections[p.id] ?? "disconnected") as ConnectionStatus;
          const isConnected = st === "connected";
          const canCloudBrowse = isIntegrationsApiConfigured() && p.oauthReady;
          return (
            <div
              key={p.id}
              className={cn(
                "flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-sm",
                isConnected && "ring-1 ring-primary/20",
              )}
            >
              <div className="flex items-start gap-2">
                <ProviderLogo providerId={p.id} def={p} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight text-foreground">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{p.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isConnected && canCloudBrowse ? (
                  <Button type="button" size="sm" className="gap-1" onClick={() => onBrowse(p.id)}>
                    <FileSearch className="h-3.5 w-3.5" />
                    Browse
                  </Button>
                ) : isConnected && !canCloudBrowse ? (
                  <span className="text-xs text-amber-800 dark:text-amber-300/90">Browser unavailable until service is ready</span>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground">
                      {st === "pending" ? "Sign-in in progress" : st === "error" || st === "expired" ? "Needs action" : "Not connected"}
                    </span>
                    <ConnectIntegrationButton
                      providerId={p.id}
                      status={st}
                      onConnect={onConnect}
                      size="sm"
                    />
                  </>
                )}
                {!p.oauthReady && <span className="text-[11px] text-muted-foreground">Setup required</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
