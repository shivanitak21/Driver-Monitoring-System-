import type { Coordinate, DriverState, SafetyStatus } from "@/types/domain";

/** Build map geometry only from API position/trail — never invent a demo route. */
export function liveMapGeometry(position: Coordinate, trail: Coordinate[]) {
  const path = trail.length > 0 ? trail : [position];
  return {
    route: path.length > 1 ? path : [],
    trail: path.length > 1 ? path : [],
    origin: path[0],
    destination: path[path.length - 1],
  };
}

export function formatMetric(value: number | null | undefined, suffix: string, digits = 0) {
  if (value == null || Number.isNaN(value)) return "—";
  const n = digits > 0 ? value.toFixed(digits) : String(Math.round(value));
  return `${n}${suffix ? ` ${suffix}` : ""}`;
}

/** ETA 0 from the API means unset/stopped for this demo host — don't show "0 min". */
export function formatEta(value: number | null | undefined) {
  if (value == null || Number.isNaN(value) || value <= 0) return "—";
  return `${Math.round(value)} min`;
}

export function formatSpeed(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value)} km/h`;
}

export function formatCoords(position: Coordinate | null | undefined) {
  if (!position) return "No fix";
  return `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`;
}

export function rideStatusLabel(input: {
  safetyStatus: SafetyStatus;
  deviceState: string;
  speedKmh: number | null;
}) {
  const device = (input.deviceState || "").toLowerCase();
  if (input.safetyStatus === "emergency") return "Emergency";
  if (input.safetyStatus === "caution") return "Caution";
  if (device && device !== "online") return "Device offline";
  if ((input.speedKmh ?? 0) <= 0) return "Stopped";
  return "On route";
}

export function driverStateLabel(state: DriverState) {
  switch (state) {
    case "attentive":
      return "Attentive";
    case "drowsy":
      return "Drowsy";
    case "distracted":
      return "Distracted";
    case "unavailable":
      return "Unavailable";
    default:
      return "Unknown";
  }
}

/** Seat slots the API may populate later. */
export const CABIN_SEAT_SLOTS = [
  { id: "driver", label: "Driver" },
  { id: "front", label: "Front" },
  { id: "rear-left", label: "Rear Left" },
  { id: "rear-right", label: "Rear Right" },
] as const;
