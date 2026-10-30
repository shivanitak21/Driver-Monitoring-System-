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
import { formatCoords, formatEta, formatSpeed, liveMapGeometry } from "@/constants/liveMap";
import { clock, rideDate, timeAgo } from "@/constants/format";
import { pastTrips } from "@/data/fleet";
import { routeLine, shiftLine } from "@/data/route";
import { useTheme } from "@/providers/ThemeProvider";
import { services } from "@/services/createServices";
import { useRideStore, useSafetyIndex } from "@/stores/useRideStore";
import type { RideDto } from "@/services/api/types";
import type { Coordinate } from "@/types/domain";

function usableRoute(points: Coordinate[] | null | undefined): Coordinate[] {
  if (!points?.length) return [];
  return points.filter(
    (point) =>
      point &&
      typeof point.latitude === "number" &&
      typeof point.longitude === "number" &&
      Number.isFinite(point.latitude) &&
      Number.isFinite(point.longitude),
  ) as Coordinate[];
}

export function TripDetailScreen() {
  const { id, startedAt: startedAtParam } = useLocalSearchParams<{ id: string; startedAt?: string }>();
  const startedAtMs = startedAtParam && startedAtParam !== "" ? Number(startedAtParam) : null;
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

  const isLiveOpen =
    id === rideId && (startedAtMs == null || !Number.isFinite(startedAtMs));
  const past = !liveMode ? pastTrips.find((trip) => trip.id === id) : undefined;
  const historyRide = liveMode
    ? history.find((trip) => {
        if (trip.id !== id) return false;
        if (startedAtMs != null && Number.isFinite(startedAtMs)) return trip.startedAt === startedAtMs;
        return trip.status === "active" || trip.endedAt == null;
      })
    : undefined;

  const [historyRideDetail, setHistoryRideDetail] = useState<RideDto | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!liveMode || isLiveOpen || !id || !services.api) {
      setHistoryRideDetail(null);
      setHistoryError(null);
      return;
    }
    let alive = true;
    setHistoryLoading(true);
    setHistoryError(null);
    void services.api
      .getRide(id, startedAtMs != null && Number.isFinite(startedAtMs) ? startedAtMs : historyRide?.startedAt)
      .then((ride) => {
        if (!alive) return;
        setHistoryRideDetail(ride);
      })
      .catch((error: Error) => {
        if (!alive) return;
        setHistoryError(error.message || "Could not load this trip");
      })
      .finally(() => {
        if (alive) setHistoryLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [historyRide?.startedAt, id, isLiveOpen, liveMode, startedAtMs]);

  const tripAlerts = useMemo(() => {
    // FRONTEND.md: alerts are not filtered by startedAt — all alerts for ride id.
    return [...alerts].filter((alert) => alert.tripId === (id || rideId)).sort((a, b) => b.at - a.at);
  }, [alerts, id, rideId]);

  const sharing = guardians.filter((guardian) => guardian.sharing);
  const deviceOnline = (deviceState || "").toLowerCase() === "online";

  if (!isLiveOpen && !past && !historyRide && liveMode) {
    return (
      <Page title="Missing trip" back>
        <ScreenState
          kind="error"
          title="This trip is not available"
          body="Open a trip from Past rides. Trips share ride id; use startedAt to select one."
        />
      </Page>
    );
  }

  if (!isLiveOpen && !past && !liveMode) {
    return (
      <Page title="Missing ride" back>
        <ScreenState kind="error" title="This trip is not available" body="Open a ride from the Trips list." />
      </Page>
    );
  }

  // History trip view (same ride id, keyed by startedAt)
  if (liveMode && !isLiveOpen) {
    const routePoints = usableRoute(
      (historyRideDetail?.route as Coordinate[] | undefined) ||
        [
          historyRide?.start,
          historyRide?.end,
        ].filter(Boolean) as Coordinate[],
    );
    const mapPosition =
      (historyRideDetail?.position?.latitude != null && historyRideDetail?.position?.longitude != null
        ? {
            latitude: historyRideDetail.position.latitude as number,
            longitude: historyRideDetail.position.longitude as number,
          }
        : null) ||
      historyRide?.end ||
      routePoints[routePoints.length - 1] ||
      null;
    const origin = historyRide?.start || routePoints[0] || null;
    const drawLine = routePoints.length >= 2;

    return (
      <Page
        title={historyRide?.passenger || id}
        subtitle={
          historyRide?.startedAt
            ? `${rideDate(historyRide.startedAt)}${historyRide.endedAt ? ` · ${clock(historyRide.endedAt)}` : ""}`
            : id
        }
        back
        action={<StatusPill status={historyRideDetail?.safetyStatus || historyRide?.safetyStatus || "safe"} />}
      >
        {historyLoading ? <ScreenState kind="loading" title="Loading trip map" /> : null}
        {historyError ? <ScreenState kind="error" title="Trip map failed" body={historyError} /> : null}

        <View style={[styles.map, { borderColor: colors.line, backgroundColor: colors.mapBg }]}>
          {mapPosition ? (
            <RideMap
              route={drawLine ? routePoints : []}
              trail={drawLine ? routePoints : []}
              position={mapPosition}
              heading={0}
              destination={drawLine ? routePoints[routePoints.length - 1] : null}
              origin={origin}
              follow={false}
              deviceFix={null}
              onPan={() => undefined}
              onPressVehicle={() => undefined}
            />
          ) : (
            <View style={styles.mapEmpty}>
              <AppText variant="caption">No GPS for this trip</AppText>
            </View>
          )}
        </View>

        <View style={styles.block}>
          <View style={styles.chips}>
            <StatusChip
              label={historyRideDetail?.status || historyRide?.status || "trip"}
              tone={(historyRideDetail?.status || historyRide?.status) === "active" ? "ok" : "muted"}
            />
            <StatusChip
              label={`score ${historyRideDetail?.score ?? historyRide?.score ?? "—"}`}
              tone="muted"
            />
            <StatusChip label={`${historyRide?.alertCount ?? tripAlerts.length} alerts`} tone="muted" />
          </View>
          {mapPosition ? (
            <AppText variant="caption">{formatCoords(mapPosition)}</AppText>
          ) : null}
        </View>

        <AppText variant="strong" style={styles.section}>
          Alerts on this ride ({tripAlerts.length})
        </AppText>
        <AppText variant="caption" style={{ marginBottom: 8 }}>
          Alert list is for the ride id (not filtered by startedAt).
        </AppText>
        {tripAlerts.length === 0 ? (
          <ScreenState kind="empty" title="No alerts" body="Nothing recorded for this ride id yet." />
        ) : (
          tripAlerts.map((alert, index) => (
            <AlertTimelineItem
              key={alert.id}
              alert={alert}
              timeLabel={timeAgo(alert.at)}
              showLine={index < tripAlerts.length - 1}
              onAcknowledge={() => void acknowledge(alert.id)}
              onEvidence={() => router.push(`/evidence/${alert.id}`)}
            />
          ))
        )}
      </Page>
    );
  }

  const live = isLiveOpen;
  const route = past?.route ?? (liveMode && live ? liveGeo.route : simulatedRoute);
  const mapTrail = live ? (liveMode ? liveGeo.trail : trail) : past?.route ?? [];
  const mapPosition = past?.position ?? (live ? position : null);
  const mapHeading = past?.heading ?? (live ? heading : 0);

  return (
    <Page
      title={live ? (liveMode ? rideId : "Trip") : past!.destinationLabel}
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
            <StatusChip label={deviceOnline ? "online" : "offline"} tone={deviceOnline ? "ok" : "warn"} />
            <StatusChip label={publisherOnline ? "cam on" : "cam off"} tone={publisherOnline ? "ok" : "warn"} />
            <StatusChip label={`${score}`} tone={score >= 80 ? "ok" : "warn"} />
          </View>
        ) : null}
        <View style={styles.metrics}>
          <Metric
            label={live ? "Speed" : "Distance"}
            value={live ? formatSpeed(speed) : `${past!.distanceKm.toFixed(1)} km`}
          />
          <Metric label={live ? "ETA" : "From"} value={live ? formatEta(eta) : past!.originLabel} />
          <Metric label="Shared" value={String(sharing.length)} />
        </View>
        {live ? (
          <AppText variant="caption" numberOfLines={1}>
            {shareLink || deviceId}
          </AppText>
        ) : null}
      </View>

      {live && liveMode ? (
        <View style={{ marginTop: 18, gap: 10 }}>
          <AppText variant="strong">Seats</AppText>
          <SeatOccupancyGrid seats={seats} awaitingWhenEmpty />
        </View>
      ) : null}

      <AppText variant="strong" style={styles.section}>
        Alerts ({tripAlerts.length})
      </AppText>
      {tripAlerts.length === 0 ? (
        <ScreenState kind="empty" title="No alerts" body="Nothing recorded on this ride yet." />
      ) : (
        tripAlerts.map((alert, index) => (
          <AlertTimelineItem
            key={alert.id}
            alert={alert}
            timeLabel={timeAgo(alert.at)}
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
  mapEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
