import { useEffect, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

import { CarGlyph } from "@/components/map/CarGlyph";
import { KeyedRideMap } from "@/components/map/KeyedRideMap";
import type { RideMapProps } from "@/components/map/types";
import { googleMapsApiKey } from "@/constants/maps";
import { darkMapStyle } from "@/constants/mapStyle";
import { mapSeed } from "@/data/route";
import { theme } from "@/constants/theme";

export function RideMap(props: RideMapProps) {
  const apiKey = googleMapsApiKey();
  if (apiKey) return <KeyedRideMap {...props} apiKey={apiKey} />;
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

  useEffect(() => {
    if (!follow) return;
    const jumped =
      Math.abs(position.latitude - lastPoint.current.latitude) > 0.02 ||
      Math.abs(position.longitude - lastPoint.current.longitude) > 0.02;
    const now = Date.now();
    if (!jumped && now - lastMove.current < 1500) return;
    lastMove.current = now;
    lastPoint.current = position;
    mapRef.current?.animateToRegion(
      {
        ...position,
        latitudeDelta: jumped ? 0.04 : 0.028,
        longitudeDelta: jumped ? 0.04 : 0.028,
      },
      700,
    );
  }, [follow, position]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
      initialRegion={mapSeed}
      customMapStyle={Platform.OS === "android" ? darkMapStyle : undefined}
      userInterfaceStyle="dark"
      mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"}
      showsCompass={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      moveOnMarkerPress={false}
      onPanDrag={onPan}
    >
      <Polyline coordinates={route} strokeColor="rgba(243,240,232,0.35)" strokeWidth={3} />
      {trail.length > 1 ? (
        <Polyline coordinates={trail} strokeColor={theme.lime} strokeWidth={4} />
      ) : null}
      <Marker coordinate={origin} anchor={{ x: 0.5, y: 0.5 }}>
        <View style={styles.origin} />
      </Marker>
      <Marker coordinate={destination} anchor={{ x: 0.5, y: 0.5 }}>
        <View style={styles.destination} />
      </Marker>
      {deviceFix ? (
        <Marker coordinate={deviceFix} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.device} />
        </Marker>
      ) : null}
      <Marker
        coordinate={position}
        anchor={{ x: 0.5, y: 0.5 }}
        rotation={heading}
        flat
        tracksViewChanges={false}
        onPress={onPressVehicle}
      >
        <View style={styles.carHit} testID="vehicle-marker">
          <CarGlyph />
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
    backgroundColor: theme.inkFaint,
    borderWidth: 2,
    borderColor: theme.bg,
  },
  destination: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.cyan,
    borderWidth: 2,
    borderColor: theme.bg,
  },
  device: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#7EB6FF",
    borderWidth: 2,
    borderColor: "#F3F0E8",
  },
  carHit: {
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
  },
});
