import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { AlertTimelineItem } from "@/components/alerts/AlertTimelineItem";
import { Page } from "@/components/layout/Page";
import { RideMap } from "@/components/map/RideMap";
import { ApiStatusBanner } from "@/components/system/ApiStatusBanner";
import { AppText } from "@/components/ui/AppText";
import { ScreenState } from "@/components/ui/ScreenState";
import { StatusPill } from "@/components/ui/ScoreRing";
import { formatCoords, formatEta, formatSpeed, liveMapGeometry, rideStatusLabel } from "@/constants/liveMap";
import { clock, rideDate } from "@/constants/format";
import { pastTrips } from "@/data/fleet";
import { routeLine, shiftLine } from "@/data/route";
import { useTheme } from "@/providers/ThemeProvider";
import { tripHeadline, useRideStore, useSafetyIndex } from "@/stores/useRideStore";

export function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const safety = useSafetyIndex();
  const liveMode = useRideStore((state) => state.liveMode);
  const rideId = useRideStore((state) => state.rideId);
  const deviceId = useRideStore((state) => state.deviceId);
  const passengerName = useRideStore((state) => state.passengerName);
  const deviceState = useRideStore((state) => state.deviceState);
  const safetyStatus = useRideStore((state) => state.safetyStatus);
  const driverState = useRideStore((state) => state.driverState);
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
  const refreshing = useRideStore((state) => state.refreshing);
  const refreshAll = useRideStore((state) => state.refreshAll);
  const simulatedRoute = useMemo(
    () => shiftLine(routeLine, liveMode ? null : routeShift),
    [liveMode, routeShift],
  );
  const liveGeo = useMemo(() => liveMapGeometry(position, trail), [position, trail]);
  const { colors } = useTheme();

  const isLiveTrip = id === rideId;
  const past = !liveMode ? pastTrips.find((trip) => trip.id === id) : undefined;

  if (!isLiveTrip && !past) {
    return (
      <Page title="Missing ride" back>
        <ScreenState
          kind="error"
          title="This trip is not available"
          body={liveMode ? "Only the active guardian API ride is loaded." : "Open a ride from the Trips list."}
        />
      </Page>
    );
  }

  const live = isLiveTrip;
  const headline = tripHeadline(leg, Boolean(routeShift) && !liveMode);
  const route = past?.route ?? (liveMode ? liveGeo.route : simulatedRoute);
  const mapTrail = live ? (liveMode ? liveGeo.trail : trail) : route;
  const mapPosition = past?.position ?? position;
  const mapHeading = past?.heading ?? heading;
  const tripAlerts = alerts.filter((alert) => alert.tripId === id);
  const sharing = guardians.filter((guardian) => guardian.sharing);

  return (
    <Page
      title={live ? (liveMode ? rideId : headline.to) : past!.destinationLabel}
      subtitle={live ? `${passengerName || "Passenger"} · ${deviceId}` : rideDate(past!.startedAt)}
      back
      refreshing={live && liveMode ? refreshing : false}
      onRefresh={live && liveMode ? () => void refreshAll() : undefined}
      action={<StatusPill status={live ? safety.status : past!.safetyStatus} />}
    >
      {live ? (
        <View style={{ marginBottom: 10 }}>
          <ApiStatusBanner onRetry={() => void refreshAll()} />
        </View>
      ) : null}

      <View style={[styles.map, { borderColor: colors.line, backgroundColor: colors.mapBg }]}>
        <RideMap
          route={route}
          trail={mapTrail}
          position={mapPosition}
          heading={mapHeading}
          destination={live && liveMode ? null : route[route.length - 1]}
          origin={live && liveMode ? null : route[0]}
          follow={false}
          deviceFix={null}
          onPan={() => undefined}
          onPressVehicle={() => undefined}
        />
      </View>
      <View style={styles.block}>
        <AppText variant="title" style={{ fontSize: 22 }}>
          {passengerName || "Passenger"}
        </AppText>
        <AppText variant="caption">
          {live && liveMode
            ? `${rideStatusLabel({ safetyStatus, deviceState, speedKmh: speed })} · ${driverState}`
            : `${deviceId} · ${deviceState || "device"}`}
        </AppText>
        <View style={styles.metrics}>
          <Metric
            label={live ? "Speed" : "Distance"}
            value={live ? formatSpeed(speed) : `${past!.distanceKm.toFixed(1)} km`}
          />
          <Metric
            label={live ? "ETA" : "From"}
            value={live ? formatEta(eta) : past!.originLabel}
          />
          <Metric label="Shared" value={String(sharing.length)} />
        </View>
        <AppText variant="caption" numberOfLines={2}>
          {live
            ? `${deviceId} · ${formatCoords(position)}${shareLink ? ` · ${shareLink}` : ""}`
            : "Share closed"}
        </AppText>
      </View>
      <AppText variant="strong" style={styles.section}>
        Events
      </AppText>
      {tripAlerts.length === 0 ? (
        <ScreenState kind="empty" title="No events" body="Nothing has been recorded on this ride yet." />
      ) : (
        tripAlerts.map((alert, index) => (
          <AlertTimelineItem
            key={alert.id}
            alert={alert}
            timeLabel={`${clock(alert.at)} · ${alert.locationLabel || "Location unknown"}`}
            showLine={index < tripAlerts.length - 1}
            onAcknowledge={() => void acknowledge(alert.id)}
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
