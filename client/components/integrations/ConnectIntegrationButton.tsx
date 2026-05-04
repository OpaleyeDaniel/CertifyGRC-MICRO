import { Button } from "@/components/ui/button";
import { Loader2, Plug } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConnectionStatus, IntegrationProviderId } from "@/lib/integrations/types";

type Props = {
  providerId: IntegrationProviderId;
  status: ConnectionStatus | "disconnected" | string;
  onConnect: (id: IntegrationProviderId) => void;
  onReconnect?: (id: IntegrationProviderId) => void;
  size?: "sm" | "default";
  className?: string;
};

const KNOWN: ConnectionStatus[] = ["disconnected", "connected", "expired", "error", "pending"];

function norm(s: string): ConnectionStatus {
  return KNOWN.includes(s as ConnectionStatus) ? (s as ConnectionStatus) : "disconnected";
}

export function ConnectIntegrationButton({ providerId, status, onConnect, onReconnect, size = "default", className }: Props) {
  status = norm(status);
  if (status === "pending") {
    return (
      <Button type="button" size={size} variant="secondary" className={cn("gap-2", className)} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        Connecting
      </Button>
    );
  }
  if (status === "expired" || status === "error") {
    return (
      <Button type="button" size={size} className={cn("gap-2", className)} onClick={() => (onReconnect ?? onConnect)(providerId)}>
        <Plug className="h-4 w-4" />
        Reconnect
      </Button>
    );
  }
  if (status === "connected") return null;
  return (
    <Button type="button" size={size} className={cn("gap-2", className)} onClick={() => onConnect(providerId)}>
      <Plug className="h-4 w-4" />
      Connect
    </Button>
  );
}
