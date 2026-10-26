import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { Page } from "@/components/layout/Page";
import { RideMap } from "@/components/map/RideMap";
import { TripHistoryCard } from "@/components/trips/TripHistoryCard";
import { AppText } from "@/components/ui/AppText";
import { rideDate } from "@/constants/format";
import { pastTrips } from "@/data/fleet";
import { routeLine, shiftLine } from "@/data/route";
import { useTheme } from "@/providers/ThemeProvider";
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
  const { colors } = useTheme();

  return (
    <Page title="Trips" subtitle="This ride and the ones kept on the phone">
      <View style={[styles.map, { borderColor: colors.line, backgroundColor: colors.mapBg }]}>
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
        <View style={[styles.mapTag, { backgroundColor: colors.glass }]} pointerEvents="none">
          <AppText variant="caption">Live</AppText>
        </View>
      </View>

      <View style={styles.metrics}>
        <Metric label="ETA" value={`${eta} min`} />
        <Metric label="Speed" value={`${speed} km/h`} />
        <Metric label="Logged" value={`${loggedKm.toFixed(0)} km`} />
      </View>

      <TripHistoryCard
        testID="live-trip-card"
        title={headline.to}
        meta={rideMeta.passenger.name}
        status={safety.status}
        onPress={() => router.push(`/trip/${rideMeta.tripId}`)}
      />

      {pastTrips.map((trip) => (
        <TripHistoryCard
          key={trip.id}
          title={trip.destinationLabel}
          meta={`${rideDate(trip.startedAt)} · ${trip.distanceKm.toFixed(1)} km`}
          status={trip.safetyStatus}
          onPress={() => router.push(`/trip/${trip.id}`)}
        />
      ))}
    </Page>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <AppText variant="label">{label}</AppText>
      <AppText variant="metric" style={{ fontSize: 20 }}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 220,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
  },
  mapTag: {
    position: "absolute",
    left: 12,
    top: 12,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metrics: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
    marginBottom: 8,
  },
  metric: {
    flex: 1,
    gap: 2,
  },
});
