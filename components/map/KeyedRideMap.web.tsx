import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
// react-native-web ships without types in this SDK. The iframe host is web-only.
// @ts-expect-error untyped module
import { unstable_createElement } from "react-native-web";

import { buildGoogleMapHtml } from "@/components/map/googleMapDocument";
import type { RideMapProps } from "@/components/map/types";
import { ScreenState } from "@/components/ui/ScreenState";

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
  const [failed, setFailed] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const latest = useRef({ route, position, heading, trail, follow, deviceFix });
  latest.current = { route, position, heading, trail, follow, deviceFix };
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
      if (message?.type === "auth") setFailed(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onPan, onPressVehicle]);

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

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((current) => (current.width === width && current.height === height ? current : { width, height }));
  };

  return (
    <View style={styles.fill} onLayout={onLayout}>
      {size.height > 0
        ? unstable_createElement("iframe", {
            key: regionKey,
            ref: (node: FrameElement | null) => {
              frameRef.current = node;
            },
            title: "Live map",
            srcDoc: html,
            style: { width: size.width, height: size.height, borderWidth: 0, backgroundColor: "#07080A" },
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
