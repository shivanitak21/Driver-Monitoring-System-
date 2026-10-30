import { absoluteMediaUrl } from "@/services/api/media";
import type {
  AlertClipDto,
  AlertDto,
  AnalysisDto,
  CabinDto,
  GuardianDto,
  HistoryRideDto,
  LiveFrameDto,
  NoticeDto,
  RideDto,
  VideoSessionDto,
} from "@/services/api/types";
import type {
  AlertClip,
  AnalysisSide,
  Coordinate,
  DriverState,
  Guardian,
  GuardianNotice,
  HistoryRide,
  LiveFrame,
  MediaChannel,
  RideAnalysis,
  SafetyAlert,
  SafetyStatus,
  Seat,
  VideoSession,
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
    publisherOnline: asBoolean(raw.publisherOnline, false),
    status: raw.status === "ended" ? "ended" : "active",
    startedAt: asNumber(raw.startedAt),
    endedAt: asNumber(raw.endedAt),
  };
}

export function normalizeAlert(raw: Partial<AlertDto> | null | undefined): SafetyAlert | null {
  if (!raw || typeof raw !== "object") return null;
  const id = asString(raw.id);
  if (!id) return null;
  const coordinate = normalizeCoordinate(raw.coordinate);
  const channel = raw.channel === "cms" || raw.channel === "dms" ? raw.channel : undefined;
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
    channel,
    orinType: raw.orinType ? asString(raw.orinType) : undefined,
    confidence: asNumber(raw.confidence),
    clipId: raw.clipId ? asString(raw.clipId) : null,
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

export function normalizeHistoryRide(raw: Partial<HistoryRideDto> | null | undefined): HistoryRide | null {
  if (!raw || typeof raw !== "object") return null;
  const id = asString(raw.id);
  if (!id) return null;
  return {
    id,
    deviceId: asString(raw.deviceId),
    passenger: asString(raw.passenger),
    status: raw.status === "ended" ? "ended" : "active",
    startedAt: asNumber(raw.startedAt),
    endedAt: asNumber(raw.endedAt),
    safetyStatus: normalizeSafetyStatus(raw.safetyStatus),
    score: asNumber(raw.score, 0) ?? 0,
    alertCount: asNumber(raw.alertCount, 0) ?? 0,
  };
}

export function normalizeHistoryRides(raw: unknown): HistoryRide[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeHistoryRide(item as HistoryRideDto))
    .filter((ride): ride is HistoryRide => Boolean(ride));
}

function normalizeAnalysisSide(raw: unknown): AnalysisSide | null {
  if (!raw || typeof raw !== "object") return null;
  const side = raw as Partial<AnalysisSide>;
  return {
    scene: asString(side.scene),
    hazards: Array.isArray(side.hazards) ? side.hazards.map((item) => String(item)) : [],
    confidence: asNumber(side.confidence, 0) ?? 0,
    suppressed: Array.isArray(side.suppressed) ? side.suppressed.map((item) => String(item)) : [],
    observations:
      side.observations && typeof side.observations === "object"
        ? (side.observations as Record<string, unknown>)
        : {},
    at: asNumber(side.at, Date.now()) ?? Date.now(),
  };
}

export function normalizeAnalysis(raw: Partial<AnalysisDto> | null | undefined): RideAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  return {
    deviceId: asString(raw.deviceId),
    updatedAt: asNumber(raw.updatedAt, Date.now()) ?? Date.now(),
    dms: normalizeAnalysisSide(raw.dms),
    cms: normalizeAnalysisSide(raw.cms),
  };
}

export function normalizeLiveFrame(raw: Partial<LiveFrameDto> | null | undefined): LiveFrame | null {
  if (!raw || typeof raw !== "object") return null;
  const channel = raw.channel === "cms" ? "cms" : raw.channel === "dms" ? "dms" : null;
  if (!channel) return null;
  const path = asString(raw.url);
  if (!path) return null;
  const at = asNumber(raw.at, Date.now()) ?? Date.now();
  return {
    rideId: asString(raw.rideId),
    channel,
    at,
    imageUrl: absoluteMediaUrl(path),
  };
}

export function normalizeVideoSession(raw: Partial<VideoSessionDto> | null | undefined): VideoSession | null {
  if (!raw || typeof raw !== "object") return null;
  const url = asString(raw.url);
  const token = asString(raw.token);
  // livekit needs url+token; local/dummy may omit one of them
  if (raw.mode === "livekit" && (!url || !token)) return null;
  if (raw.mode !== "local" && raw.mode !== "dummy" && !url) return null;
  const mode = raw.mode === "dummy" ? "dummy" : raw.mode === "local" ? "local" : "livekit";
  return {
    url,
    mode,
    token,
    room: asString(raw.room),
    tracks: Array.isArray(raw.tracks) ? raw.tracks.map((item) => String(item)) : [],
    expiresAt: asNumber(raw.expiresAt, 0) ?? 0,
    publisherOnline: asBoolean(raw.publisherOnline, false),
    publish: asBoolean(raw.publish, mode !== "dummy"),
    previewUrl: absoluteMediaUrl(asString(raw.preview)),
  };
}

export function normalizeVideoCancel(raw: Partial<{ ok: boolean; publish: boolean; room: string }> | null | undefined) {
  if (!raw || typeof raw !== "object") return null;
  return {
    ok: asBoolean(raw.ok, true),
    publish: asBoolean(raw.publish, false),
    room: asString(raw.room),
  };
}

export function normalizeAlertClip(raw: Partial<AlertClipDto> | null | undefined): AlertClip | null {
  if (!raw || typeof raw !== "object") return null;
  const id = asString(raw.id);
  if (!id) return null;
  const channel: MediaChannel = raw.channel === "cms" ? "cms" : "dms";
  return {
    id,
    rideId: asString(raw.rideId),
    alertId: asString(raw.alertId),
    channel,
    startAt: asNumber(raw.startAt, 0) ?? 0,
    endAt: asNumber(raw.endAt, 0) ?? 0,
    frames: Array.isArray(raw.frames)
      ? raw.frames
          .map((frame) => {
            const at = asNumber(frame?.at, 0) ?? 0;
            const path = asString(frame?.url);
            if (!path) return null;
            return { at, imageUrl: absoluteMediaUrl(path) };
          })
          .filter((frame): frame is { at: number; imageUrl: string } => Boolean(frame))
      : [],
    videoUrl: raw.videoUrl ? absoluteMediaUrl(asString(raw.videoUrl)) : null,
  };
}
