import Constants from "expo-constants";

import { DEVICE_ID, LIVE_TRIP_ID } from "@/data/fleet";

export type ApiEndpoints = {
  telemetryUrl: string;
  mqttUrl: string;
  defaultRideId: string;
  defaultDeviceId: string;
};

const DEMO_TELEMETRY_URL = "http://51.81.81.118:8000";

export function readEndpoints(): ApiEndpoints {
  const extra = (Constants.expoConfig?.extra ?? {}) as Partial<ApiEndpoints>;
  return {
    telemetryUrl: (extra.telemetryUrl || DEMO_TELEMETRY_URL).trim().replace(/\/$/, ""),
    mqttUrl: (extra.mqttUrl ?? "").trim().replace(/\/$/, ""),
    defaultRideId: (extra.defaultRideId || LIVE_TRIP_ID).trim() || LIVE_TRIP_ID,
    defaultDeviceId: (extra.defaultDeviceId || DEVICE_ID).trim() || DEVICE_ID,
  };
}

/** Live guardian API is used whenever a telemetry base URL is available. */
export function isLiveApiEnabled(): boolean {
  return Boolean(readEndpoints().telemetryUrl);
}

export function apiBaseUrl(): string {
  return readEndpoints().telemetryUrl;
}

export function wsBaseUrl(): string {
  const http = apiBaseUrl();
  if (!http) return "";
  return http.replace(/^http/i, "ws");
}

export function defaultRideId(): string {
  return readEndpoints().defaultRideId;
}

export function defaultDeviceId(): string {
  return readEndpoints().defaultDeviceId;
}

export const REQUEST_TIMEOUT_MS = 15_000;
