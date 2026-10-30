import { apiBaseUrl } from "@/services/api/config";

/** Join API base with a relative media path from the guardian API. */
export function absoluteMediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;
  const base = apiBaseUrl();
  if (!base) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Cache-bust stills so Image reloads on poll. */
export function bustMediaUrl(url: string, at?: number | null): string {
  if (!url) return "";
  const stamp = at ?? Date.now();
  return `${url}${url.includes("?") ? "&" : "?"}t=${stamp}`;
}
