import { useEffect, useRef } from "react";
import * as Location from "expo-location";

import { connectLiveSocket, type LiveSocket } from "@/services/api/liveSocket";
import { services } from "@/services/createServices";
import { useRideStore } from "@/stores/useRideStore";

export function RideClock() {
  const tick = useRideStore((state) => state.tick);
  const liveMode = useRideStore((state) => state.liveMode);
  const bootstrapLive = useRideStore((state) => state.bootstrapLive);
  const applyRide = useRideStore((state) => state.applyRide);
  const prependAlert = useRideStore((state) => state.prependAlert);
  const patchAnalysis = useRideStore((state) => state.patchAnalysis);
  const setConnection = useRideStore((state) => state.setConnection);
  const rideId = useRideStore((state) => state.rideId);
  const socketRef = useRef<LiveSocket | null>(null);

  useEffect(() => {
    if (liveMode) {
      void bootstrapLive();
      return;
    }
    const bootTimer = setTimeout(() => useRideStore.setState({ booting: false }), 900);
    const id = setInterval(() => tick(250), 250);
    return () => {
      clearTimeout(bootTimer);
      clearInterval(id);
    };
  }, [bootstrapLive, liveMode, tick]);

  useEffect(() => {
    if (!liveMode || !services.api) return;

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const open = () => {
      if (cancelled) return;
      socketRef.current?.close();
      const socket = connectLiveSocket(rideId, {
        onOpen: () => {
          if (!cancelled) setConnection("live", null);
        },
        onRide: (ride) => {
          if (!cancelled) applyRide(ride);
        },
        onAlert: (alert, ride) => {
          if (cancelled) return;
          applyRide(ride);
          prependAlert(alert);
        },
        onAnalysis: (channel, analysis) => {
          if (!cancelled) patchAnalysis(channel, analysis);
        },
        onError: () => {
          if (!cancelled) setConnection("degraded", "Live updates interrupted.");
        },
        onClose: () => {
          if (cancelled) return;
          setConnection("degraded", "Live socket closed. Reconnecting…");
          reconnectTimer = setTimeout(open, 2500);
        },
      });
      socketRef.current = socket;
      if (!socket) {
        setConnection("degraded", "WebSocket is unavailable in this runtime.");
      }
    };

    open();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [applyRide, liveMode, patchAnalysis, prependAlert, rideId, setConnection]);

  return null;
}

export function DeviceLocationBridge() {
  const placeOnPhone = useRideStore((state) => state.placeOnPhone);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let alive = true;

    const publish = (fix: Location.LocationObject) => {
      if (!alive) return;
      placeOnPhone({
        latitude: fix.coords.latitude,
        longitude: fix.coords.longitude,
      });
    };

    void (async () => {
      try {
        let permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) {
          permission = await Location.requestForegroundPermissionsAsync();
        }
        if (!alive || !permission.granted) return;
        useRideStore.getState().setShowDeviceLocation(true);
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        publish(current);
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 8, timeInterval: 3000 },
          publish,
        );
        if (!alive) subscription.remove();
      } catch {
        // Location permission can succeed without a fix.
      }
    })();

    return () => {
      alive = false;
      subscription?.remove();
    };
  }, [placeOnPhone]);

  return null;
}
