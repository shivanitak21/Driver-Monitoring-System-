import { ApiError } from "@/services/api/http";

/** Turn native and API failures into one short line for the screen. */
export function friendlyActionError(error: unknown): string {
  const raw = error instanceof Error ? error.message : "";
  if (/requestPermissionsAsync|AndroidManifest|AUDIO permission|ExpoMediaLibrary|granularPermissions/i.test(raw)) {
    return "Couldn’t save to Photos on this phone.";
  }
  if (error instanceof ApiError) {
    if (error.status === 404) return "Nothing to capture yet. Wait for the camera, then try again.";
    if (error.status === 403) return "Sharing is off, so this is blocked.";
    if (error.status === 409) return "The car isn’t ready for that yet.";
    const detail = (error.detail || error.message).trim();
    if (!detail || detail.length > 120 || /call to function/i.test(detail)) return "That didn’t work. Try again.";
    return detail;
  }
  if (/add a guardian/i.test(raw)) return "Add someone in Family first.";
  if (!raw || raw.length > 140 || /call to function/i.test(raw)) return "That didn’t work. Try again.";
  return raw;
}
