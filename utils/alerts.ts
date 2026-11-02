import type { SafetyAlert } from "@/types/domain";

/** A clip id the alerts API actually returned. Empty and the string "null" do not count. */
export function hasAlertClip(alert: { clipId?: string | null }): boolean {
  const id = typeof alert.clipId === "string" ? alert.clipId.trim() : "";
  return id.length > 0 && id.toLowerCase() !== "null";
}

/**
 * Readable line from the alert payload.
 * Uses `detail` when the API sent one. Otherwise joins the structured fields that are present.
 */
export function alertDescription(alert: SafetyAlert): string {
  const detail = alert.detail?.trim();
  if (detail) return detail;
  const camera = alert.channel === "dms" ? "Driver camera" : alert.channel === "cms" ? "Cabin camera" : null;
  const kind = alert.kind ? alert.kind.replace(/_/g, " ") : null;
  const where = alert.locationLabel?.trim() || null;
  const parts = [alert.orinType?.trim() || null, kind, camera, where].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : "The API did not include a description.";
}

export function cameraLabel(channel?: string | null): string | null {
  if (channel === "dms") return "Driver";
  if (channel === "cms") return "Cabin";
  return null;
}
