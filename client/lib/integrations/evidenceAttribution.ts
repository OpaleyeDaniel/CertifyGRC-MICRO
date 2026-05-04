/**
 * Map picker results to framework evidence shapes — keep provider field names out of NIST/ISO components.
 */
import type { ExternalFileReference } from "./types";
import type { EvidenceFile as NistEvidenceFile } from "@/lib/assessmentQuestions";

export function nistEvidenceFromLocalFile(
  file: File,
  opts: { attachedBy?: string } = {},
): NistEvidenceFile {
  return {
    url: `/evidence/${file.name}`,
    name: file.name,
    size: file.size,
    sourceKind: "local",
    storageMode: "import",
    attachedBy: opts.attachedBy,
    attachedAt: new Date().toISOString(),
  };
}

export function nistEvidenceFromExternal(
  ref: ExternalFileReference,
  mode: "import" | "link",
  opts: { attachedBy?: string } = {},
): NistEvidenceFile {
  return {
    url: `extern://${ref.providerId}/${ref.externalFileId}`,
    name: ref.name,
    size: ref.sizeBytes,
    sourceKind: "cloud",
    storageMode: mode,
    providerId: ref.providerId,
    externalFileId: ref.externalFileId,
    externalPath: ref.path,
    attachedBy: opts.attachedBy,
    attachedAt: new Date().toISOString(),
  };
}
