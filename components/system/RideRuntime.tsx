import { useEffect } from "react";
import * as Location from "expo-location";

import { useRideStore } from "@/stores/useRideStore";

export function RideClock() {
  const tick = useRideStore((state) => state.tick);

  useEffect(() => {
    const bootTimer = setTimeout(() => useRideStore.setState({ booting: false }), 900);
    const id = setInterval(() => tick(250), 250);
    return () => {
      clearTimeout(bootTimer);
      clearInterval(id);
    };
  }, [tick]);

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
