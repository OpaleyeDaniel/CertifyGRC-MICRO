/**
 * Set `VITE_INTEGRATIONS_API_URL` (e.g. https://api.yourorg.com) when the backend exposes:
 *   GET/POST  /v1/integrations/:providerId/oauth/start
 *   (and callback routes that set HttpOnly session cookies)
 * Until then, the UI stays in "setup required" — we do not fabricate connected accounts.
 */
export function getIntegrationsApiBase(): string | null {
  const v = import.meta.env.VITE_INTEGRATIONS_API_URL;
  if (typeof v !== "string" || !v.trim()) return null;
  return v.replace(/\/$/, "");
}

export function isIntegrationsApiConfigured(): boolean {
  return getIntegrationsApiBase() !== null;
}
