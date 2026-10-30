import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { AlertTimelineItem } from "@/components/alerts/AlertTimelineItem";
import { Page } from "@/components/layout/Page";
import { RideMap } from "@/components/map/RideMap";
import { TripHistoryCard } from "@/components/trips/TripHistoryCard";
import { ApiStatusBanner } from "@/components/system/ApiStatusBanner";
import { StatusChip } from "@/components/system/StatusChip";
import { AppText } from "@/components/ui/AppText";
import { ScreenState } from "@/components/ui/ScreenState";
import { Segmented } from "@/components/ui/Segmented";
import { clock, timeAgo } from "@/constants/format";
import { formatCoords, formatEta, formatSpeed, liveMapGeometry, rideStatusLabel } from "@/constants/liveMap";
import { pastTrips } from "@/data/fleet";
import { routeLine, shiftLine } from "@/data/route";
import { useLiveApiRefresh } from "@/hooks/useLiveApiRefresh";
import { useTheme } from "@/providers/ThemeProvider";
import { tripHeadline, useRideStore, useSafetyIndex } from "@/stores/useRideStore";
import { useState } from "react";
import type { MediaChannel } from "@/types/domain";

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
  const driverState = useRideStore((state) => state.driverState);
  const score = useRideStore((state) => state.score);
  const rideStatus = useRideStore((state) => state.rideStatus);
  const rideId = useRideStore((state) => state.rideId);
  const shareLink = useRideStore((state) => state.shareLink);
  const history = useRideStore((state) => state.history);
  const alerts = useRideStore((state) => state.alerts);
  const acknowledge = useRideStore((state) => state.acknowledge);
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
  const [eventChannel, setEventChannel] = useState<"all" | MediaChannel>("all");
  const eventHistory = useMemo(() => {
    const sorted = [...alerts].sort((a, b) => b.at - a.at);
    if (eventChannel === "all") return sorted;
    return sorted.filter((alert) => alert.channel === eventChannel);
  }, [alerts, eventChannel]);
  const { colors } = useTheme();

  return (
    <Page
      title="Trips"
      subtitle={liveMode ? `${rideId} · ${deviceId} · ${rideStatus}` : "This ride and the ones kept on the phone"}
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
          <StatusChip label={driverState} tone={driverState === "attentive" ? "ok" : "danger"} />
          <StatusChip label={deviceOnline ? "device online" : "device offline"} tone={deviceOnline ? "ok" : "warn"} />
          <StatusChip label={publisherOnline ? "camera online" : "camera offline"} tone={publisherOnline ? "ok" : "warn"} />
          <StatusChip label={`score ${score}`} tone={score >= 80 ? "ok" : score >= 50 ? "warn" : "danger"} />
          <StatusChip label={shareLink ? "link ready" : "no link"} tone={shareLink ? "ok" : "muted"} />
        </View>
      ) : null}

      <View style={styles.metrics}>
        <Metric label="ETA" value={formatEta(eta)} />
        <Metric label="Speed" value={formatSpeed(speed)} />
        <Metric label="Events" value={String(alerts.length)} />
      </View>

      {liveMode ? (
        <AppText variant="caption" style={{ marginBottom: 8 }}>
          {formatCoords(position)} · heading {Math.round(heading)}°
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
        history.length === 0 ? (
          <ScreenState
            kind="empty"
            title="No ride history"
            body="GET /v1/history?deviceId=… returned no rides for this device."
          />
        ) : (
          <>
            <AppText variant="strong" style={{ marginTop: 18, marginBottom: 4 }}>
              Ride history
            </AppText>
            <AppText variant="caption" style={{ marginBottom: 8 }}>
              From GET /v1/history · {history.length} ride{history.length === 1 ? "" : "s"}
            </AppText>
            {history.map((trip) => (
              <TripHistoryCard
                key={trip.id}
                title={trip.passenger || trip.id}
                meta={`${trip.id} · ${trip.status} · score ${trip.score} · ${trip.alertCount} alerts${trip.startedAt ? ` · ${clock(trip.startedAt)}` : ""}`}
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

      {liveMode ? (
        <View style={{ marginTop: 22 }}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="strong">Event history</AppText>
              <AppText variant="caption">
                From GET /v1/rides/…/alerts · {eventHistory.length}
                {eventChannel === "all" ? ` of ${alerts.length}` : ""} shown
              </AppText>
            </View>
            <Pressable onPress={() => router.push("/alerts")} hitSlop={8}>
              <AppText variant="caption" style={{ color: colors.signal }}>
                Alerts tab
              </AppText>
            </Pressable>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Segmented
              value={eventChannel}
              onChange={(id) => setEventChannel(id as "all" | MediaChannel)}
              items={[
                { id: "all", label: "All" },
                { id: "dms", label: "Driver" },
                { id: "cms", label: "Cabin" },
              ]}
            />
          </View>

          {eventHistory.length === 0 ? (
            <ScreenState
              kind="empty"
              title="No events yet"
              body="Vehicle alerts (drowsiness, distraction, cabin activity, SOS) appear here as event history."
            />
          ) : (
            eventHistory.map((alert, index) => (
              <AlertTimelineItem
                key={alert.id}
                alert={alert}
                timeLabel={`${timeAgo(alert.at)} · ${clock(alert.at)}`}
                showLine={index < eventHistory.length - 1}
                onAcknowledge={() => void acknowledge(alert.id)}
                onEvidence={() => router.push(`/evidence/${alert.id}`)}
              />
            ))
          )}
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
});
