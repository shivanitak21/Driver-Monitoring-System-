import { useMemo } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";

import { CarGlyph } from "@/components/map/CarGlyph";
import { KeyedRideMap } from "@/components/map/KeyedRideMap";
import type { RideMapProps } from "@/components/map/types";
import { AppText } from "@/components/ui/AppText";
import { googleMapsApiKey } from "@/constants/maps";
import { theme } from "@/constants/theme";
import type { Coordinate } from "@/types/domain";

function boundsOf(points: Coordinate[]) {
  const lats = points.map((point) => point.latitude);
  const lngs = points.map((point) => point.longitude);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

export function RideMap(props: RideMapProps) {
  const apiKey = googleMapsApiKey();
  if (apiKey) return <KeyedRideMap {...props} apiKey={apiKey} />;
  return <PreviewMap {...props} />;
}

function PreviewMap({ route, trail, position, heading, destination, deviceFix, onPressVehicle }: RideMapProps) {
  const { width, height } = useWindowDimensions();
  const bounds = useMemo(() => boundsOf(route), [route]);

  const project = (point: Coordinate) => {
    const padX = 48;
    const padTop = 120;
    const padBottom = 280;
    const spanLng = Math.max(bounds.maxLng - bounds.minLng, 0.0001);
    const spanLat = Math.max(bounds.maxLat - bounds.minLat, 0.0001);
    return {
      x: padX + ((point.longitude - bounds.minLng) / spanLng) * (width - padX * 2),
      y: padTop + ((bounds.maxLat - point.latitude) / spanLat) * (height - padTop - padBottom),
    };
  };

  const routePoints = route.map(project).map((point) => `${point.x},${point.y}`).join(" ");
  const trailPoints = trail.map(project).map((point) => `${point.x},${point.y}`).join(" ");
  const car = project(position);
  const dest = project(destination);
  const phone = deviceFix ? project(deviceFix) : null;

  return (
    <View style={styles.fill}>
      <Svg width={width} height={height}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Line
            key={`v-${index}`}
            x1={(width / 8) * index}
            y1={0}
            x2={(width / 8) * index}
            y2={height}
            stroke="rgba(243,240,232,0.05)"
          />
        ))}
        {Array.from({ length: 12 }).map((_, index) => (
          <Line
            key={`h-${index}`}
            x1={0}
            y1={(height / 12) * index}
            x2={width}
            y2={(height / 12) * index}
            stroke="rgba(243,240,232,0.04)"
          />
        ))}
        <Polyline points={routePoints} fill="none" stroke="rgba(243,240,232,0.38)" strokeWidth={3} />
        {trail.length > 1 ? (
          <Polyline points={trailPoints} fill="none" stroke={theme.lime} strokeWidth={4} />
        ) : null}
        <Circle cx={dest.x} cy={dest.y} r={6} fill={theme.cyan} />
        {phone ? <Circle cx={phone.x} cy={phone.y} r={5} fill="#7EB6FF" /> : null}
      </Svg>
      <Pressable
        testID="vehicle-marker"
        accessibilityLabel="Open vehicle details"
        onPress={onPressVehicle}
        style={[
          styles.car,
          {
            left: car.x - 42,
            top: car.y - 42,
            transform: [{ rotate: `${heading}deg` }],
          },
        ]}
      >
        <CarGlyph />
      </Pressable>
      <View style={styles.caption}>
        <AppText variant="caption">Route preview on web. iOS uses Apple Maps. Android uses Google Maps.</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#101216",
  },
  car: {
    position: "absolute",
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  caption: {
    position: "absolute",
    left: 20,
    right: 88,
    top: 92,
  },
});
