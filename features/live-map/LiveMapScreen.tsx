import { useMemo, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Bell, Car, LocateFixed, Phone, Video } from "@/components/ui/icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { MapErrorBoundary } from "@/components/map/MapErrorBoundary";
import { RideMap } from "@/components/map/RideMap";
import { SosButton } from "@/components/safety/SosButton";
import { IconButton } from "@/components/ui/Button";
import { AppText } from "@/components/ui/AppText";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { ScreenState } from "@/components/ui/ScreenState";
import { OfflineBanner } from "@/components/system/OfflineBanner";
import { theme } from "@/constants/theme";
import { timeAgo } from "@/constants/format";
import { VEHICLE_ID } from "@/data/fleet";
import { routeLine, shiftLine } from "@/data/route";
import { rideMeta, tripHeadline, useRideStore, useSafetyIndex } from "@/stores/useRideStore";

export function LiveMapScreen() {
  const insets = useSafeAreaInsets();
  const booting = useRideStore((state) => state.booting);
  const position = useRideStore((state) => state.position);
  const heading = useRideStore((state) => state.heading);
  const trail = useRideStore((state) => state.trail);
  const follow = useRideStore((state) => state.follow);
  const setFollow = useRideStore((state) => state.setFollow);
  const speed = useRideStore((state) => state.speedKmh);
  const eta = useRideStore((state) => state.etaMin);
  const leg = useRideStore((state) => state.leg);
  const deviceFix = useRideStore((state) => state.deviceFix);
  const routeShift = useRideStore((state) => state.routeShift);
  const alerts = useRideStore((state) => state.alerts);
  const startCall = useRideStore((state) => state.startCall);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const safety = useSafetyIndex();
  const askSos = useRideStore((state) => state.askSos);
  const headline = tripHeadline(leg, Boolean(routeShift));
  const route = useMemo(() => shiftLine(routeLine, routeShift), [routeShift]);
  const origin = route[0];
  const destination = route[route.length - 1];
  const openAlerts = alerts.filter((alert) => !alert.acknowledged);
  const urgent = openAlerts.some((alert) => alert.severity === "high" || alert.severity === "critical");
  const alertPreview = openAlerts.slice(0, 3);

  const openVehicle = () => router.push(`/vehicle/${VEHICLE_ID}`);

  return (
    <View style={styles.fill}>
      <View style={styles.mapHost}>
        <MapErrorBoundary>
          <RideMap
            route={route}
            trail={trail}
            position={position}
            heading={heading}
            destination={destination}
            origin={origin}
            follow={follow}
            deviceFix={deviceFix}
            onPan={() => setFollow(false)}
            onPressVehicle={openVehicle}
          />
        </MapErrorBoundary>

        <View style={[styles.locate, { top: Math.min(insets.top, 48) + 8 }]}>
          <IconButton label="Recenter on vehicle" testID="recenter" onPress={() => setFollow(true)}>
            <LocateFixed size={18} color={follow ? theme.lime : theme.ink} strokeWidth={1.75} />
          </IconButton>
        </View>

        <View style={[styles.alertSlot, { top: Math.min(insets.top, 48) + 8 }]}>
          <IconButton
            label="Alerts"
            testID="home-alerts"
            onPress={() => setAlertsOpen((open) => !open)}
          >
            <Bell size={18} color={theme.ink} strokeWidth={1.75} />
          </IconButton>
          {openAlerts.length > 0 ? (
            <View style={[styles.badge, urgent && styles.badgeUrgent]}>
              <AppText variant="caption" style={styles.badgeText}>
                {openAlerts.length}
              </AppText>
            </View>
          ) : null}
          {alertsOpen ? (
            <View style={styles.alertPanel}>
              {alertPreview.length === 0 ? (
                <AppText variant="caption">No open alerts</AppText>
              ) : (
                alertPreview.map((alert) => (
                  <Pressable
                    key={alert.id}
                    testID={`alert-chip-${alert.kind}`}
                    onPress={() => router.push("/alerts")}
                    style={styles.alertRow}
                  >
                    <AppText variant="strong" numberOfLines={1}>
                      {alert.title}
                    </AppText>
                    <AppText variant="caption">{timeAgo(alert.at)}</AppText>
                  </Pressable>
                ))
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.bannerSlot} pointerEvents="box-none">
          <OfflineBanner />
        </View>
      </View>

      <Animated.View entering={FadeInDown.duration(420)} style={styles.sheetHost}>
        <View style={styles.actions}>
          <MapAction testID="home-vehicle" label="Vehicle" onPress={openVehicle} icon={<Car size={18} color={theme.ink} strokeWidth={1.75} />} />
          <MapAction testID="home-video" label="Video" onPress={() => startCall("video")} icon={<Video size={18} color={theme.ink} strokeWidth={1.75} />} />
          <MapAction testID="home-audio" label="Audio" onPress={() => startCall("audio")} icon={<Phone size={18} color={theme.ink} strokeWidth={1.75} />} />
          <View style={styles.action}>
            <SosButton onPress={askSos} />
            <View style={styles.actionSpacer} />
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.sheetTop}>
            <View style={styles.flex}>
              <AppText variant="title" numberOfLines={1}>
                {rideMeta.passenger.name}
              </AppText>
              <AppText variant="caption" numberOfLines={1}>
                {headline.to} · Simulated
              </AppText>
            </View>
            <ScoreRing index={safety.index} status={safety.status} size={52} />
          </View>
          <View style={styles.metrics}>
            <Metric label="ETA" value={`${eta} min`} />
            <Metric label="Speed" value={`${speed} km/h`} />
          </View>
        </View>
      </Animated.View>

      {booting ? (
        <View style={styles.boot} testID="boot-overlay">
          <ScreenState kind="loading" title="Finding the ride" body="Placing the simulated BMW M5." />
        </View>
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
    <Pressable
      testID={testID}
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={styles.action}
    >
      <View style={styles.actionIcon}>{icon}</View>
      <AppText variant="caption">{label}</AppText>
    </Pressable>
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
  fill: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  mapHost: {
    flex: 1,
    minHeight: "68%",
    backgroundColor: theme.bg,
  },
  locate: {
    position: "absolute",
    left: 16,
  },
  alertSlot: {
    position: "absolute",
    right: 16,
    alignItems: "flex-end",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.lime,
  },
  badgeUrgent: {
    backgroundColor: theme.danger,
  },
  badgeText: {
    color: "#111111",
    fontSize: 9,
  },
  alertPanel: {
    marginTop: 8,
    width: 210,
    borderRadius: 16,
    padding: 12,
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.94)",
    borderWidth: 1,
    borderColor: theme.line,
  },
  alertRow: {
    gap: 2,
  },
  bannerSlot: {
    position: "absolute",
    left: 16,
    right: 72,
    bottom: 12,
  },
  sheetHost: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 6,
  },
  actions: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  action: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.bgRaised,
    borderWidth: 1,
    borderColor: theme.line,
  },
  actionSpacer: {
    height: 16,
  },
  sheet: {
    borderRadius: 20,
    backgroundColor: theme.bgRaised,
    borderWidth: 1,
    borderColor: theme.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  sheetTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  metrics: {
    flexDirection: "row",
    gap: 8,
  },
  metric: {
    flex: 1,
    gap: 2,
  },
  boot: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.bg,
    justifyContent: "center",
  },
});
