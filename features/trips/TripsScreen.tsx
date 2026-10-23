import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { Page } from "@/components/layout/Page";
import { RideMap } from "@/components/map/RideMap";
import { AppText } from "@/components/ui/AppText";
import { StatusPill } from "@/components/ui/ScoreRing";
import { rideDate } from "@/constants/format";
import { theme } from "@/constants/theme";
import { pastTrips } from "@/data/fleet";
import { routeLine, shiftLine } from "@/data/route";
import { rideMeta, tripHeadline, useRideStore, useSafetyIndex } from "@/stores/useRideStore";

export function TripsScreen() {
  const safety = useSafetyIndex();
  const eta = useRideStore((state) => state.etaMin);
  const speed = useRideStore((state) => state.speedKmh);
  const leg = useRideStore((state) => state.leg);
  const local = useRideStore((state) => Boolean(state.routeShift));
  const position = useRideStore((state) => state.position);
  const heading = useRideStore((state) => state.heading);
  const trail = useRideStore((state) => state.trail);
  const routeShift = useRideStore((state) => state.routeShift);
  const headline = tripHeadline(leg, local);
  const route = useMemo(() => shiftLine(routeLine, routeShift), [routeShift]);
  const loggedKm = pastTrips.reduce((sum, trip) => sum + trip.distanceKm, 0);

  return (
    <Page title="Trips">
      <View style={styles.map}>
        <RideMap
          route={route}
          trail={trail}
          position={position}
          heading={heading}
          destination={route[route.length - 1]}
          origin={route[0]}
          follow={false}
          deviceFix={null}
          onPan={() => undefined}
          onPressVehicle={() => router.push(`/trip/${rideMeta.tripId}`)}
        />
        <View style={styles.mapTag} pointerEvents="none">
          <AppText variant="caption">Live</AppText>
        </View>
      </View>

      <View style={styles.metrics}>
        <Metric label="ETA" value={`${eta} min`} />
        <Metric label="Speed" value={`${speed}`} />
        <Metric label="Logged" value={`${loggedKm.toFixed(0)} km`} />
      </View>

      <Pressable testID="live-trip-card" onPress={() => router.push(`/trip/${rideMeta.tripId}`)} style={styles.row}>
        <View style={styles.flex}>
          <AppText variant="strong">{headline.to}</AppText>
          <AppText variant="caption">{rideMeta.passenger.name}</AppText>
        </View>
        <StatusPill status={safety.status} />
      </Pressable>

      {pastTrips.map((trip) => (
        <Pressable key={trip.id} onPress={() => router.push(`/trip/${trip.id}`)} style={styles.row}>
          <View style={styles.flex}>
            <AppText variant="strong">{trip.destinationLabel}</AppText>
            <AppText variant="caption">
              {rideDate(trip.startedAt)} · {trip.distanceKm.toFixed(1)} km
            </AppText>
          </View>
          <StatusPill status={trip.safetyStatus} />
        </Pressable>
      ))}
    </Page>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <AppText variant="label">{label}</AppText>
      <AppText variant="strong">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 220,
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.bgSoft,
  },
  mapTag: {
    position: "absolute",
    left: 12,
    top: 12,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metrics: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  metric: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: theme.line,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
});
