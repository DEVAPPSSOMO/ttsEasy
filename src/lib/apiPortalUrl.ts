const DEFAULT_API_PORTAL_BASE_URL = "https://api.ttseasy.com";

function normalizeBaseUrl(value: string): string | null {
  try {
    return new URL(value).toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export function getApiPortalHref(path: string, rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const configuredBaseUrl = normalizeBaseUrl((rawBaseUrl ?? "").trim());
  const baseUrl = configuredBaseUrl ?? DEFAULT_API_PORTAL_BASE_URL;

  return new URL(normalizedPath, `${baseUrl}/`).toString();
}
