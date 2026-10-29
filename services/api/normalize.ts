import type {
  AlertDto,
  CabinDto,
  GuardianDto,
  NoticeDto,
  RideDto,
} from "@/services/api/types";
import type {
  Coordinate,
  DriverState,
  Guardian,
  GuardianNotice,
  SafetyAlert,
  SafetyStatus,
  Seat,
} from "@/types/domain";

const DRIVER_STATES: DriverState[] = ["attentive", "drowsy", "distracted", "unavailable"];
const SAFETY_STATUSES: SafetyStatus[] = ["safe", "caution", "emergency"];

function asNumber(value: unknown, fallback: number | null = null): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeCoordinate(
  value: { latitude?: number | null; longitude?: number | null } | null | undefined,
): Coordinate | null {
  if (!value) return null;
  const latitude = asNumber(value.latitude);
  const longitude = asNumber(value.longitude);
  if (latitude === null || longitude === null) return null;
  return { latitude, longitude };
}

export function normalizeSeat(raw: Partial<Seat> | null | undefined): Seat | null {
  if (!raw || typeof raw !== "object") return null;
  const id = asString(raw.id);
  if (!id) return null;
  return {
    id,
    label: asString(raw.label, id),
    occupied: asBoolean(raw.occupied, false),
  };
}

export function normalizeSeats(raw: unknown): Seat[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => normalizeSeat(item as Seat)).filter((seat): seat is Seat => Boolean(seat));
}

export function normalizeDriverState(value: unknown): DriverState {
  return DRIVER_STATES.includes(value as DriverState) ? (value as DriverState) : "unavailable";
}

export function normalizeSafetyStatus(value: unknown): SafetyStatus {
  return SAFETY_STATUSES.includes(value as SafetyStatus) ? (value as SafetyStatus) : "safe";
}

export function normalizeRide(raw: Partial<RideDto> | null | undefined): RideDto | null {
  if (!raw || typeof raw !== "object") return null;
  const id = asString(raw.id);
  if (!id) return null;
  return {
    id,
    deviceId: asString(raw.deviceId),
    passenger: asString(raw.passenger),
    safetyStatus: normalizeSafetyStatus(raw.safetyStatus),
    driverState: normalizeDriverState(raw.driverState),
    deviceState: asString(raw.deviceState, "offline"),
    etaMin: asNumber(raw.etaMin),
    speedKmh: asNumber(raw.speedKmh),
    heading: asNumber(raw.heading),
    score: asNumber(raw.score, 98) ?? 98,
    shareLink: asString(raw.shareLink, `vms://trip/${id}`),
    position: raw.position
      ? {
          latitude: asNumber(raw.position.latitude),
          longitude: asNumber(raw.position.longitude),
        }
      : null,
    seats: normalizeSeats(raw.seats),
    updatedAt: asString(raw.updatedAt),
  };
}

export function normalizeAlert(raw: Partial<AlertDto> | null | undefined): SafetyAlert | null {
  if (!raw || typeof raw !== "object") return null;
  const id = asString(raw.id);
  if (!id) return null;
  const coordinate = normalizeCoordinate(raw.coordinate);
  return {
    id,
    tripId: asString(raw.tripId),
    kind: (raw.kind as SafetyAlert["kind"]) || "suspicious_activity",
    severity: (raw.severity as SafetyAlert["severity"]) || "info",
    title: asString(raw.title, "Alert"),
    detail: asString(raw.detail),
    at: asNumber(raw.at, Date.now()) ?? Date.now(),
    locationLabel: asString(raw.locationLabel),
    coordinate: coordinate ?? { latitude: 0, longitude: 0 },
    acknowledged: asBoolean(raw.acknowledged, false),
    evidenceId: raw.evidenceId ? asString(raw.evidenceId) : undefined,
    origin: (raw.origin as SafetyAlert["origin"]) || "vehicle",
  };
}

export function normalizeAlerts(raw: unknown): SafetyAlert[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeAlert(item as AlertDto))
    .filter((alert): alert is SafetyAlert => Boolean(alert));
}

export function normalizeGuardian(raw: Partial<GuardianDto> | null | undefined): Guardian | null {
  if (!raw || typeof raw !== "object") return null;
  const id = asString(raw.id);
  const name = asString(raw.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    relationship: asString(raw.relationship),
    phone: asString(raw.phone),
    sharing: asBoolean(raw.sharing, true),
    lastNotifiedAt: asNumber(raw.lastNotifiedAt),
  };
}

export function normalizeGuardians(raw: unknown): Guardian[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeGuardian(item as GuardianDto))
    .filter((guardian): guardian is Guardian => Boolean(guardian));
}

export function normalizeNotice(raw: Partial<NoticeDto> | null | undefined): GuardianNotice | null {
  if (!raw || typeof raw !== "object") return null;
  const id = asString(raw.id);
  if (!id) return null;
  return {
    id,
    at: asNumber(raw.at, Date.now()) ?? Date.now(),
    title: asString(raw.title, "Notice"),
    body: asString(raw.body),
    guardianNames: Array.isArray(raw.guardianNames)
      ? raw.guardianNames.filter((name): name is string => typeof name === "string")
      : [],
    origin: (raw.origin as GuardianNotice["origin"]) || "vehicle",
  };
}

export function normalizeNotices(raw: unknown): GuardianNotice[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeNotice(item as NoticeDto))
    .filter((notice): notice is GuardianNotice => Boolean(notice));
}

export function normalizeCabin(raw: Partial<CabinDto> | null | undefined): CabinDto | null {
  if (!raw || typeof raw !== "object") return null;
  return {
    driverState: normalizeDriverState(raw.driverState),
    seats: normalizeSeats(raw.seats),
    safetyStatus: normalizeSafetyStatus(raw.safetyStatus),
  };
}
