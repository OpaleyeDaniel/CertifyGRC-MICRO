import type { IntegrationProviderId } from "./types";

/**
 * Public SVG assets under `/integrations` (Vite public dir).
 * Icons are from Simple Icons (MIT): https://github.com/simple-icons/simple-icons
 * — monochromatic product marks, suitable for in-app connection UI.
 */
export const INTEGRATION_LOGO_PATHS: Record<IntegrationProviderId, string> = {
  google_drive: "/integrations/google-drive.svg",
  onedrive: "/integrations/onedrive.svg",
  sharepoint: "/integrations/sharepoint.svg",
  dropbox: "/integrations/dropbox.svg",
  box: "/integrations/box.svg",
  notion: "/integrations/notion.svg",
};
