import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { buildGoogleMapHtml } from "@/components/map/googleMapDocument";
import type { RideMapProps } from "@/components/map/types";
import { ScreenState } from "@/components/ui/ScreenState";

type Props = RideMapProps & { apiKey: string };

export function KeyedRideMap({
  apiKey,
  route,
  trail,
  position,
  heading,
  destination,
  origin,
  follow,
  deviceFix,
  onPan,
  onPressVehicle,
}: Props) {
  const webRef = useRef<WebView>(null);
  const [failed, setFailed] = useState(false);
  const regionKey = `${position.latitude.toFixed(1)},${position.longitude.toFixed(1)}`;
  const html = useMemo(
    () =>
      buildGoogleMapHtml({
        apiKey,
        route,
        origin,
        destination,
        position,
        heading,
        trail,
        deviceFix,
        follow,
      }),
    [apiKey, regionKey],
  );

  const latest = useRef({ route, position, heading, trail, follow, deviceFix });
  latest.current = { route, position, heading, trail, follow, deviceFix };

  const push = useCallback(() => {
    const payload = JSON.stringify(latest.current);
    webRef.current?.injectJavaScript(`window.updateRide && window.updateRide(${JSON.stringify(payload)}); true;`);
  }, []);

  useEffect(() => {
    push();
  }, [route, position, heading, trail, follow, deviceFix, push]);

  if (failed) {
    return (
      <View style={styles.fill}>
        <ScreenState
          kind="error"
          title="The map did not open"
          body="Google rejected this Maps key. Enable the Maps JavaScript API for it, then reload VMS."
        />
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <WebView
        key={regionKey}
        ref={webRef}
        testID="ride-map"
        style={styles.fill}
        originWhitelist={["*"]}
        source={{ html, baseUrl: "https://localhost" }}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        setSupportMultipleWindows={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        androidLayerType="hardware"
        onLoadEnd={push}
        onError={() => setFailed(true)}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data) as { type?: string };
            if (message.type === "pan") onPan();
            if (message.type === "vehicle") onPressVehicle();
            if (message.type === "auth") setFailed(true);
          } catch {
            // Ignore non-map messages from the page.
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: "#07080A",
  },
});
