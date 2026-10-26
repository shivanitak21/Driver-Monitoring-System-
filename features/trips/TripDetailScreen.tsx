import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { AlertTimelineItem } from "@/components/alerts/AlertTimelineItem";
import { Page } from "@/components/layout/Page";
import { RideMap } from "@/components/map/RideMap";
import { AppText } from "@/components/ui/AppText";
import { ScreenState } from "@/components/ui/ScreenState";
import { StatusPill } from "@/components/ui/ScoreRing";
import { clock, rideDate } from "@/constants/format";
import { LIVE_TRIP_ID, pastTrips } from "@/data/fleet";
import { routeLine, shiftLine } from "@/data/route";
import { useTheme } from "@/providers/ThemeProvider";
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
  const acknowledge = useRideStore((state) => state.acknowledge);
  const liveRoute = useMemo(() => shiftLine(routeLine, routeShift), [routeShift]);
  const { colors } = useTheme();

  if (id !== LIVE_TRIP_ID && !pastTrips.some((trip) => trip.id === id)) {
    return (
      <Page title="Missing ride" back>
        <ScreenState kind="error" title="This trip is not on the phone" body="Open a ride from the Trips list." />
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
    <Page
      title={live ? headline.to : past.destinationLabel}
      subtitle={live ? "In progress" : rideDate(past.startedAt)}
      back
      action={<StatusPill status={live ? safety.status : past.safetyStatus} />}
    >
      <View style={[styles.map, { borderColor: colors.line, backgroundColor: colors.mapBg }]}>
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
      </View>
      <View style={styles.block}>
        <AppText variant="title" style={{ fontSize: 22 }}>
          {live ? rideMeta.passenger.name : rideMeta.passenger.name}
        </AppText>
        <View style={styles.metrics}>
          <Metric label="Speed" value={live ? `${speed} km/h` : `${past.distanceKm.toFixed(1)} km`} />
          <Metric label={live ? "ETA" : "From"} value={live ? `${eta} min` : past.originLabel} />
          <Metric label="Shared" value={String(sharing.length)} />
        </View>
        <AppText variant="caption" numberOfLines={1}>
          {live ? shareLink : "Share closed"}
        </AppText>
      </View>
      <AppText variant="strong" style={styles.section}>
        Events
      </AppText>
      {tripAlerts.length === 0 ? (
        <ScreenState kind="empty" title="No events" body="Nothing has been recorded on this ride." />
      ) : (
        tripAlerts.map((alert, index) => (
          <AlertTimelineItem
            key={alert.id}
            alert={alert}
            timeLabel={`${clock(alert.at)} · ${alert.locationLabel}`}
            showLine={index < tripAlerts.length - 1}
            onAcknowledge={() => acknowledge(alert.id)}
          />
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
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
  },
  block: {
    marginTop: 18,
    gap: 8,
  },
  metrics: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  metric: {
    flex: 1,
    gap: 2,
  },
  section: {
    marginTop: 28,
    marginBottom: 12,
  },
});
