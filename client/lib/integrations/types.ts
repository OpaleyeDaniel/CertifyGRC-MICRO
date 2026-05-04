import type { LucideIcon } from "lucide-react";

export type IntegrationProviderId =
  | "google_drive"
  | "onedrive"
  | "sharepoint"
  | "dropbox"
  | "box"
  | "notion";

export type ConnectionStatus = "disconnected" | "connected" | "expired" | "error" | "pending";

export type EvidenceStorageMode = "import" | "link";

export interface ExternalFileReference {
  providerId: IntegrationProviderId;
  externalFileId: string;
  path: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  modifiedAt?: string;
}

export type EvidenceAccessState = "available" | "link_may_be_invalid" | "imported_copy";

export interface EvidenceAttachment {
  id: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  sourceProvider: IntegrationProviderId | "local";
  storageMode: EvidenceStorageMode;
  externalRef?: ExternalFileReference;
  attachedAt: string;
  attachedByUserId?: string;
  attachedByLabel?: string;
  frameworkId?: string;
  controlRef?: string;
  questionId?: string;
  reviewStatus?: string;
  accessState: EvidenceAccessState;
}

export interface IntegrationProviderDefinition {
  id: IntegrationProviderId;
  name: string;
  shortName: string;
  description: string;
  icon: LucideIcon;
  brandClassName: string;
  /** Monogram for brand tile (not a third-party logo asset — avoids trademark issues) */
  monogram: string;
  /** Tile background — official-style palette */
  brandTileClassName: string;
  scopesSummary: string;
  filePicker: boolean;
  /** Product intent: this provider can be wired to OAuth when backend exists */
  oauthReady: boolean;
}

export interface UserIntegrationConnection {
  providerId: IntegrationProviderId;
  status: ConnectionStatus;
  accountEmail?: string;
  accountLabel?: string;
  connectedAt?: string;
  lastSuccessfulSyncAt?: string;
  lastError?: string;
  connectionRef?: string;
}

export type IntegrationAuditEventType =
  | "integration_connected"
  | "integration_oauth_started"
  | "integration_disconnected"
  | "integration_reconnect_required"
  | "evidence_uploaded_local"
  | "evidence_attached_from_provider"
  | "evidence_external_link_added"
  | "evidence_source_access_failed"
  | "evidence_removed";

export interface IntegrationAuditEvent {
  id: string;
  type: IntegrationAuditEventType;
  at: string;
  actorUserId?: string;
  actorLabel?: string;
  providerId?: IntegrationProviderId;
  message?: string;
  context?: Record<string, string | undefined>;
}

/**
 * Backend contract (no secrets in the browser; tokens server-side only):
 * - GET  /api/integrations/providers
 * - GET  /api/integrations/:providerId/oauth/start?returnTo=
 * - POST /api/integrations/:providerId/disconnect
 * - GET  /api/integrations/:providerId/files?path=
 * - POST /api/evidence/import-from-provider
 */
export const INTEGRATIONS_STORAGE_KEY = "certifygrc_user_integrations_v1";
export const INTEGRATION_AUDIT_LOG_KEY = "certifygrc_integration_audit_v1";
