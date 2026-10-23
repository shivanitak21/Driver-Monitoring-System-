import Constants from "expo-constants";

import type {
  CabinFeedService,
  GuardianNotifier,
  MqttGateway,
  ServiceBundle,
  SosService,
} from "@/services/types";

type Endpoints = {
  telemetryUrl: string;
  mqttUrl: string;
};

function readEndpoints(): Endpoints {
  const extra = (Constants.expoConfig?.extra ?? {}) as Partial<Endpoints>;
  return {
    telemetryUrl: extra.telemetryUrl?.trim() ?? "",
    mqttUrl: extra.mqttUrl?.trim() ?? "",
  };
}

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

function createSos(mqtt: MqttGateway): SosService {
  return {
    async raise({ rideId, coordinate, passenger }) {
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

function createGuardians(mqtt: MqttGateway): GuardianNotifier {
  return {
    async notify({ names, title }) {
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
      origin: "simulated",
    };
  },
};

export function createServices(): ServiceBundle {
  const mqtt = createMqtt(readEndpoints());
  return {
    sos: createSos(mqtt),
    guardians: createGuardians(mqtt),
    cabin,
  };
}

export const services = createServices();
