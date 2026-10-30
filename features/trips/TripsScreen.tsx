import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { Page } from "@/components/layout/Page";
import { RideMap } from "@/components/map/RideMap";
import { TripHistoryCard } from "@/components/trips/TripHistoryCard";
import { ApiStatusBanner } from "@/components/system/ApiStatusBanner";
import { StatusChip } from "@/components/system/StatusChip";
import { AppText } from "@/components/ui/AppText";
import { ScreenState } from "@/components/ui/ScreenState";
import { clock, timeAgo } from "@/constants/format";
import { formatEta, formatSpeed, liveMapGeometry, rideStatusLabel } from "@/constants/liveMap";
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
  const publisherOnline = useRideStore((state) => state.publisherOnline);
  const safetyStatus = useRideStore((state) => state.safetyStatus);
  const score = useRideStore((state) => state.score);
  const rideStatus = useRideStore((state) => state.rideStatus);
  const rideId = useRideStore((state) => state.rideId);
  const history = useRideStore((state) => state.history);
  const alerts = useRideStore((state) => state.alerts);
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
  const openAlerts = useMemo(() => alerts.filter((alert) => !alert.acknowledged).length, [alerts]);
  const latest = useMemo(() => [...alerts].sort((a, b) => b.at - a.at).slice(0, 3), [alerts]);
  const { colors } = useTheme();

  return (
    <Page
      title="Trips"
      subtitle={liveMode ? `${rideId} · ${rideStatus}` : "This ride and past trips"}
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
      </View>

      {liveMode ? (
        <View style={styles.chips}>
          <StatusChip label={safetyStatus} tone={safetyStatus === "safe" ? "ok" : safetyStatus === "caution" ? "warn" : "danger"} />
          <StatusChip label={deviceOnline ? "online" : "offline"} tone={deviceOnline ? "ok" : "warn"} />
          <StatusChip label={publisherOnline ? "cam on" : "cam off"} tone={publisherOnline ? "ok" : "warn"} />
          <StatusChip label={`${score}`} tone={score >= 80 ? "ok" : "warn"} />
        </View>
      ) : null}

      <View style={styles.metrics}>
        <Metric label="ETA" value={formatEta(eta)} />
        <Metric label="Speed" value={formatSpeed(speed)} />
        <Metric label="Open" value={String(openAlerts)} />
      </View>

      <TripHistoryCard
        testID="live-trip-card"
        title={liveMode ? passengerName || rideId : headline.to}
        meta={liveMode ? `${deviceId} · ${status}` : passengerName}
        status={safety.status}
        onPress={() => router.push(`/trip/${rideId}`)}
      />

      {liveMode ? (
        history.length === 0 ? (
          <ScreenState kind="empty" title="No past rides" body="History from the API will show here." />
        ) : (
          <>
            <AppText variant="strong" style={{ marginTop: 18, marginBottom: 8 }}>
              Past rides
            </AppText>
            {history.map((trip) => (
              <TripHistoryCard
                key={trip.id}
                title={trip.passenger || trip.id}
                meta={`${trip.status} · score ${trip.score} · ${trip.alertCount} alerts${trip.startedAt ? ` · ${clock(trip.startedAt)}` : ""}`}
                status={trip.safetyStatus}
                onPress={() => router.push(`/trip/${trip.id}`)}
              />
            ))}
          </>
        )
      ) : (
        pastTrips.map((trip) => (
          <TripHistoryCard
            key={trip.id}
            title={trip.destinationLabel}
            meta={`${trip.distanceKm.toFixed(1)} km`}
            status={trip.safetyStatus}
            onPress={() => router.push(`/trip/${trip.id}`)}
          />
        ))
      )}

      {liveMode && latest.length > 0 ? (
        <View style={{ marginTop: 22, gap: 8 }}>
          <View style={styles.sectionHeader}>
            <AppText variant="strong">Latest alerts</AppText>
            <Pressable onPress={() => router.push("/alerts")} hitSlop={8}>
              <AppText variant="caption" style={{ color: colors.signal }}>
                See all
              </AppText>
            </Pressable>
          </View>
          {latest.map((alert) => (
            <Pressable key={alert.id} onPress={() => router.push("/alerts")} style={styles.previewRow}>
              <AppText variant="strong" numberOfLines={1}>
                {alert.title}
              </AppText>
              <AppText variant="caption">{timeAgo(alert.at)}</AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
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
    height: 200,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
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
  metric: { flex: 1, gap: 2 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewRow: {
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.08)",
    gap: 2,
  },
});
