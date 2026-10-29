import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { buildGoogleMapHtml } from "@/components/map/googleMapDocument";
import { buildTileMapHtml } from "@/components/map/tileMapDocument";
import type { RideMapProps } from "@/components/map/types";
import { ScreenState } from "@/components/ui/ScreenState";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useTheme } from "@/providers/ThemeProvider";

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
  const [source, setSource] = useState<"google" | "tiles">("google");
  const [broken, setBroken] = useState(false);
  const { scheme, colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const regionKey = `${position.latitude.toFixed(1)},${position.longitude.toFixed(1)}-${scheme}`;
  const mapOrigin = origin ?? position;
  const mapDestination = destination ?? position;
  const html = useMemo(
    () =>
      source === "tiles"
        ? buildTileMapHtml({
            route,
            origin: mapOrigin,
            destination: mapDestination,
            position,
            heading,
            trail,
            deviceFix,
            follow,
            scheme,
            reduceMotion,
          })
        : buildGoogleMapHtml({
            apiKey,
            route,
            origin: mapOrigin,
            destination: mapDestination,
            position,
            heading,
            trail,
            deviceFix,
            follow,
            scheme,
            reduceMotion,
          }),
    [source, apiKey, regionKey, scheme, reduceMotion],
  );

  const latest = useRef({ route, position, heading, trail, follow, deviceFix });
  latest.current = { route, position, heading, trail, follow, deviceFix };

  const push = useCallback(() => {
    const payload = JSON.stringify(latest.current);
    webRef.current?.injectJavaScript(`window.updateRide && window.updateRide(${payload}); true;`);
  }, []);

  useEffect(() => {
    push();
  }, [route, position, heading, trail, follow, deviceFix, push]);

  if (broken) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.mapBg }]}>
        <ScreenState kind="error" title="The map did not open" body="The street map could not be loaded. Check the connection, then reload VMS." />
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: colors.mapBg }]}>
      <WebView
        key={`${regionKey}-${source}`}
        containerStyle={{ backgroundColor: colors.mapBg }}
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
        onError={() => {
          if (source === "google") setSource("tiles");
          else setBroken(true);
        }}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data) as { type?: string };
            if (message.type === "pan") onPan();
            if (message.type === "vehicle") onPressVehicle();
            if (message.type === "auth") setSource("tiles");
          } catch {
            // Page noise, not a map event.
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
