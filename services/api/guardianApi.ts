import { apiRequest } from "@/services/api/http";
import {
  normalizeAlert,
  normalizeAlerts,
  normalizeCabin,
  normalizeGuardians,
  normalizeNotices,
  normalizeRide,
} from "@/services/api/normalize";
import type {
  AlertStatusFilter,
  CabinDto,
  CreateGuardianRequest,
  HealthDto,
  RideDto,
  ShareResponse,
  SosRequest,
  SosResponse,
  TelemetryRequest,
} from "@/services/api/types";
import type { Guardian, GuardianNotice, SafetyAlert } from "@/types/domain";

export type GuardianApi = {
  health(): Promise<HealthDto>;
  getRide(rideId: string): Promise<RideDto>;
  listAlerts(rideId: string, status?: AlertStatusFilter): Promise<SafetyAlert[]>;
  acknowledgeAlert(alertId: string): Promise<SafetyAlert>;
  raiseSos(rideId: string, body?: SosRequest): Promise<SosResponse>;
  postTelemetry(rideId: string, body: TelemetryRequest): Promise<RideDto>;
  getCabin(rideId: string): Promise<CabinDto>;
  listGuardians(rideId: string): Promise<Guardian[]>;
  addGuardian(rideId: string, body: CreateGuardianRequest): Promise<{ id: string }>;
  toggleSharing(rideId: string, guardianId: string): Promise<{ id: string; sharing: boolean }>;
  shareTrip(rideId: string): Promise<ShareResponse>;
  listNotices(rideId: string): Promise<GuardianNotice[]>;
  registerPushToken(guardianId: string, token: string, rideId?: string): Promise<{ ok: boolean }>;
};

function requireRide(ride: RideDto | null): RideDto {
  if (!ride) throw new Error("Invalid ride payload from the API.");
  return ride;
}

export function createGuardianApi(): GuardianApi {
  return {
    async health() {
      return apiRequest<HealthDto>("/health");
    },

    async getRide(rideId) {
      const raw = await apiRequest<RideDto>(`/v1/rides/${encodeURIComponent(rideId)}`);
      return requireRide(normalizeRide(raw));
    },

    async listAlerts(rideId, status = "all") {
      const raw = await apiRequest<{ alerts?: unknown }>(
        `/v1/rides/${encodeURIComponent(rideId)}/alerts`,
        { query: { status } },
      );
      return normalizeAlerts(raw?.alerts);
    },

    async acknowledgeAlert(alertId) {
      const raw = await apiRequest(`/v1/alerts/${encodeURIComponent(alertId)}/ack`, {
        method: "POST",
      });
      const alert = normalizeAlert(raw as never);
      if (!alert) throw new Error("Invalid alert payload from the API.");
      return alert;
    },

    async raiseSos(rideId, body = {}) {
      const raw = await apiRequest<SosResponse>(`/v1/rides/${encodeURIComponent(rideId)}/sos`, {
        method: "POST",
        body,
      });
      const alert = normalizeAlert(raw.alert);
      if (!alert) throw new Error("Invalid SOS alert payload from the API.");
      return {
        id: typeof raw.id === "string" ? raw.id : `sos-${Date.now()}`,
        at: typeof raw.at === "number" ? raw.at : Date.now(),
        topic: typeof raw.topic === "string" ? raw.topic : `ride/${rideId}/sos`,
        origin: raw.origin ?? "device",
        note: typeof raw.note === "string" ? raw.note : "",
        alert: {
          id: alert.id,
          tripId: alert.tripId,
          kind: alert.kind,
          severity: alert.severity,
          title: alert.title,
          detail: alert.detail,
          at: alert.at,
          locationLabel: alert.locationLabel,
          coordinate: alert.coordinate,
          acknowledged: alert.acknowledged,
          evidenceId: alert.evidenceId ?? null,
          origin: alert.origin,
        },
      };
    },

    async postTelemetry(rideId, body) {
      const raw = await apiRequest<RideDto>(`/v1/rides/${encodeURIComponent(rideId)}/telemetry`, {
        method: "POST",
        body,
      });
      return requireRide(normalizeRide(raw));
    },

    async getCabin(rideId) {
      const raw = await apiRequest<CabinDto>(`/v1/rides/${encodeURIComponent(rideId)}/cabin`);
      const cabin = normalizeCabin(raw);
      if (!cabin) throw new Error("Invalid cabin payload from the API.");
      return cabin;
    },

    async listGuardians(rideId) {
      const raw = await apiRequest<{ guardians?: unknown }>(
        `/v1/rides/${encodeURIComponent(rideId)}/guardians`,
      );
      return normalizeGuardians(raw?.guardians);
    },

    async addGuardian(rideId, body) {
      return apiRequest<{ id: string }>(`/v1/rides/${encodeURIComponent(rideId)}/guardians`, {
        method: "POST",
        body,
      });
    },

    async toggleSharing(rideId, guardianId) {
      return apiRequest<{ id: string; sharing: boolean }>(
        `/v1/rides/${encodeURIComponent(rideId)}/guardians/${encodeURIComponent(guardianId)}/sharing`,
        { method: "POST" },
      );
    },

    async shareTrip(rideId) {
      return apiRequest<ShareResponse>(`/v1/rides/${encodeURIComponent(rideId)}/share`, {
        method: "POST",
      });
    },

    async listNotices(rideId) {
      const raw = await apiRequest<{ notices?: unknown }>(
        `/v1/rides/${encodeURIComponent(rideId)}/notices`,
      );
      return normalizeNotices(raw?.notices);
    },

    async registerPushToken(guardianId, token, rideId) {
      return apiRequest<{ ok: boolean }>(
        `/v1/devices/${encodeURIComponent(guardianId)}/push-token`,
        {
          method: "POST",
          body: {
            token,
            ...(rideId ? { ride_id: rideId } : {}),
          },
        },
      );
    },
  };
}
