import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { Page } from "@/components/layout/Page";
import { RideMap } from "@/components/map/RideMap";
import { TripHistoryCard } from "@/components/trips/TripHistoryCard";
import { ApiStatusBanner } from "@/components/system/ApiStatusBanner";
import { StatusChip } from "@/components/system/StatusChip";
import { AppText } from "@/components/ui/AppText";
import { ScreenState } from "@/components/ui/ScreenState";
import { formatCoords, formatEta, formatSpeed, liveMapGeometry, rideStatusLabel } from "@/constants/liveMap";
import { rideDate } from "@/constants/format";
import { pastTrips } from "@/data/fleet";
import { routeLine, shiftLine } from "@/data/route";
import { useLiveApiRefresh } from "@/hooks/useLiveApiRefresh";
import { useTheme } from "@/providers/ThemeProvider";
import { tripHeadline, useRideStore, useSafetyIndex } from "@/stores/useRideStore";

export function TripsScreen() {
  useLiveApiRefresh("all");
  const safety = useSafetyIndex();
  const eta = useRideStore((state) => state.etaMin);
  const speed = useRideStore((state) => state.speedKmh);
  const leg = useRideStore((state) => state.leg);
  const liveMode = useRideStore((state) => state.liveMode);
  const passengerName = useRideStore((state) => state.passengerName);
  const deviceId = useRideStore((state) => state.deviceId);
  const deviceState = useRideStore((state) => state.deviceState);
  const safetyStatus = useRideStore((state) => state.safetyStatus);
  const rideId = useRideStore((state) => state.rideId);
  const shareLink = useRideStore((state) => state.shareLink);
  const refreshing = useRideStore((state) => state.refreshing);
  const refreshAll = useRideStore((state) => state.refreshAll);
  const local = useRideStore((state) => Boolean(state.routeShift) && !state.liveMode);
  const position = useRideStore((state) => state.position);
  const heading = useRideStore((state) => state.heading);
  const trail = useRideStore((state) => state.trail);
  const routeShift = useRideStore((state) => state.routeShift);
  const headline = tripHeadline(leg, local);
  const status = rideStatusLabel({ safetyStatus, deviceState, speedKmh: speed });
  const simulatedRoute = useMemo(() => shiftLine(routeLine, routeShift), [routeShift]);
  const liveGeo = useMemo(() => liveMapGeometry(position, trail), [position, trail]);
  const route = liveMode ? liveGeo.route : simulatedRoute;
  const mapTrail = liveMode ? liveGeo.trail : trail;
  const deviceOnline = (deviceState || "").toLowerCase() === "online";
  const { colors } = useTheme();

  return (
    <Page
      title="Trips"
      subtitle={liveMode ? `${rideId} · ${deviceId}` : "This ride and the ones kept on the phone"}
      refreshing={refreshing}
      onRefresh={liveMode ? () => void refreshAll() : undefined}
    >
      <View style={{ marginBottom: 10 }}>
        <ApiStatusBanner onRetry={() => void refreshAll()} />
      </View>

      <View style={[styles.map, { borderColor: colors.line, backgroundColor: colors.mapBg }]}>
        <RideMap
          route={route}
          trail={mapTrail}
          position={position}
          heading={heading}
          destination={liveMode ? null : simulatedRoute[simulatedRoute.length - 1]}
          origin={liveMode ? null : simulatedRoute[0]}
          follow={false}
          deviceFix={null}
          onPan={() => undefined}
          onPressVehicle={() => router.push(`/trip/${rideId}`)}
        />
        <View style={[styles.mapTag, { backgroundColor: colors.glass }]} pointerEvents="none">
          <AppText variant="caption">{liveMode ? status : "Live"}</AppText>
        </View>
      </View>

      {liveMode ? (
        <View style={styles.chips}>
          <StatusChip label={safetyStatus} tone={safetyStatus === "safe" ? "ok" : safetyStatus === "caution" ? "warn" : "danger"} />
          <StatusChip label={deviceState || "device"} tone={deviceOnline ? "ok" : "warn"} />
          <StatusChip label={shareLink ? "Link ready" : "No link"} tone={shareLink ? "ok" : "muted"} />
        </View>
      ) : null}

      <View style={styles.metrics}>
        <Metric label="ETA" value={formatEta(eta)} />
        <Metric label="Speed" value={formatSpeed(speed)} />
        <Metric label="Fix" value={liveMode ? formatCoords(position).split(",")[0] : "—"} />
      </View>

      {liveMode ? (
        <AppText variant="caption" style={{ marginBottom: 8 }}>
          {formatCoords(position)}
        </AppText>
      ) : null}

      <TripHistoryCard
        testID="live-trip-card"
        title={liveMode ? passengerName || rideId : headline.to}
        meta={liveMode ? `${rideId} · ${deviceId} · ${status}` : passengerName}
        status={safety.status}
        onPress={() => router.push(`/trip/${rideId}`)}
      />

      {liveMode ? (
        <ScreenState
          kind="empty"
          title="Active ride only"
          body="The guardian API exposes the current ride. Trip history is not available from this backend."
        />
      ) : (
        pastTrips.map((trip) => (
          <TripHistoryCard
            key={trip.id}
            title={trip.destinationLabel}
            meta={`${rideDate(trip.startedAt)} · ${trip.distanceKm.toFixed(1)} km`}
            status={trip.safetyStatus}
            onPress={() => router.push(`/trip/${trip.id}`)}
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
      <AppText variant="metric" style={{ fontSize: 18 }} numberOfLines={1}>
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
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  metrics: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  metric: {
    flex: 1,
    gap: 2,
  },
});
