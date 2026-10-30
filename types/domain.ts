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

export type MediaChannel = "dms" | "cms";

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
  channel?: MediaChannel;
  orinType?: string;
  confidence?: number | null;
  clipId?: string | null;
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

/** Ride row from GET /v1/history */
export type HistoryRide = {
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

export type AnalysisSide = {
  scene: string;
  hazards: string[];
  confidence: number;
  suppressed: string[];
  observations: Record<string, unknown>;
  at: number;
};

export type RideAnalysis = {
  deviceId: string;
  updatedAt: number;
  dms: AnalysisSide | null;
  cms: AnalysisSide | null;
};

export type LiveFrame = {
  rideId: string;
  channel: MediaChannel;
  at: number;
  /** Absolute URL for Image source */
  imageUrl: string;
};

export type VideoMode = "livekit" | "local" | "dummy";

export type VideoSession = {
  url: string;
  mode: VideoMode;
  token: string;
  room: string;
  tracks: string[];
  expiresAt: number;
  publisherOnline: boolean;
  /** True after GET /video; car keeps sending until POST /video/cancel. */
  publish: boolean;
  previewUrl: string;
};

export type VideoCancelResult = {
  ok: boolean;
  publish: boolean;
  room: string;
};

export type AlertClip = {
  id: string;
  rideId: string;
  alertId: string;
  channel: MediaChannel;
  startAt: number;
  endAt: number;
  frames: { at: number; imageUrl: string }[];
  videoUrl: string | null;
};
