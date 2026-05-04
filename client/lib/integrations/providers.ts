import { Cloud, FileStack, LayoutGrid, Package, Archive } from "lucide-react";
import type { IntegrationProviderDefinition, IntegrationProviderId } from "./types";

const brand = {
  google: "text-[#4285F4]",
  ms: "text-[#0078D4]",
  dropbox: "text-[#0061FF]",
  box: "text-[#0061D5]",
  notion: "text-foreground",
} as const;

/** Monogram tiles use vendor palette cues — not embedded trademark logos (legal/safe) */
const tiles = {
  g: "bg-gradient-to-br from-[#4285F4] via-[#34A853] to-[#FBBC05] text-white",
  ms: "bg-[#0078D4] text-white",
  sp: "bg-[#038387] text-white",
  db: "bg-[#0061FF] text-white",
  bx: "bg-[#0061D5] text-white",
  n: "bg-foreground text-background",
} as const;

export const INTEGRATION_PROVIDERS: IntegrationProviderDefinition[] = [
  {
    id: "google_drive",
    name: "Google Drive",
    shortName: "Drive",
    description: "Attach evidence from My Drive and shared drives, as copies or links.",
    icon: Cloud,
    brandClassName: brand.google,
    monogram: "G",
    brandTileClassName: tiles.g,
    scopesSummary: "Read files you select; no broad mailbox access.",
    filePicker: true,
    oauthReady: true,
  },
  {
    id: "onedrive",
    name: "Microsoft OneDrive",
    shortName: "OneDrive",
    description: "Use files from the signed-in Microsoft 365 or personal account.",
    icon: Cloud,
    brandClassName: brand.ms,
    monogram: "OD",
    brandTileClassName: tiles.ms,
    scopesSummary: "Files.Read; offline access for session continuity when approved.",
    filePicker: true,
    oauthReady: true,
  },
  {
    id: "sharepoint",
    name: "Microsoft SharePoint",
    shortName: "SharePoint",
    description: "Browse team sites and libraries for policies and control evidence.",
    icon: FileStack,
    brandClassName: brand.ms,
    monogram: "S",
    brandTileClassName: tiles.sp,
    scopesSummary: "Sites / libraries selected by your admin.",
    filePicker: true,
    oauthReady: true,
  },
  {
    id: "dropbox",
    name: "Dropbox",
    shortName: "Dropbox",
    description: "Link or import from Dropbox business or personal workspaces.",
    icon: Archive,
    brandClassName: brand.dropbox,
    monogram: "DB",
    brandTileClassName: tiles.db,
    scopesSummary: "Read content in folders you connect.",
    filePicker: true,
    oauthReady: true,
  },
  {
    id: "box",
    name: "Box",
    shortName: "Box",
    description: "Enterprise content from Box with the same review workflow as local files.",
    icon: Package,
    brandClassName: brand.box,
    monogram: "B",
    brandTileClassName: tiles.bx,
    scopesSummary: "Folder-scoped read when your tenant allows.",
    filePicker: true,
    oauthReady: true,
  },
  {
    id: "notion",
    name: "Notion",
    shortName: "Notion",
    description: "Planned: link pages or exports as supporting narrative where applicable.",
    icon: LayoutGrid,
    brandClassName: brand.notion,
    monogram: "N",
    brandTileClassName: tiles.n,
    scopesSummary: "Future: read selected content with explicit grant.",
    filePicker: true,
    oauthReady: false,
  },
];

export const PROVIDERS_BY_ID: Record<IntegrationProviderId, IntegrationProviderDefinition> =
  INTEGRATION_PROVIDERS.reduce(
    (acc, p) => {
      acc[p.id] = p;
      return acc;
    },
    {} as Record<IntegrationProviderId, IntegrationProviderDefinition>,
  );

export function getProvider(id: IntegrationProviderId): IntegrationProviderDefinition | undefined {
  return PROVIDERS_BY_ID[id];
}
