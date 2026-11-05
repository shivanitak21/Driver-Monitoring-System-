import { useMemo, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Bell, Car, LocateFixed, Settings, X } from "@/components/ui/icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";

import { useDockOffset } from "@/components/layout/DockTabBar";
import { MapErrorBoundary } from "@/components/map/MapErrorBoundary";
import { RideMap } from "@/components/map/RideMap";
import { SosButton } from "@/components/safety/SosButton";
import { ApiStatusBanner } from "@/components/system/ApiStatusBanner";
import { OfflineBanner } from "@/components/system/OfflineBanner";
import { IconButton } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { AppText } from "@/components/ui/AppText";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { ScreenGradient } from "@/components/ui/ScreenGradient";
import { ScreenState } from "@/components/ui/ScreenState";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { timeAgo } from "@/constants/format";
import {
  driverStateLabel,
  formatEta,
  formatSpeed,
  liveMapGeometry,
  rideStatusLabel,
} from "@/constants/liveMap";
import { routeLine, shiftLine } from "@/data/route";
import { useLiveApiRefresh } from "@/hooks/useLiveApiRefresh";
import { useTheme } from "@/providers/ThemeProvider";
import { rideMeta, tripHeadline, useRideStore, useSafetyIndex } from "@/stores/useRideStore";
import { hasAlertClip } from "@/utils/alerts";

