import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { Page } from "@/components/layout/Page";
import { RideMap } from "@/components/map/RideMap";
import { AppText } from "@/components/ui/AppText";
import { ScreenState } from "@/components/ui/ScreenState";
import { StatusPill } from "@/components/ui/ScoreRing";
import { clock, rideDate } from "@/constants/format";
import { theme } from "@/constants/theme";
import { LIVE_TRIP_ID, pastTrips } from "@/data/fleet";
import { routeLine, shiftLine } from "@/data/route";
import { rideMeta, tripHeadline, useRideStore, useSafetyIndex } from "@/stores/useRideStore";

export function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const safety = useSafetyIndex();
  const position = useRideStore((state) => state.position);
  const heading = useRideStore((state) => state.heading);
  const trail = useRideStore((state) => state.trail);
  const speed = useRideStore((state) => state.speedKmh);
  const eta = useRideStore((state) => state.etaMin);
  const leg = useRideStore((state) => state.leg);
  const alerts = useRideStore((state) => state.alerts);
  const shareLink = useRideStore((state) => state.shareLink);
  const guardians = useRideStore((state) => state.guardians);
  const routeShift = useRideStore((state) => state.routeShift);
  const liveRoute = useMemo(() => shiftLine(routeLine, routeShift), [routeShift]);

  if (id !== LIVE_TRIP_ID && !pastTrips.some((trip) => trip.id === id)) {
    return (
      <Page kicker="Trip" title="Missing ride" back>
        <ScreenState
          kind="error"
          title="This trip is not on the phone"
          body="The link does not match the simulated history. Return to Trips and open a listed ride."
        />
      </Page>
    );
  }

  const past = pastTrips.find((trip) => trip.id === id);
  const live = !past;
  const headline = tripHeadline(leg, Boolean(routeShift));
  const route = past?.route ?? liveRoute;
  const mapPosition = past?.position ?? position;
  const mapHeading = past?.heading ?? heading;
  const tripAlerts = alerts.filter((alert) => alert.tripId === id);
  const sharing = guardians.filter((guardian) => guardian.sharing);

  return (
    <Page title={live ? headline.to : past.destinationLabel} kicker={live ? "Live · simulated" : rideDate(past.startedAt)} back>
      <View style={styles.map}>
        <RideMap
          route={route}
          trail={live ? trail : route}
          position={mapPosition}
          heading={mapHeading}
          destination={route[route.length - 1]}
          origin={route[0]}
          follow={false}
          deviceFix={null}
          onPan={() => undefined}
          onPressVehicle={() => undefined}
        />
        <View style={styles.mapTag}>
          <AppText variant="caption">Simulated route</AppText>
        </View>
      </View>
      <View style={styles.block}>
        <View style={styles.row}>
          <AppText variant="label">{live ? "In progress" : past.status}</AppText>
          <StatusPill status={live ? safety.status : past.safetyStatus} />
        </View>
        <AppText variant="title">{live ? rideMeta.passenger.name : "Meera Shah"}</AppText>
        <View style={styles.metrics}>
          <Metric label="Speed" value={live ? `${speed} km/h` : `${past.distanceKm.toFixed(1)} km`} />
          <Metric label={live ? "ETA" : "From"} value={live ? `${eta} min` : past.originLabel} />
          <Metric label="Shared" value={String(sharing.length)} />
        </View>
        <AppText variant="caption" numberOfLines={1}>
          {live ? shareLink : "Share closed"}
        </AppText>
      </View>
      <AppText variant="label" style={styles.section}>
        Events
      </AppText>
      {tripAlerts.length === 0 ? (
        <ScreenState kind="empty" title="No events stored" body="This simulated ride has no safety events attached." />
      ) : (
        tripAlerts.map((alert) => (
          <View key={alert.id} style={styles.event}>
            <AppText variant="strong">{alert.title}</AppText>
            <AppText variant="caption">
              {clock(alert.at)} · {alert.locationLabel} · {alert.acknowledged ? "Acknowledged" : "Open"}
            </AppText>
          </View>
        ))
      )}
    </Page>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <AppText variant="label">{label}</AppText>
      <AppText variant="strong" numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 280,
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: "#121417",
  },
  mapTag: {
    position: "absolute",
    left: 12,
    top: 12,
    backgroundColor: "rgba(7,8,10,0.8)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  block: {
    marginTop: 16,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metrics: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  metric: {
    flex: 1,
    gap: 2,
  },
  section: {
    marginTop: 22,
    marginBottom: 10,
  },
  event: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    gap: 4,
  },
});
