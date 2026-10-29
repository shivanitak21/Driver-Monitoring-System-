import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
// @ts-expect-error react-native-web has no types in this SDK
import { unstable_createElement } from "react-native-web";

import { buildGoogleMapHtml } from "@/components/map/googleMapDocument";
import { buildTileMapHtml } from "@/components/map/tileMapDocument";
import type { RideMapProps } from "@/components/map/types";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useTheme } from "@/providers/ThemeProvider";

type Props = RideMapProps & { apiKey: string };
type FrameElement = HTMLIFrameElement;

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
  const frameRef = useRef<FrameElement | null>(null);
  const [source, setSource] = useState<"google" | "tiles">("google");
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { scheme, colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const latest = useRef({ route, position, heading, trail, follow, deviceFix });
  latest.current = { route, position, heading, trail, follow, deviceFix };
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

  const push = useCallback(() => {
    frameRef.current?.contentWindow?.postMessage({ type: "ride", payload: latest.current }, "*");
  }, []);

  useEffect(() => {
    push();
  }, [route, position, heading, trail, follow, deviceFix, push]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      const message = event.data as { type?: string };
      if (message?.type === "pan") onPan();
      if (message?.type === "vehicle") onPressVehicle();
      if (message?.type === "auth") setSource("tiles");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onPan, onPressVehicle]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((current) => (current.width === width && current.height === height ? current : { width, height }));
  };

  return (
    <View style={[styles.fill, { backgroundColor: colors.mapBg }]} onLayout={onLayout}>
      {size.height > 0
        ? unstable_createElement("iframe", {
            key: `${regionKey}-${source}`,
            ref: (node: FrameElement | null) => {
              frameRef.current = node;
            },
            title: "Live map",
            srcDoc: html,
            style: { width: size.width, height: size.height, borderWidth: 0, backgroundColor: colors.mapBg },
            onLoad: push,
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: "#07080A",
  },
});
