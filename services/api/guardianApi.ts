import { apiRequest } from "@/services/api/http";
import {
  normalizeAlert,
  normalizeAlertClip,
  normalizeAlerts,
  normalizeAnalysis,
  normalizeCabin,
  normalizeGuardians,
  normalizeHistoryRides,
  normalizeLiveFrame,
  normalizeNotices,
  normalizeRide,
  normalizeVideoCancel,
  normalizeVideoSession,
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
  VideoCancelDto,
} from "@/services/api/types";
import type {
  AlertClip,
  Guardian,
  GuardianNotice,
  HistoryRide,
  LiveFrame,
  MediaChannel,
  RideAnalysis,
  SafetyAlert,
  VideoCancelResult,
  VideoSession,
} from "@/types/domain";

export type GuardianApi = {
  health(): Promise<HealthDto>;
  getRide(rideId: string, startedAt?: number | null): Promise<RideDto>;
  listHistory(deviceId?: string): Promise<HistoryRide[]>;
  listAlerts(rideId: string, status?: AlertStatusFilter, channel?: MediaChannel): Promise<SafetyAlert[]>;
  acknowledgeAlert(alertId: string): Promise<SafetyAlert>;
  raiseSos(rideId: string, body?: SosRequest): Promise<SosResponse>;
  postTelemetry(rideId: string, body: TelemetryRequest): Promise<RideDto>;
  getCabin(rideId: string): Promise<CabinDto>;
  getAnalysis(rideId: string, channel?: MediaChannel): Promise<RideAnalysis>;
  getLiveFrame(rideId: string, channel: MediaChannel): Promise<LiveFrame>;
  /** Starts Watch publish on the car. Do not call on every screen refresh. */
  getVideo(rideId: string, track?: "all" | "driver" | "cabin"): Promise<VideoSession>;
  /** Stops Watch publish. Live stills keep updating. */
  cancelVideo(rideId: string): Promise<VideoCancelResult>;
  getClip(rideId: string, clipId: string): Promise<AlertClip>;
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

    async getRide(rideId, startedAt) {
      const raw = await apiRequest<RideDto>(`/v1/rides/${encodeURIComponent(rideId)}`, {
        query:
          startedAt != null && Number.isFinite(startedAt)
            ? { startedAt: Math.trunc(startedAt) }
            : undefined,
      });
      return requireRide(normalizeRide(raw));
    },

    async listHistory(deviceId) {
      const raw = await apiRequest<{ rides?: unknown }>("/v1/history", {
        query: deviceId ? { deviceId } : undefined,
      });
      return normalizeHistoryRides(raw?.rides);
    },

    async listAlerts(rideId, status = "all", channel) {
      const raw = await apiRequest<{ alerts?: unknown }>(
        `/v1/rides/${encodeURIComponent(rideId)}/alerts`,
        { query: { status, channel } },
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
          orinType: alert.orinType,
          channel: alert.channel,
          confidence: alert.confidence,
          clipId: alert.clipId,
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

    async getAnalysis(rideId, channel) {
      const raw = await apiRequest(`/v1/rides/${encodeURIComponent(rideId)}/analysis`, {
        query: channel ? { channel } : undefined,
      });
      const analysis = normalizeAnalysis(raw as never);
      if (!analysis) throw new Error("Invalid analysis payload from the API.");
      return analysis;
    },

    async getLiveFrame(rideId, channel) {
      const raw = await apiRequest(`/v1/rides/${encodeURIComponent(rideId)}/frames/live`, {
        query: { channel },
      });
      const frame = normalizeLiveFrame(raw as never);
      if (!frame) throw new Error("Invalid live frame payload from the API.");
      return frame;
    },

    async getVideo(rideId, track = "all") {
      const raw = await apiRequest(`/v1/rides/${encodeURIComponent(rideId)}/video`, {
        query: { track },
      });
      const session = normalizeVideoSession(raw as never);
      if (!session) throw new Error("Invalid video session payload from the API.");
      return session;
    },

    async cancelVideo(rideId) {
      const raw = await apiRequest<VideoCancelDto>(
        `/v1/rides/${encodeURIComponent(rideId)}/video/cancel`,
        { method: "POST" },
      );
      const result = normalizeVideoCancel(raw);
      if (!result) throw new Error("Invalid video cancel payload from the API.");
      return result;
    },

    async getClip(rideId, clipId) {
      const raw = await apiRequest(
        `/v1/rides/${encodeURIComponent(rideId)}/clips/${encodeURIComponent(clipId)}`,
      );
      const clip = normalizeAlertClip(raw as never);
      if (!clip) throw new Error("Invalid clip payload from the API.");
      return clip;
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
