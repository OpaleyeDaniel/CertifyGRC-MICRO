import { useCallback, useSyncExternalStore } from "react";
import {
  INTEGRATIONS_STORAGE_KEY,
  type ConnectionStatus,
  type IntegrationProviderId,
  type UserIntegrationConnection,
} from "./types";
import { getProvider, INTEGRATION_PROVIDERS } from "./providers";
import { appendIntegrationAuditEvent } from "./auditLog";
import { getIntegrationsApiBase, isIntegrationsApiConfigured } from "./integrationEnv";

type StoreShape = { connections: Record<string, UserIntegrationConnection> };

const EMPTY: StoreShape = { connections: {} };

const MSG_NO_BACKEND =
  "Integrations API is not configured. Set VITE_INTEGRATIONS_API_URL to your CertifyGRC integrations service (OAuth + token exchange), then deploy.";

const listeners = new Set<() => void>();

let clientSnapshot: StoreShape = EMPTY;

function loadFromStorage(): StoreShape {
  if (typeof localStorage === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(INTEGRATIONS_STORAGE_KEY);
    if (!raw) return { connections: {} };
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed || typeof parsed.connections !== "object" || parsed.connections === null) {
      return { connections: {} };
    }
    return { connections: { ...parsed.connections } };
  } catch {
    return { connections: {} };
  }
}

function getSnapshot() {
  return clientSnapshot;
}

function getServerSnapshot() {
  return EMPTY;
}

function commit(next: StoreShape) {
  clientSnapshot = next;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(INTEGRATIONS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota */
    }
  }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  clientSnapshot = loadFromStorage();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === INTEGRATIONS_STORAGE_KEY) {
      clientSnapshot = loadFromStorage();
      fn();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

function readCurrent(): StoreShape {
  return clientSnapshot;
}

/**
 * When API is configured, start OAuth in a new window. Server must complete token exchange
 * and (optionally) postMessage or poll — we do not set fake "connected" with dummy emails.
 */
function openOAuthStartWindow(providerId: IntegrationProviderId) {
  const base = getIntegrationsApiBase()!;
  const returnTo = `${window.location.origin}/settings?tab=integrations`;
  const url = `${base}/v1/integrations/${providerId}/oauth/start?return_to=${encodeURIComponent(returnTo)}`;
  const w = window.open(url, "certifygrc_oauth", "width=520,height=720,noopener,noreferrer");
  if (!w) {
    const storeNow = readCurrent();
    commit({
      connections: {
        ...storeNow.connections,
        [providerId]: {
          providerId,
          status: "error" as ConnectionStatus,
          lastError: "Pop-up blocked. Allow pop-ups for this site to sign in.",
        },
      },
    });
  }
}

export function useUserIntegrations(actor?: { id?: string; label?: string }) {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const getConnection = useCallback(
    (id: IntegrationProviderId): UserIntegrationConnection | undefined => store.connections[id],
    [store],
  );

  const connect = useCallback(
    (providerId: IntegrationProviderId) => {
      const p = getProvider(providerId);
      if (!p) return;

      if (!p.oauthReady) {
        const storeNow = readCurrent();
        commit({
          connections: {
            ...storeNow.connections,
            [providerId]: {
              providerId,
              status: "error" as ConnectionStatus,
              accountLabel: p.name,
              lastError: "This provider is not available yet. Backend OAuth scopes are not defined.",
            },
          },
        });
        appendIntegrationAuditEvent({
          type: "evidence_source_access_failed",
          providerId,
          actorUserId: actor?.id,
          actorLabel: actor?.label,
          message: p.name,
        });
        return;
      }

      if (!isIntegrationsApiConfigured()) {
        const storeNow = readCurrent();
        commit({
          connections: {
            ...storeNow.connections,
            [providerId]: {
              providerId,
              status: "error" as ConnectionStatus,
              accountLabel: p.name,
              lastError: MSG_NO_BACKEND,
            },
          },
        });
        appendIntegrationAuditEvent({
          type: "evidence_source_access_failed",
          providerId,
          actorUserId: actor?.id,
          actorLabel: actor?.label,
          message: "integrations API URL missing",
        });
        return;
      }

      commit({
        connections: {
          ...readCurrent().connections,
          [providerId]: {
            providerId,
            status: "pending" as ConnectionStatus,
            accountLabel: p.name,
            lastError: "Complete sign-in in the new window. This screen updates when the server stores your connection.",
          },
        },
      });
      openOAuthStartWindow(providerId);
      appendIntegrationAuditEvent({
        type: "integration_oauth_started",
        providerId,
        actorUserId: actor?.id,
        actorLabel: actor?.label,
        message: `OAuth window opened for ${p.name} — server must complete token exchange`,
      });
    },
    [actor],
  );

  const disconnect = useCallback(
    (providerId: IntegrationProviderId) => {
      const prev = readCurrent().connections[providerId];
      const { [providerId]: _, ...rest } = readCurrent().connections;
      commit({ connections: rest });
      appendIntegrationAuditEvent({
        type: "integration_disconnected",
        providerId,
        actorUserId: actor?.id,
        actorLabel: actor?.label,
        message: `Disconnected ${getProvider(providerId)?.name ?? providerId}`,
        context: { hadEmail: prev?.accountEmail },
      });
    },
    [actor],
  );

  return {
    providers: INTEGRATION_PROVIDERS,
    connections: store.connections,
    getConnection,
    connect,
    disconnect,
  };
}
