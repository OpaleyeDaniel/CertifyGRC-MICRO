import { useMemo, useState } from "react";
import { Cloud, Link2, Lock, Plug, ServerOff, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUserIntegrations } from "@/lib/integrations/useUserIntegrations";
import { isIntegrationsApiConfigured } from "@/lib/integrations/integrationEnv";
import { IntegrationProviderCard } from "@/components/integrations/IntegrationProviderCard";
import { DisconnectIntegrationModal } from "@/components/integrations/DisconnectIntegrationModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { IntegrationProviderId } from "@/lib/integrations/types";

function StatPill({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "success" | "warning" | "danger" | "muted" }) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border/70 bg-card/60 px-4 py-3 shadow-sm backdrop-blur-sm",
        tone === "success" && "border-emerald-500/25 bg-emerald-500/5",
        tone === "warning" && "border-amber-500/25 bg-amber-500/5",
        tone === "danger" && "border-rose-500/25 bg-rose-500/5",
        tone === "muted" && "bg-muted/30",
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function ConnectedAppsSettings() {
  const { currentUser } = useAuth();
  const actor = { id: currentUser?.id, label: currentUser?.fullName ?? currentUser?.email };
  const { providers, connect, disconnect, getConnection, connections } = useUserIntegrations(actor);
  const [toDisconnect, setToDisconnect] = useState<IntegrationProviderId | null>(null);

  const connectionStats = useMemo(() => {
    let connected = 0;
    let pending = 0;
    let needsAction = 0;
    for (const p of providers) {
      const s = connections[p.id]?.status ?? "disconnected";
      if (s === "connected") connected += 1;
      else if (s === "pending") pending += 1;
      else if (s === "error" || s === "expired") needsAction += 1;
    }
    return { connected, pending, needsAction, total: providers.length };
  }, [providers, connections]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Plug className="h-3.5 w-3.5" />
          Integrations
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Connected apps</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Link cloud file libraries to attach evidence with traceability. OAuth tokens belong on your CertifyGRC server.
            This view reflects browser-stored status until your backend completes sign-in. Account email appears only when a
            real connection is stored.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill label="Connected" value={connectionStats.connected} tone={connectionStats.connected > 0 ? "success" : "muted"} />
          <StatPill label="In progress" value={connectionStats.pending} tone={connectionStats.pending > 0 ? "warning" : "default"} />
          <StatPill label="Needs action" value={connectionStats.needsAction} tone={connectionStats.needsAction > 0 ? "danger" : "default"} />
          <StatPill label="Providers" value={connectionStats.total} />
        </div>
      </div>

      {!isIntegrationsApiConfigured() && (
        <Alert className="border-amber-500/30 bg-amber-500/5 text-amber-950 dark:text-amber-100 [&>svg]:text-amber-700 dark:[&>svg]:text-amber-400">
          <ServerOff className="h-4 w-4" />
          <AlertTitle>Integrations service URL not set</AlertTitle>
          <AlertDescription>
            Add <code className="rounded bg-background/80 px-1 py-0.5 text-xs">VITE_INTEGRATIONS_API_URL</code> to your
            client build to enable OAuth. “Connect” will explain the gap until the URL is present.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-primary/[0.07] to-transparent p-5 shadow-sm">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Security &amp; data handling</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Use least-privilege scopes. Disconnecting stops new imports; items already in CertifyGRC remain. Linked
                files may be unreachable if a connection is removed.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/50 p-5 shadow-sm">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Link2 className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Evidence workflow</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                After a provider is connected, use{" "}
                <span className="font-medium text-foreground">Add evidence</span> in assessments to open the cloud file
                picker. Local upload always works without a connection.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">File platforms</h2>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Cloud className="h-3.5 w-3.5" />
            Product logos (Simple Icons, MIT) — not affiliated endorsements
          </span>
        </div>
        <div className="grid gap-4">
          {providers.map((def) => (
            <IntegrationProviderCard
              key={def.id}
              def={def}
              connection={getConnection(def.id)}
              onConnect={connect}
              onDisconnect={setToDisconnect}
            />
          ))}
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        Connect/disconnect and evidence events are logged locally in this build for audit trail review.
      </p>

      <DisconnectIntegrationModal
        open={toDisconnect != null}
        onOpenChange={(o) => !o && setToDisconnect(null)}
        providerId={toDisconnect}
        onConfirm={() => toDisconnect && disconnect(toDisconnect)}
      />
    </div>
  );
}
