import type { Coordinate, DataOrigin } from "@/types/domain";

export type MqttPublish = {
  topic: string;
  payload: Record<string, unknown>;
};

export type MqttGateway = {
  origin: DataOrigin;
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
};

export type CabinFeedService = {
  open(input: { camera: "driver" | "cabin"; fault: boolean }): Promise<CabinSession>;
};

export type ServiceBundle = {
  sos: SosService;
  guardians: GuardianNotifier;
  cabin: CabinFeedService;
};
