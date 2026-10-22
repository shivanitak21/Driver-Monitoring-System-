import type { Coordinate, DataOrigin, SafetyAlert } from "@/types/domain";
import type { RiskAssessment } from "@/services/risk";

export type GpsFix = {
  coordinate: Coordinate;
  heading: number;
  speedKmh: number;
  at: number;
  origin: DataOrigin;
};

export type GpsStream = {
  origin: DataOrigin;
  describe(): string;
};

export type MqttPublish = {
  topic: string;
  payload: Record<string, unknown>;
};

export type MqttGateway = {
  origin: DataOrigin;
  describe(): string;
  publish(message: MqttPublish): Promise<{ accepted: boolean; note: string }>;
};

export type SosReceipt = {
  id: string;
  at: number;
  topic: string;
  origin: DataOrigin;
  note: string;
};

export type SosService = {
  raise(input: { rideId: string; coordinate: Coordinate; passenger: string }): Promise<SosReceipt>;
};

export type GuardianNotifier = {
  notify(input: {
    names: string[];
    title: string;
    body: string;
  }): Promise<{ delivered: number; origin: DataOrigin; note: string }>;
  shareTrip(input: { rideId: string; names: string[] }): Promise<{ link: string; origin: DataOrigin }>;
};

export type CabinSession = {
  id: string;
  camera: "driver" | "cabin";
  origin: DataOrigin;
  note: string;
};

export type CabinFeedService = {
  open(input: { camera: "driver" | "cabin"; fault: boolean }): Promise<CabinSession>;
};

export type DriverMonitorService = {
  describe(state: string, assessment: RiskAssessment): { line: string; origin: DataOrigin };
};

export type TelemetryFrame = {
  origin: DataOrigin;
  speedKmh: number;
  heading: number;
  coordinate: Coordinate;
  risk: RiskAssessment;
  lvglLine: string;
  occupiedSeats: number;
  seatCapacity: number;
  etaMinutes: number;
  tripStatus: string;
};

export type VehicleTelemetryService = {
  snapshot(frame: Omit<TelemetryFrame, "origin" | "lvglLine"> & { lvglLine: string }): TelemetryFrame;
};

export type ServiceBundle = {
  mode: DataOrigin;
  note: string;
  gps: GpsStream;
  mqtt: MqttGateway;
  sos: SosService;
  guardians: GuardianNotifier;
  cabin: CabinFeedService;
  driver: DriverMonitorService;
  telemetry: VehicleTelemetryService;
};

export type TraceInput = {
  service: "gps" | "mqtt" | "sos" | "guardian" | "cabin" | "dms" | "lvgl";
  message: string;
  origin: DataOrigin;
};

export type AlertDraft = Omit<SafetyAlert, "id" | "at" | "acknowledged"> & {
  id?: string;
  at?: number;
  acknowledged?: boolean;
};
