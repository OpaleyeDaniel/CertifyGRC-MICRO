import type { ExternalFileReference, IntegrationProviderId } from "./types";

export function getMockProviderFiles(providerId: IntegrationProviderId): ExternalFileReference[] {
  const base = `/${String(providerId).replace(/_/g, " ")}/Evidence`;
  return [
    {
      providerId,
      externalFileId: `mock_${providerId}_1`,
      path: `${base}/Policy-Access-2024.pdf`,
      name: "Policy-Access-2024.pdf",
      mimeType: "application/pdf",
      sizeBytes: 245_000,
    },
    {
      providerId,
      externalFileId: `mock_${providerId}_2`,
      path: `${base}/MFA/Enrollment.png`,
      name: "enrollment.png",
      mimeType: "image/png",
      sizeBytes: 412_000,
    },
    {
      providerId,
      externalFileId: `mock_${providerId}_3`,
      path: `${base}/IA/2025-04-review.docx`,
      name: "2025-04-review.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: 89_000,
    },
  ];
}
