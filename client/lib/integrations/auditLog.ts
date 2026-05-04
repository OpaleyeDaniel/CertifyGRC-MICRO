import {
  INTEGRATION_AUDIT_LOG_KEY,
  type IntegrationAuditEvent,
  type IntegrationAuditEventType,
  type IntegrationProviderId,
} from "./types";

const MAX_EVENTS = 500;

function randomId() {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readStore(): IntegrationAuditEvent[] {
  try {
    const raw = localStorage.getItem(INTEGRATION_AUDIT_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as IntegrationAuditEvent[]) : [];
  } catch {
    return [];
  }
}

function writeStore(events: IntegrationAuditEvent[]) {
  localStorage.setItem(INTEGRATION_AUDIT_LOG_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
}

export function appendIntegrationAuditEvent(
  e: Omit<IntegrationAuditEvent, "id" | "at"> & { id?: string; at?: string },
): IntegrationAuditEvent {
  const event: IntegrationAuditEvent = {
    id: e.id ?? randomId(),
    at: e.at ?? new Date().toISOString(),
    type: e.type,
    actorUserId: e.actorUserId,
    actorLabel: e.actorLabel,
    providerId: e.providerId,
    message: e.message,
    context: e.context,
  };
  writeStore([...readStore(), event]);
  return event;
}

export function logIntegrationEvent(
  type: IntegrationAuditEventType,
  opts: {
    actorUserId?: string;
    actorLabel?: string;
    providerId?: IntegrationProviderId;
    message?: string;
    context?: Record<string, string | undefined>;
  } = {},
) {
  return appendIntegrationAuditEvent({ type, ...opts });
}

export function readIntegrationAuditLog(): IntegrationAuditEvent[] {
  return readStore();
}
