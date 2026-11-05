import { useEffect, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import { CarGlyph } from "@/components/map/CarGlyph";
import { KeyedRideMap } from "@/components/map/KeyedRideMap";
import type { RideMapProps } from "@/components/map/types";
import { useSmoothPose } from "@/components/map/useSmoothPose";
import { mapboxAccessToken } from "@/constants/maps";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useTheme } from "@/providers/ThemeProvider";

export function RideMap(props: RideMapProps) {
  const token = mapboxAccessToken();
  // Android (and any build with a Mapbox token) uses the WebView Mapbox / tile map.
  // iOS without a token keeps the native Apple Maps path.
  if (token || Platform.OS === "android") return <KeyedRideMap {...props} apiKey={token} />;
  return <NativeRideMap {...props} />;
}

function NativeRideMap({
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
}: RideMapProps) {
  const mapRef = useRef<MapView>(null);
  const lastMove = useRef(0);
  const lastPoint = useRef(position);
  const { colors, scheme } = useTheme();
  const reduceMotion = useReduceMotion();
  const pose = useSmoothPose(position, heading, reduceMotion);

  useEffect(() => {
    if (!follow) return;
    const jumped =
      Math.abs(position.latitude - lastPoint.current.latitude) > 0.02 ||
      Math.abs(position.longitude - lastPoint.current.longitude) > 0.02;
    const now = Date.now();
    if (!jumped && now - lastMove.current < 1500) return;
    lastMove.current = now;
    lastPoint.current = position;
    const latitudeDelta = jumped ? 0.04 : 0.028;
    const longitudeDelta = jumped ? 0.04 : 0.028;
    mapRef.current?.animateToRegion(
      {
        latitude: position.latitude - latitudeDelta * 0.22,
        longitude: position.longitude,
        latitudeDelta,
        longitudeDelta,
      },
      reduceMotion ? 0 : 700,
    );
  }, [follow, position, reduceMotion]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={{
        latitude: position.latitude,
        longitude: position.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }}
      userInterfaceStyle={scheme}
      mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"}
      showsCompass={false}
      showsUserLocation={false}
      followsUserLocation={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      moveOnMarkerPress={false}
      onPanDrag={onPan}
    >
      {route.length > 1 ? (
        <Polyline
          coordinates={route}
          strokeColor={scheme === "light" ? "rgba(23,25,29,0.28)" : "rgba(245,246,247,0.38)"}
          strokeWidth={3}
        />
      ) : null}
      {trail.length > 1 ? (
        <Polyline
          coordinates={trail}
          strokeColor={scheme === "light" ? "#1C1C1E" : "#F5F5F7"}
          strokeWidth={4}
        />
      ) : null}
      {origin ? (
        <Marker coordinate={origin} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.origin, { backgroundColor: colors.inkFaint, borderColor: colors.bg }]} />
        </Marker>
      ) : null}
      {destination ? (
        <Marker coordinate={destination} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.destination, { backgroundColor: colors.ink, borderColor: colors.bg }]} />
        </Marker>
      ) : null}
      {deviceFix ? (
        <Marker coordinate={deviceFix} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.device, { borderColor: colors.bgRaised }]} />
        </Marker>
      ) : null}
      <Marker
        coordinate={{ latitude: pose.latitude, longitude: pose.longitude }}
        anchor={{ x: 0.5, y: 0.5 }}
        rotation={pose.heading}
        flat
        tracksViewChanges={false}
        onPress={onPressVehicle}
      >
        <View style={styles.carHit} testID="vehicle-marker" accessibilityLabel="Vehicle">
          <CarGlyph width={52} height={52} />
        </View>
      </Marker>
    </MapView>
  );
}

const styles = StyleSheet.create({
  origin: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  destination: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  device: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#7EB6FF",
    borderWidth: 2,
  },
  carHit: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
});
