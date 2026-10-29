import { createGuardianApi } from "@/services/api/guardianApi";
import { isLiveApiEnabled, readEndpoints } from "@/services/api/config";
import { ApiError } from "@/services/api/http";
import { normalizeAlert } from "@/services/api/normalize";
import type {
  CabinFeedService,
  GuardianNotifier,
  MqttGateway,
  ServiceBundle,
  SosService,
} from "@/services/types";

type Endpoints = ReturnType<typeof readEndpoints>;

function createMqtt(endpoints: Endpoints): MqttGateway {
  return {
    origin: "simulated",
    async publish(message) {
      if (endpoints.mqttUrl || endpoints.telemetryUrl) {
        return { accepted: false, note: "No broker is connected." };
      }
      return { accepted: true, note: message.topic };
    },
  };
}

function createSos(mqtt: MqttGateway, api: ServiceBundle["api"]): SosService {
  return {
    async raise({ rideId, coordinate, passenger }) {
      if (api) {
        const result = await api.raiseSos(rideId, {
          passenger,
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          source: "phone",
        });
        const alert = normalizeAlert(result.alert);
        return {
          id: result.id,
          at: result.at,
          topic: result.topic,
          origin: result.origin,
          note: result.note,
          alertId: alert?.id,
        };
      }

      const topic = `ride/${rideId}/sos`;
      const result = await mqtt.publish({
        topic,
        payload: {
          type: "sos",
          passenger,
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
        },
      });
      return {
        id: `sos-${Date.now()}`,
        at: Date.now(),
        topic,
        origin: "simulated",
        note: result.note,
      };
    },
  };
}

function createGuardians(mqtt: MqttGateway, api: ServiceBundle["api"]): GuardianNotifier {
  return {
    async notify({ names, title }) {
      if (api) {
        return {
          delivered: names.length,
          origin: "device",
          note: names.length ? `Notified ${names.join(", ")}` : "Notified nobody sharing",
        };
      }
      const result = await mqtt.publish({
        topic: "guardian/notify",
        payload: { title, names },
      });
      return {
        delivered: names.length,
        origin: "simulated",
        note: result.accepted ? `Notified ${names.join(", ")}` : result.note,
      };
    },
    async shareTrip({ rideId, names }) {
      if (api) {
        const shared = await api.shareTrip(rideId);
        return { link: shared.link, origin: shared.origin };
      }
      await mqtt.publish({
        topic: `ride/${rideId}/share`,
        payload: { names },
      });
      return {
        link: `vms://trip/${rideId}`,
        origin: "simulated",
      };
    },
  };
}

const cabin: CabinFeedService = {
  async open({ camera, fault }) {
    if (fault) throw new Error("Cabin feed did not open.");
    return {
      id: `cabin-${camera}`,
      camera,
      origin: isLiveApiEnabled() ? "vehicle" : "simulated",
    };
  },
};

export function createServices(): ServiceBundle {
  const endpoints = readEndpoints();
  const live = isLiveApiEnabled();
  const api = live ? createGuardianApi() : null;
  const mqtt = createMqtt(endpoints);
  return {
    sos: createSos(mqtt, api),
    guardians: createGuardians(mqtt, api),
    cabin,
    api,
    live,
  };
}

export const services = createServices();

export function describeServiceError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.unauthorized) return "You are not authorized for this ride.";
    if (error.timedOut) return "The server took too long to respond.";
    if (error.kind === "network") return "Could not reach the guardian API.";
    if (error.kind === "config") return "Set EXPO_PUBLIC_TELEMETRY_URL to connect.";
    return error.detail || error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}
