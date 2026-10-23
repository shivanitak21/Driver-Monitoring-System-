export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type DataOrigin = "simulated" | "device" | "vehicle";

export type SafetyStatus = "safe" | "caution" | "emergency";

export type AlertKind =
  | "harsh_braking"
  | "route_deviation"
  | "suspicious_activity"
  | "drowsiness"
  | "distraction"
  | "seat_occupancy"
  | "sos";

export type Severity = "info" | "low" | "medium" | "high" | "critical";

export type DriverState = "attentive" | "drowsy" | "distracted" | "unavailable";

export type SafetyAlert = {
  id: string;
  tripId: string;
  kind: AlertKind;
  severity: Severity;
  title: string;
  detail: string;
  at: number;
  locationLabel: string;
  coordinate: Coordinate;
  acknowledged: boolean;
  evidenceId?: string;
  origin: DataOrigin;
};

export type Guardian = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  sharing: boolean;
  lastNotifiedAt: number | null;
};

export type GuardianNotice = {
  id: string;
  at: number;
  title: string;
  body: string;
  guardianNames: string[];
  origin: DataOrigin;
};

export type PastTrip = {
  id: string;
  originLabel: string;
  destinationLabel: string;
  startedAt: number;
  endedAt: number;
  status: "completed" | "interrupted";
  distanceKm: number;
  safetyStatus: SafetyStatus;
  route: Coordinate[];
  position: Coordinate;
  heading: number;
};

export type Seat = {
  id: string;
  label: string;
  occupied: boolean;
};

export type CallMode = "audio" | "video";

export type CallPhase = "requesting" | "denied" | "ringing" | "live" | "ended" | "failed";

export type CallSession = {
  mode: CallMode;
  phase: CallPhase;
  startedAt: number | null;
  muted: boolean;
  hardware: boolean;
};

export type RiskSeverity = "none" | "low" | "medium" | "high" | "critical";
