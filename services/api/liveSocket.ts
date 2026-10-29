import { wsBaseUrl } from "@/services/api/config";
import { normalizeAlert, normalizeRide } from "@/services/api/normalize";
import type { LiveEvent, RideDto } from "@/services/api/types";
import type { SafetyAlert } from "@/types/domain";

export type LiveSocketHandlers = {
  onRide?: (ride: RideDto) => void;
  onAlert?: (alert: SafetyAlert, ride: RideDto, kind: "alert" | "sos", notified?: string[]) => void;
  onOpen?: () => void;
  onClose?: (code: number) => void;
  onError?: (error: Error) => void;
};

export type LiveSocket = {
  close(): void;
  readonly readyState: number;
};

function parseEvent(raw: string): LiveEvent | null {
  try {
    const msg = JSON.parse(raw) as LiveEvent;
    if (!msg || typeof msg !== "object" || !("type" in msg)) return null;
    return msg;
  } catch {
    return null;
  }
}

export function connectLiveSocket(rideId: string, handlers: LiveSocketHandlers): LiveSocket | null {
  const base = wsBaseUrl();
  if (!base || typeof WebSocket === "undefined") return null;

  const url = `${base}/v1/rides/${encodeURIComponent(rideId)}/live`;
  const socket = new WebSocket(url);

  socket.onopen = () => handlers.onOpen?.();
  socket.onerror = () => handlers.onError?.(new Error("Live socket error"));
  socket.onclose = (event) => handlers.onClose?.(event.code);
  socket.onmessage = (event) => {
    const msg = parseEvent(String(event.data));
    if (!msg) return;

    if (msg.type === "telemetry" || msg.type === "status") {
      const ride = normalizeRide(msg.ride);
      if (ride) handlers.onRide?.(ride);
      return;
    }

    if (msg.type === "alert" || msg.type === "sos") {
      const ride = normalizeRide(msg.ride);
      const alert = normalizeAlert(msg.alert);
      if (!ride || !alert) return;
      handlers.onAlert?.(alert, ride, msg.type, msg.type === "sos" ? msg.notified : undefined);
    }
  };

  return {
    close() {
      try {
        socket.close();
      } catch {
        // ignore
      }
    },
    get readyState() {
      return socket.readyState;
    },
  };
}
