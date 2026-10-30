import type {
  AlertKind,
  AnalysisSide,
  Coordinate,
  DataOrigin,
  DriverState,
  MediaChannel,
  RideAnalysis,
  SafetyStatus,
  Seat,
  Severity,
} from "@/types/domain";

export type AlertStatusFilter = "all" | "open" | "emergency" | "caution";

export type RideDto = {
  id: string;
  deviceId: string;
  passenger: string;
  safetyStatus: SafetyStatus;
  driverState: DriverState;
  deviceState: string;
  etaMin: number | null;
  speedKmh: number | null;
  heading: number | null;
  score: number;
  shareLink: string;
  position: { latitude: number | null; longitude: number | null } | null;
  seats: Seat[];
  updatedAt: string;
  publisherOnline: boolean;
  status: "active" | "ended";
  startedAt: number | null;
  endedAt: number | null;
};

export type AlertDto = {
  id: string;
  tripId: string;
  kind: AlertKind;
  severity: Severity;
  title: string;
  detail: string;
  at: number;
  locationLabel: string;
  coordinate: { latitude: number | null; longitude: number | null } | null;
  acknowledged: boolean;
  evidenceId: string | null;
  origin: DataOrigin;
  orinType?: string | null;
  channel?: MediaChannel | null;
  confidence?: number | null;
  clipId?: string | null;
};

export type GuardianDto = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  sharing: boolean;
  lastNotifiedAt: number | null;
};

export type NoticeDto = {
  id: string;
  at: number;
  title: string;
  body: string;
  guardianNames: string[];
  origin: DataOrigin;
};

export type CabinDto = {
  driverState: DriverState;
  seats: Seat[];
  safetyStatus: SafetyStatus;
};

export type HealthDto = {
  ok: boolean;
  mqtt: { host: string; connected: boolean; error: string };
  ride: string;
  livekit?: { url: string; configured: boolean; mode: string };
};

export type HistoryRideDto = {
  id: string;
  deviceId: string;
  passenger: string;
  status: "active" | "ended";
  startedAt: number | null;
  endedAt: number | null;
  safetyStatus: SafetyStatus;
  score: number;
  alertCount: number;
};

export type AnalysisDto = RideAnalysis;

export type LiveFrameDto = {
  rideId: string;
  channel: MediaChannel;
  at: number;
  url: string;
};

export type VideoSessionDto = {
  url: string;
  mode: "livekit" | "dummy";
  token: string;
  room: string;
  tracks: string[];
  expiresAt: number;
  publisherOnline: boolean;
  preview: string;
};

export type AlertClipDto = {
  id: string;
  rideId: string;
  alertId: string;
  channel: MediaChannel;
  startAt: number;
  endAt: number;
  frames: { at: number; url: string }[];
  videoUrl: string | null;
};

export type SosRequest = {
  passenger?: string;
  latitude?: number | null;
  longitude?: number | null;
  source?: string;
};

export type SosResponse = {
  id: string;
  at: number;
  topic: string;
  origin: DataOrigin;
  note: string;
  alert: AlertDto;
};

export type TelemetryRequest = {
  latitude: number;
  longitude: number;
  heading?: number;
  speedKmh?: number;
  etaMin?: number;
};

export type CreateGuardianRequest = {
  name: string;
  relationship?: string;
  phone?: string;
  sharing?: boolean;
};

export type ShareResponse = {
  link: string;
  origin: DataOrigin;
};

export type LiveTelemetryEvent = { type: "telemetry"; ride: RideDto };
export type LiveStatusEvent = { type: "status"; ride: RideDto };
export type LiveAlertEvent = { type: "alert"; alert: AlertDto; ride: RideDto };
export type LiveSosEvent = {
  type: "sos";
  alert: AlertDto;
  ride: RideDto;
  notified?: string[];
};
export type LiveAnalysisEvent = {
  type: "analysis";
  channel: MediaChannel;
  analysis: AnalysisSide;
};

export type LiveEvent =
  | LiveTelemetryEvent
  | LiveStatusEvent
  | LiveAlertEvent
  | LiveSosEvent
  | LiveAnalysisEvent;

export type NullableCoordinate = Coordinate | null;
