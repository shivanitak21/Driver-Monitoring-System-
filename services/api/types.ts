import type {
  AlertKind,
  Coordinate,
  DataOrigin,
  DriverState,
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

export type LiveTelemetryEvent = {
  type: "telemetry";
  ride: RideDto;
};

export type LiveStatusEvent = {
  type: "status";
  ride: RideDto;
};

export type LiveAlertEvent = {
  type: "alert";
  alert: AlertDto;
  ride: RideDto;
};

export type LiveSosEvent = {
  type: "sos";
  alert: AlertDto;
  ride: RideDto;
  notified?: string[];
};

export type LiveEvent = LiveTelemetryEvent | LiveStatusEvent | LiveAlertEvent | LiveSosEvent;

export type NullableCoordinate = Coordinate | null;
