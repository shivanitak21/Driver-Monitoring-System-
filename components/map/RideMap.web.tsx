import { useMemo } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";

import { CarGlyph } from "@/components/map/CarGlyph";
import { KeyedRideMap } from "@/components/map/KeyedRideMap";
import type { RideMapProps } from "@/components/map/types";
import { useSmoothPose } from "@/components/map/useSmoothPose";
import { AppText } from "@/components/ui/AppText";
import { googleMapsApiKey } from "@/constants/maps";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useTheme } from "@/providers/ThemeProvider";
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
  const points = route.length > 0 ? route : [position];
  const bounds = useMemo(() => boundsOf(points), [points]);
  const { colors, scheme } = useTheme();
  const reduceMotion = useReduceMotion();
  const pose = useSmoothPose(position, heading, reduceMotion);

  const project = (point: Coordinate) => {
    const padX = 36;
    const padTop = 88;
    const padBottom = 220;
    const spanLng = Math.max(bounds.maxLng - bounds.minLng, 0.0001);
    const spanLat = Math.max(bounds.maxLat - bounds.minLat, 0.0001);
    return {
      x: padX + ((point.longitude - bounds.minLng) / spanLng) * (width - padX * 2),
      y: padTop + ((bounds.maxLat - point.latitude) / spanLat) * (height - padTop - padBottom),
    };
  };

  const routePoints = route.map(project).map((point) => `${point.x},${point.y}`).join(" ");
  const trailPoints = trail.map(project).map((point) => `${point.x},${point.y}`).join(" ");
  const car = project(pose);
  const dest = destination ? project(destination) : null;
  const phone = deviceFix ? project(deviceFix) : null;
  const grid = scheme === "light" ? "rgba(23,25,29,0.06)" : "rgba(245,246,247,0.06)";
  const road = scheme === "light" ? "rgba(23,25,29,0.28)" : "rgba(245,246,247,0.38)";

  return (
    <View style={[styles.fill, { backgroundColor: colors.mapBg }]}>
      <Svg width={width} height={height}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Line key={`v-${index}`} x1={(width / 8) * index} y1={0} x2={(width / 8) * index} y2={height} stroke={grid} />
        ))}
        {Array.from({ length: 12 }).map((_, index) => (
          <Line key={`h-${index}`} x1={0} y1={(height / 12) * index} x2={width} y2={(height / 12) * index} stroke={grid} />
        ))}
        {routePoints ? <Polyline points={routePoints} fill="none" stroke={road} strokeWidth={3} /> : null}
        {trail.length > 1 ? <Polyline points={trailPoints} fill="none" stroke={colors.signal} strokeWidth={4} /> : null}
        {dest ? <Circle cx={dest.x} cy={dest.y} r={6} fill={colors.cyan} /> : null}
        {phone ? <Circle cx={phone.x} cy={phone.y} r={5} fill="#7EB6FF" /> : null}
      </Svg>
      <Pressable
        testID="vehicle-marker"
        accessibilityLabel="Open vehicle details"
        onPress={onPressVehicle}
        style={[
          styles.car,
          {
            left: car.x - 28,
            top: car.y - 28,
            transform: [{ rotate: `${pose.heading}deg` }],
          },
        ]}
      >
        <CarGlyph width={52} height={52} />
      </Pressable>
      <View style={styles.caption} pointerEvents="none">
        <AppText variant="caption">Route preview on web. iOS uses Apple Maps. Android uses Google Maps.</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
  },
  car: {
    position: "absolute",
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  caption: {
    position: "absolute",
    left: 20,
    right: 20,
    top: 72,
  },
});
