import Constants from "expo-constants";

import { riskLine } from "@/services/risk";
import type {
  CabinFeedService,
  DriverMonitorService,
  GpsStream,
  GuardianNotifier,
  MqttGateway,
  ServiceBundle,
  SosService,
  VehicleTelemetryService,
} from "@/services/types";

type Endpoints = {
  telemetryUrl: string;
  mqttUrl: string;
};

export function readEndpoints(): Endpoints {
  const extra = (Constants.expoConfig?.extra ?? {}) as Partial<Endpoints>;
  return {
    telemetryUrl: extra.telemetryUrl?.trim() ?? "",
    mqttUrl: extra.mqttUrl?.trim() ?? "",
  };
}

const simulatedGps: GpsStream = {
  origin: "simulated",
  describe: () => "GPS stream is a scripted Bangalore corridor, not a vehicle receiver.",
};

function createMqtt(endpoints: Endpoints): MqttGateway {
  return {
    origin: "simulated",
    describe: () =>
      endpoints.mqttUrl
        ? "An MQTT URL is configured. This client will not open it or attach credentials."
        : "MQTT publishes stay on this phone. Topic shape matches the ride pipeline.",
    async publish(message) {
      if (endpoints.mqttUrl) {
        return {
          accepted: false,
          note: `Refused ${message.topic}. No broker secret is shipped in the app.`,
        };
      }
      return {
        accepted: true,
        note: `Simulated publish ${message.topic}`,
      };
    },
  };
}

function createSos(mqtt: MqttGateway): SosService {
  return {
    async raise({ rideId, coordinate }) {
      const topic = `ride/${rideId}/sos`;
      const result = await mqtt.publish({
        topic,
        payload: {
          type: "sos",
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
        note: result.accepted
          ? `Simulated notice to ${names.join(", ")}`
          : result.note,
      };
    },
    async shareTrip({ rideId, names }) {
      await mqtt.publish({
        topic: `ride/${rideId}/share`,
        payload: { names },
      });
      return {
        link: `VMS://t/${rideId}`,
        origin: "simulated",
      };
    },
  };
}

const cabin: CabinFeedService = {
  async open({ camera, fault }) {
    if (fault) {
      throw new Error("Cabin gate did not answer. The simulated feed was marked faulty.");
    }
    return {
      id: `cabin-${camera}`,
      camera,
      origin: "simulated",
      note:
        camera === "driver"
          ? "Driver-monitor state is simulated. This phone is not the face camera."
          : "Seat map is simulated. This phone is not the cabin camera.",
    };
  },
};

const driver: DriverMonitorService = {
  describe: (state, assessment) => ({
    line: `${state} · ${riskLine(assessment)}`,
    origin: "simulated",
  }),
};

const telemetry: VehicleTelemetryService = {
  snapshot: (frame) => ({
    ...frame,
    origin: "simulated",
  }),
};

export function createServices(): ServiceBundle {
  const endpoints = readEndpoints();
  const mqtt = createMqtt(endpoints);
  const configured = Boolean(endpoints.mqttUrl || endpoints.telemetryUrl);
  return {
    mode: "simulated",
    note: configured
      ? "Endpoints are set, but this build keeps the ride simulated and does not send credentials."
      : "No vehicle endpoint is configured. Every fix, score, and notice on screen is simulated.",
    gps: simulatedGps,
    mqtt,
    sos: createSos(mqtt),
    guardians: createGuardians(mqtt),
    cabin,
    driver,
    telemetry,
  };
}

export const services = createServices();