export function LiveMapScreen() {
  useLiveApiRefresh("all");
  const insets = useSafeAreaInsets();
  const dock = useDockOffset();
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const booting = useRideStore((state) => state.booting);
  const liveMode = useRideStore((state) => state.liveMode);
  const connection = useRideStore((state) => state.connection);
  const connectionError = useRideStore((state) => state.connectionError);
  const passengerName = useRideStore((state) => state.passengerName);
  const deviceId = useRideStore((state) => state.deviceId);
  const rideId = useRideStore((state) => state.rideId);
  const deviceState = useRideStore((state) => state.deviceState);
  const publisherOnline = useRideStore((state) => state.publisherOnline);
  const score = useRideStore((state) => state.score);
  const rideStatus = useRideStore((state) => state.rideStatus);
  const driverState = useRideStore((state) => state.driverState);
  const position = useRideStore((state) => state.position);
  const positionFromApi = useRideStore((state) => state.positionFromApi);
  const heading = useRideStore((state) => state.heading);
  const trail = useRideStore((state) => state.trail);
  const apiRoute = useRideStore((state) => state.route);
  const follow = useRideStore((state) => state.follow);
  const setFollow = useRideStore((state) => state.setFollow);
  const speed = useRideStore((state) => state.speedKmh);
  const eta = useRideStore((state) => state.etaMin);
  const leg = useRideStore((state) => state.leg);
  const deviceFix = useRideStore((state) => state.deviceFix);
  const routeShift = useRideStore((state) => state.routeShift);
  const alerts = useRideStore((state) => state.alerts);
  const refreshAll = useRideStore((state) => state.refreshAll);
  const bootstrapLive = useRideStore((state) => state.bootstrapLive);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const safety = useSafetyIndex();
  const askSos = useRideStore((state) => state.askSos);
  const safetyStatus = useRideStore((state) => state.safetyStatus);
  const deviceOnline = (deviceState || "").toLowerCase() === "online";
  const statusLabel = liveMode
    ? rideStatusLabel({ safetyStatus, deviceState, speedKmh: speed })
    : tripHeadline(leg, Boolean(routeShift)).status;
  const headline = liveMode
    ? {
        status: statusLabel,
        to: deviceId || rideId,
        from: passengerName || "Passenger",
      }
    : tripHeadline(leg, Boolean(routeShift));
  const simulatedRoute = useMemo(() => shiftLine(routeLine, routeShift), [routeShift]);
  // Show last known coordinates while waiting for the first live GPS fix.
  // Without this, Live stays blank when the device is offline / positionFromApi is false.
  const mapPosition =
    position &&
    Number.isFinite(position.latitude) &&
    Number.isFinite(position.longitude)
      ? position
      : null;
  const liveGeo = useMemo(
    () =>
      mapPosition
        ? liveMapGeometry(mapPosition, apiRoute.length > 0 ? apiRoute : positionFromApi ? trail : [])
        : { route: [], trail: [] },
    [apiRoute, mapPosition, positionFromApi, trail],
  );
  const route = liveMode ? liveGeo.route : simulatedRoute;
  const mapTrail = liveMode ? liveGeo.trail : trail;
  const origin = liveMode ? null : simulatedRoute[0];
  const destination = liveMode ? null : simulatedRoute[simulatedRoute.length - 1];
  const openAlerts = alerts.filter((alert) => !alert.acknowledged && (!liveMode || hasAlertClip(alert)));
  const retry = () => {
    void (connection === "error" ? bootstrapLive() : refreshAll());
  };
  const urgent = openAlerts.some((alert) => alert.severity === "high" || alert.severity === "critical");
  const alertPreview = openAlerts.slice(0, 3);
  const openVehicle = () => router.push(`/vehicle/${deviceId || rideMeta.deviceId}`);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        fill: { flex: 1, backgroundColor: colors.mapBg },
        mapHost: { flex: 1, backgroundColor: colors.mapBg },
        top: {
          position: "absolute",
          left: 16,
          right: 16,
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
        },
        livePill: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingRight: 4,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: liveMode && !deviceOnline ? colors.inkFaint : colors.ink,
        },
        tools: {
          alignItems: "flex-end",
          gap: 10,
        },
        badge: {
          position: "absolute",
          top: -2,
          right: -2,
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          paddingHorizontal: 4,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: urgent ? colors.danger : colors.primary,
        },
        badgeText: {
          color: urgent ? colors.onDanger : colors.onPrimary,
          fontSize: 10,
        },
        alertBackdrop: {
          ...StyleSheet.absoluteFill,
          zIndex: 4,
        },
        alertPanel: {
          marginTop: 8,
          width: 236,
          gap: 10,
        },
        alertHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        },
        alertRow: { gap: 2, paddingVertical: 4 },
        sheetHost: {
          position: "absolute",
          left: 14,
          right: 14,
          gap: 10,
          zIndex: 3,
        },
        banners: {
          gap: 8,
          alignItems: "flex-start",
        },
        actions: {
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          paddingHorizontal: 10,
        },
        action: { flex: 1, alignItems: "center", gap: 6 },
        sheetTop: { flexDirection: "row", alignItems: "center", gap: 12 },
        flex: { flex: 1, gap: 3 },
        metrics: {
          flexDirection: "row",
          gap: 10,
          marginTop: 14,
          paddingTop: 14,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.line,
        },
        metric: { flex: 1, gap: 2 },
        boot: {
          ...StyleSheet.absoluteFill,
          justifyContent: "center",
          paddingHorizontal: 24,
        },
      }),
    [colors, liveMode, deviceOnline, urgent],
  );

  return (
    <View style={styles.fill}>
      <View style={styles.mapHost}>
        <MapErrorBoundary>
          {mapPosition ? (
            <RideMap
              route={route}
              trail={mapTrail}
              position={mapPosition}
              heading={heading}
              destination={destination}
              origin={origin}
              follow={follow}
              deviceFix={liveMode ? null : deviceFix}
              onPan={() => setFollow(false)}
              onPressVehicle={openVehicle}
            />
          ) : null}
        </MapErrorBoundary>

        {alertsOpen ? (
          <Pressable
            accessibilityLabel="Dismiss alerts"
            onPress={() => setAlertsOpen(false)}
            style={styles.alertBackdrop}
          />
        ) : null}

        <View style={[styles.top, { top: insets.top + 8, zIndex: 5 }]}>
          <Glass variant="float" radius={24} intensity={48}>
            <View style={styles.livePill}>
              <View style={{ paddingLeft: 14, paddingVertical: 12 }}>
                <View style={styles.dot} />
              </View>
              <View style={{ paddingRight: 16, paddingVertical: 10, gap: 2 }}>
                <AppText variant="strong" style={{ fontSize: 14 }}>
                  {liveMode
                    ? connection !== "live"
                      ? "Syncing"
                      : deviceOnline
                        ? publisherOnline
                          ? "Live tracking"
                          : "Live · cam off"
                        : "Device offline"
                    : "Live"}
                </AppText>
                <AppText variant="caption" numberOfLines={1}>
                  {passengerName || rideId}
                  {liveMode ? ` · ${rideStatus}` : ""}
                </AppText>
              </View>
            </View>
          </Glass>
          <View style={styles.tools}>
            <View>
              <IconButton
                label={alertsOpen ? "Close alerts" : "Alerts"}
                testID="home-alerts"
                onPress={() => setAlertsOpen((open) => !open)}
              >
                {alertsOpen ? (
                  <X size={18} color={colors.ink} strokeWidth={1.75} />
                ) : (
                  <Bell size={18} color={colors.ink} strokeWidth={1.75} />
                )}
              </IconButton>
              {!alertsOpen && openAlerts.length > 0 ? (
                <View style={styles.badge} pointerEvents="none">
                  <AppText variant="caption" style={styles.badgeText}>
                    {openAlerts.length}
                  </AppText>
                </View>
              ) : null}
            </View>
            <IconButton label="Settings" onPress={() => router.push("/settings")}>
              <Settings size={18} color={colors.ink} strokeWidth={1.75} />
            </IconButton>
            <IconButton label="Recenter on vehicle" testID="recenter" onPress={() => setFollow(true)}>
              <LocateFixed size={18} color={follow ? colors.ink : colors.inkMuted} strokeWidth={1.75} />
            </IconButton>
            {alertsOpen ? (
              <Animated.View entering={reduceMotion ? undefined : FadeInRight.duration(220)}>
                <Glass variant="card" radius={20} padded intensity={50}>
                  <View style={styles.alertPanel}>
                    <View style={styles.alertHeader}>
                      <AppText variant="strong">Open alerts</AppText>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Close alerts"
                        hitSlop={10}
                        onPress={() => setAlertsOpen(false)}
                      >
                        <AppText variant="caption" style={{ color: colors.ink }}>
                          Close
                        </AppText>
                      </Pressable>
                    </View>
                    {alertPreview.length === 0 ? (
                      <AppText variant="caption">
                        {liveMode ? "No alerts from the API" : "No open alerts"}
                      </AppText>
                    ) : (
                      alertPreview.map((alert) => (
                        <Pressable
                          key={alert.id}
                          testID={`alert-chip-${alert.kind}`}
                          onPress={() => {
                            setAlertsOpen(false);
                            router.push("/alerts");
                          }}
                          style={styles.alertRow}
                        >
                          <AppText variant="strong" numberOfLines={1}>
                            {alert.title}
                          </AppText>
                          <AppText variant="caption">{timeAgo(alert.at)}</AppText>
                        </Pressable>
                      ))
                    )}
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        setAlertsOpen(false);
                        router.push("/alerts");
                      }}
                      hitSlop={8}
                    >
                      <AppText variant="caption" style={{ color: colors.ink }}>
                        View all alerts
                      </AppText>
                    </Pressable>
                  </View>
                </Glass>
              </Animated.View>
            ) : null}
          </View>
        </View>

      </View>

      <Animated.View
        entering={reduceMotion ? undefined : FadeInDown.duration(480)}
        style={[styles.sheetHost, { bottom: dock - 6 }]}
        pointerEvents="box-none"
      >
        <View style={styles.banners} pointerEvents="box-none">
          <OfflineBanner />
          <ApiStatusBanner onRetry={retry} />
        </View>

        <View style={styles.actions}>
          <MapAction
            testID="home-vehicle"
            label="Vehicle"
            onPress={openVehicle}
            icon={<Car size={18} color={colors.ink} strokeWidth={1.75} />}
          />
          <View style={styles.action}>
            <SosButton onPress={askSos} />
          </View>
        </View>

        <Glass variant="sheet" radius={30} intensity={52}>
          <View style={{ paddingHorizontal: 18, paddingVertical: 16 }}>
            <View style={styles.sheetTop}>
              <View style={styles.flex}>
                <AppText variant="title" numberOfLines={1} style={{ fontSize: 22, lineHeight: 28 }}>
                  {passengerName}
                </AppText>
                <AppText variant="caption" numberOfLines={1}>
                  {liveMode
                    ? `${headline.status} · ${driverStateLabel(driverState)}`
                    : `${headline.status} · ${headline.to}`}
                </AppText>
              </View>
              <ScoreRing index={safety.index} status={safety.status} size={54} caption="Safety" />
            </View>
            <View style={styles.metrics}>
              <Metric label="ETA" value={formatEta(eta)} />
              <Metric label="Speed" value={formatSpeed(speed)} />
              <Metric label="Score" value={String(score)} />
            </View>
            {liveMode ? (
              <AppText variant="caption" numberOfLines={1} style={{ marginTop: 10 }}>
                {deviceOnline ? "Online" : "Offline"}
                {publisherOnline ? " · cam on" : " · cam off"}
              </AppText>
            ) : null}
          </View>
        </Glass>
      </Animated.View>

      {booting ? (
        <ScreenGradient style={styles.boot}>
          <View testID="boot-overlay">
            <ScreenState
              kind="loading"
              title={liveMode ? "Connecting to guardian API" : "Finding the ride"}
              body={liveMode ? `${rideId} · ${deviceId}` : "BMW M5"}
            />
          </View>
        </ScreenGradient>
      ) : null}

      {!booting && liveMode && connection === "error" ? (
        <ScreenGradient style={styles.boot}>
          <View testID="api-error-overlay">
            <ScreenState
              kind="error"
              title="Could not load the ride"
              body={connectionError ?? "Could not reach http://51.81.81.118:8000. Retry when the API is up."}
              actionLabel="Retry"
              onAction={retry}
            />
          </View>
        </ScreenGradient>
      ) : null}
    </View>
  );
}

function MapAction({
  label,
  onPress,
  icon,
  testID,
}: {
  label: string;
  onPress: () => void;
  icon: ReactNode;
  testID: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 6 }}>
      <IconButton testID={testID} label={label} onPress={onPress}>
        {icon}
      </IconButton>
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, gap: 3 }}>
      <AppText variant="label">{label}</AppText>
      <AppText variant="metric" numberOfLines={1} style={{ fontSize: 22 }}>
        {value}
      </AppText>
    </View>
  );
}
