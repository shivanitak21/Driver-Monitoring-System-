import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { Page } from "@/components/layout/Page";
import { RideMap } from "@/components/map/RideMap";
import { StatusChip } from "@/components/system/StatusChip";
import { AppText } from "@/components/ui/AppText";
import { ScreenState } from "@/components/ui/ScreenState";
import { StatusPill } from "@/components/ui/ScoreRing";
import { clock, rideDate } from "@/constants/format";
import { pastTrips } from "@/data/fleet";
import { useTheme } from "@/providers/ThemeProvider";
import { services } from "@/services/createServices";
import { useRideStore } from "@/stores/useRideStore";
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

/**
 * History trip map + summary only.
 * Live tracking → Live tab. Events → Alerts. Cameras → Cabin.
 */
export function TripDetailScreen() {
  const { id, startedAt: startedAtParam } = useLocalSearchParams<{ id: string; startedAt?: string }>();
  const startedAtMs = startedAtParam && startedAtParam !== "" ? Number(startedAtParam) : null;
  const liveMode = useRideStore((state) => state.liveMode);
  const rideId = useRideStore((state) => state.rideId);
  const history = useRideStore((state) => state.history);
  const { colors } = useTheme();

  const isLiveOpen = id === rideId && (startedAtMs == null || !Number.isFinite(startedAtMs));
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
    const at = startedAtMs != null && Number.isFinite(startedAtMs) ? startedAtMs : historyRide?.startedAt;
    void services.api
      .getRide(id, at)
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

  // Active ride opened without startedAt → send people to the right tabs (no duplicate Live/Alerts UI)
  if (liveMode && isLiveOpen) {
    return (
      <Page title={rideId} subtitle="Active trip" back>
        <ScreenState
          kind="empty"
          title="This trip is live"
          body="Tracking is on Live. Cabin cameras are on Cabin. Events are on Alerts."
          actionLabel="Open Live"
          onAction={() => router.replace("/")}
        />
        <View style={styles.links}>
          <LinkRow label="Cabin cameras" onPress={() => router.push("/cabin")} colors={colors} />
          <LinkRow label="Alerts" onPress={() => router.push("/alerts")} colors={colors} />
        </View>
      </Page>
    );
  }

  if (!liveMode && past) {
    return (
      <Page title={past.destinationLabel} subtitle={rideDate(past.startedAt)} back action={<StatusPill status={past.safetyStatus} />}>
        <View style={[styles.map, { borderColor: colors.line, backgroundColor: colors.mapBg }]}>
          <RideMap
            route={past.route}
            trail={past.route}
            position={past.position}
            heading={past.heading}
            destination={past.route[past.route.length - 1]}
            origin={past.route[0]}
            follow={false}
            deviceFix={null}
            onPan={() => undefined}
            onPressVehicle={() => undefined}
          />
        </View>
        <AppText variant="caption" style={{ marginTop: 12 }}>
          {past.distanceKm.toFixed(1)} km · offline copy on this phone
        </AppText>
      </Page>
    );
  }

  if (!historyRide) {
    return (
      <Page title="Missing trip" back>
        <ScreenState kind="error" title="Trip not found" body="Open a row from Past rides." />
      </Page>
    );
  }

  const routePoints = usableRoute(
    (historyRideDetail?.route as Coordinate[] | undefined) ||
      ([historyRide.start, historyRide.end].filter(Boolean) as Coordinate[]),
  );
  const mapPosition =
    (historyRideDetail?.position?.latitude != null && historyRideDetail?.position?.longitude != null
      ? {
          latitude: historyRideDetail.position.latitude as number,
          longitude: historyRideDetail.position.longitude as number,
        }
      : null) ||
    historyRide.end ||
    routePoints[routePoints.length - 1] ||
    null;
  const origin = historyRide.start || routePoints[0] || null;
  const drawLine = routePoints.length >= 2;

  return (
    <Page
      title={historyRide.passenger || historyRide.id}
      subtitle={
        historyRide.startedAt
          ? `${rideDate(historyRide.startedAt)}${historyRide.endedAt ? ` · ended ${clock(historyRide.endedAt)}` : ""}`
          : historyRide.id
      }
      back
      action={<StatusPill status={historyRideDetail?.safetyStatus || historyRide.safetyStatus} />}
    >
      {historyLoading ? <ScreenState kind="loading" title="Loading route" /> : null}
      {historyError ? <ScreenState kind="error" title="Route failed" body={historyError} /> : null}

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

      <View style={styles.meta}>
        <View style={styles.chips}>
          <StatusChip
            label={historyRideDetail?.status || historyRide.status}
            tone={(historyRideDetail?.status || historyRide.status) === "active" ? "ok" : "muted"}
          />
          <StatusChip label={`score ${historyRideDetail?.score ?? historyRide.score}`} tone="muted" />
          <StatusChip label={`${historyRide.alertCount} alerts`} tone="muted" />
        </View>
        <Pressable onPress={() => router.push("/alerts")} hitSlop={8}>
          <AppText variant="caption" style={{ color: colors.signal }}>
            View events on Alerts
          </AppText>
        </Pressable>
      </View>
    </Page>
  );
}

function LinkRow({
  label,
  onPress,
  colors,
}: {
  label: string;
  onPress: () => void;
  colors: { signal: string; line: string };
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.line,
      }}
    >
      <AppText variant="strong" style={{ color: colors.signal }}>
        {label}
      </AppText>
    </Pressable>
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
  meta: {
    marginTop: 16,
    gap: 12,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  links: {
    marginTop: 8,
  },
});
