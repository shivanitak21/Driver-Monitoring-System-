import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { AlertTimelineItem } from "@/components/alerts/AlertTimelineItem";
import { Page } from "@/components/layout/Page";
import { RideMap } from "@/components/map/RideMap";
import { SeatOccupancyGrid } from "@/components/safety/SeatOccupancyGrid";
import { ApiStatusBanner } from "@/components/system/ApiStatusBanner";
import { StatusChip } from "@/components/system/StatusChip";
import { AppText } from "@/components/ui/AppText";
import { ScreenState } from "@/components/ui/ScreenState";
import { StatusPill } from "@/components/ui/ScoreRing";
import { formatCoords, formatEta, formatSpeed, liveMapGeometry, rideStatusLabel } from "@/constants/liveMap";
import { clock, rideDate, timeAgo } from "@/constants/format";
import { pastTrips } from "@/data/fleet";
import { routeLine, shiftLine } from "@/data/route";
import { useTheme } from "@/providers/ThemeProvider";
import { services } from "@/services/createServices";
import { tripHeadline, useRideStore, useSafetyIndex } from "@/stores/useRideStore";
import type { SafetyAlert } from "@/types/domain";

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
  const publisherOnline = useRideStore((state) => state.publisherOnline);
  const score = useRideStore((state) => state.score);
  const rideStatus = useRideStore((state) => state.rideStatus);
  const seats = useRideStore((state) => state.seats);
  const position = useRideStore((state) => state.position);
  const heading = useRideStore((state) => state.heading);
  const trail = useRideStore((state) => state.trail);
  const speed = useRideStore((state) => state.speedKmh);
  const eta = useRideStore((state) => state.etaMin);
  const leg = useRideStore((state) => state.leg);
  const alerts = useRideStore((state) => state.alerts);
  const shareLink = useRideStore((state) => state.shareLink);
  const guardians = useRideStore((state) => state.guardians);
  const history = useRideStore((state) => state.history);
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
  const historyRide = liveMode ? history.find((trip) => trip.id === id) : undefined;
  const live = isLiveTrip;
  const [remoteAlerts, setRemoteAlerts] = useState<SafetyAlert[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!liveMode || !id || isLiveTrip || !services.api) {
      setRemoteAlerts([]);
      setRemoteError(null);
      return;
    }
    let alive = true;
    setRemoteLoading(true);
    setRemoteError(null);
    void services.api
      .listAlerts(id, "all")
      .then((items) => {
        if (!alive) return;
        setRemoteAlerts([...items].sort((a, b) => b.at - a.at));
      })
      .catch((error: Error) => {
        if (!alive) return;
        setRemoteError(error.message || "Could not load events for this ride");
      })
      .finally(() => {
        if (alive) setRemoteLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, isLiveTrip, liveMode]);

  const tripAlerts = useMemo(() => {
    if (live) return [...alerts].filter((alert) => alert.tripId === id).sort((a, b) => b.at - a.at);
    if (liveMode) return remoteAlerts;
    return [];
  }, [alerts, id, live, liveMode, remoteAlerts]);

  const sharing = guardians.filter((guardian) => guardian.sharing);
  const deviceOnline = (deviceState || "").toLowerCase() === "online";

  if (!isLiveTrip && !past && !historyRide) {
    return (
      <Page title="Missing ride" back>
        <ScreenState
          kind="error"
          title="This trip is not available"
          body={liveMode ? "Open a ride from device history or the live trip card." : "Open a ride from the Trips list."}
        />
      </Page>
    );
  }

  const headline = tripHeadline(leg, Boolean(routeShift) && !liveMode);
  const route = past?.route ?? (liveMode && live ? liveGeo.route : simulatedRoute);
  const mapTrail = live ? (liveMode ? liveGeo.trail : trail) : past?.route ?? [];
  const mapPosition = past?.position ?? (live ? position : null);
  const mapHeading = past?.heading ?? (live ? heading : 0);

  if (historyRide && !live) {
    return (
      <Page
        title={historyRide.id}
        subtitle={historyRide.passenger || historyRide.deviceId}
        back
        action={<StatusPill status={historyRide.safetyStatus} />}
      >
        <View style={styles.block}>
          <AppText variant="title" style={{ fontSize: 22 }}>
            {historyRide.passenger || historyRide.id}
          </AppText>
          <View style={styles.chips}>
            <StatusChip label={historyRide.status} tone={historyRide.status === "active" ? "ok" : "muted"} />
            <StatusChip
              label={historyRide.safetyStatus}
              tone={
                historyRide.safetyStatus === "safe"
                  ? "ok"
                  : historyRide.safetyStatus === "caution"
                    ? "warn"
                    : "danger"
              }
            />
            <StatusChip label={`score ${historyRide.score}`} tone={historyRide.score >= 80 ? "ok" : "warn"} />
            <StatusChip label={`${historyRide.alertCount} alerts`} tone="muted" />
          </View>
          <AppText variant="caption">
            {historyRide.startedAt ? rideDate(historyRide.startedAt) : "startedAt unknown"}
            {historyRide.endedAt ? ` → ${clock(historyRide.endedAt)}` : ""}
          </AppText>
        </View>

        <AppText variant="strong" style={styles.section}>
          Event history ({tripAlerts.length}
          {historyRide.alertCount ? ` / ${historyRide.alertCount}` : ""})
        </AppText>
        {remoteLoading ? <ScreenState kind="loading" title="Loading events" /> : null}
        {remoteError ? <ScreenState kind="error" title="Events failed" body={remoteError} /> : null}
        {!remoteLoading && !remoteError && tripAlerts.length === 0 ? (
          <ScreenState kind="empty" title="No events" body="GET /alerts returned nothing for this ride id." />
        ) : null}
        {!remoteLoading &&
          tripAlerts.map((alert, index) => (
            <AlertTimelineItem
              key={alert.id}
              alert={alert}
              timeLabel={`${timeAgo(alert.at)} · ${clock(alert.at)}`}
              showLine={index < tripAlerts.length - 1}
              onAcknowledge={() => undefined}
              onEvidence={() => router.push(`/evidence/${alert.id}`)}
            />
          ))}
      </Page>
    );
  }

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
        {mapPosition ? (
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
        ) : null}
      </View>
      <View style={styles.block}>
        <AppText variant="title" style={{ fontSize: 22 }}>
          {passengerName || "Passenger"}
        </AppText>
        {live && liveMode ? (
          <View style={styles.chips}>
            <StatusChip label={rideStatus} tone={rideStatus === "active" ? "ok" : "muted"} />
            <StatusChip
              label={safetyStatus}
              tone={safetyStatus === "safe" ? "ok" : safetyStatus === "caution" ? "warn" : "danger"}
            />
            <StatusChip label={driverState} tone={driverState === "attentive" ? "ok" : "danger"} />
            <StatusChip label={deviceOnline ? "device online" : "device offline"} tone={deviceOnline ? "ok" : "warn"} />
            <StatusChip
              label={publisherOnline ? "camera online" : "camera offline"}
              tone={publisherOnline ? "ok" : "warn"}
            />
            <StatusChip label={`score ${score}`} tone={score >= 80 ? "ok" : score >= 50 ? "warn" : "danger"} />
          </View>
        ) : (
          <AppText variant="caption">
            {live && liveMode
              ? `${rideStatusLabel({ safetyStatus, deviceState, speedKmh: speed })} · ${driverState}`
              : `${deviceId} · ${deviceState || "device"}`}
          </AppText>
        )}
        <View style={styles.metrics}>
          <Metric
            label={live ? "Speed" : "Distance"}
            value={live ? formatSpeed(speed) : `${past!.distanceKm.toFixed(1)} km`}
          />
          <Metric label={live ? "ETA" : "From"} value={live ? formatEta(eta) : past!.originLabel} />
          <Metric label="Shared" value={String(sharing.length)} />
        </View>
        <AppText variant="caption" numberOfLines={2}>
          {live
            ? `${deviceId} · ${formatCoords(position)} · ${Math.round(heading)}°${shareLink ? ` · ${shareLink}` : ""}`
            : "Share closed"}
        </AppText>
      </View>

      {live && liveMode ? (
        <View style={{ marginTop: 18, gap: 10 }}>
          <AppText variant="strong">Seats</AppText>
          <SeatOccupancyGrid seats={seats} awaitingWhenEmpty />
        </View>
      ) : null}

      <AppText variant="strong" style={styles.section}>
        Event history ({tripAlerts.length})
      </AppText>
      {tripAlerts.length === 0 ? (
        <ScreenState kind="empty" title="No events" body="Nothing has been recorded on this ride yet." />
      ) : (
        tripAlerts.map((alert, index) => (
          <AlertTimelineItem
            key={alert.id}
            alert={alert}
            timeLabel={`${timeAgo(alert.at)} · ${clock(alert.at)}`}
            showLine={index < tripAlerts.length - 1}
            onAcknowledge={() => void acknowledge(alert.id)}
            onEvidence={() => router.push(`/evidence/${alert.id}`)}
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
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
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
