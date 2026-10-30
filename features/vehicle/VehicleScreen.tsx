import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";

import { Page } from "@/components/layout/Page";
import { LiveStill } from "@/components/media/LiveStill";
import { SeatOccupancyGrid } from "@/components/safety/SeatOccupancyGrid";
import { ApiStatusBanner } from "@/components/system/ApiStatusBanner";
import { StatusChip } from "@/components/system/StatusChip";
import { AppText } from "@/components/ui/AppText";
import { ScreenState } from "@/components/ui/ScreenState";
import { Segmented } from "@/components/ui/Segmented";
import { PhotoOrbit } from "@/components/vehicle/PhotoOrbit";
import { formatCoords, formatSpeed } from "@/constants/liveMap";
import { vehiclePhotos } from "@/data/photos";
import { DEVICE_ID, VEHICLE_ID } from "@/data/fleet";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore, useSafetyIndex } from "@/stores/useRideStore";

const exterior = vehiclePhotos[0];
const interiors = vehiclePhotos.slice(1);

export function VehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const safety = useSafetyIndex();
  const speed = useRideStore((state) => state.speedKmh);
  const heading = useRideStore((state) => state.heading);
  const seats = useRideStore((state) => state.seats);
  const deviceState = useRideStore((state) => state.deviceState);
  const deviceId = useRideStore((state) => state.deviceId);
  const rideId = useRideStore((state) => state.rideId);
  const passengerName = useRideStore((state) => state.passengerName);
  const position = useRideStore((state) => state.position);
  const safetyStatus = useRideStore((state) => state.safetyStatus);
  const driverState = useRideStore((state) => state.driverState);
  const publisherOnline = useRideStore((state) => state.publisherOnline);
  const score = useRideStore((state) => state.score);
  const frameDms = useRideStore((state) => state.frameDms);
  const frameCms = useRideStore((state) => state.frameCms);
  const liveMode = useRideStore((state) => state.liveMode);
  const refreshAll = useRideStore((state) => state.refreshAll);
  const refreshFrames = useRideStore((state) => state.refreshFrames);
  const refreshing = useRideStore((state) => state.refreshing);
  const { colors } = useTheme();
  const [tab, setTab] = useState(liveMode ? "cameras" : "exterior");
  const [interior, setInterior] = useState(0);
  const deviceOnline = (deviceState || "").toLowerCase() === "online";

  useEffect(() => {
    if (!liveMode) return;
    void refreshFrames();
    const id = setInterval(() => void refreshFrames(), 5000);
    return () => clearInterval(id);
  }, [liveMode, refreshFrames]);

  const enrolledIds = new Set([deviceId, DEVICE_ID, VEHICLE_ID, "bmw-m5"].filter(Boolean));
  if (!enrolledIds.has(id)) {
    return (
      <Page title="Unknown vehicle" back>
        <ScreenState
          kind="error"
          title="This vehicle is not enrolled"
          body={`Only device ${deviceId || DEVICE_ID} on ride ${rideId} is enrolled.`}
        />
      </Page>
    );
  }

  return (
    <Page
      title={deviceId || DEVICE_ID}
      subtitle={`${rideId}${passengerName ? ` · ${passengerName}` : ""}${liveMode ? ` · ${deviceState || "device"}` : ""}`}
      back
      refreshing={liveMode ? refreshing : false}
      onRefresh={liveMode ? () => void refreshAll() : undefined}
    >
      {liveMode ? (
        <View style={{ marginBottom: 10, gap: 10 }}>
          <ApiStatusBanner onRetry={() => void refreshAll()} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <StatusChip label={safetyStatus} tone={safetyStatus === "safe" ? "ok" : safetyStatus === "caution" ? "warn" : "danger"} />
            <StatusChip label={deviceOnline ? "device online" : "device offline"} tone={deviceOnline ? "ok" : "warn"} />
            <StatusChip label={driverState} tone={driverState === "attentive" ? "ok" : "danger"} />
            <StatusChip label={publisherOnline ? "camera online" : "camera offline"} tone={publisherOnline ? "ok" : "warn"} />
            <StatusChip label={`score ${score}`} tone={score >= 80 ? "ok" : score >= 50 ? "warn" : "danger"} />
          </View>
          <AppText variant="caption">{formatCoords(position)}</AppText>
        </View>
      ) : null}

      <View style={styles.tabs}>
        <Segmented
          value={tab}
          onChange={setTab}
          items={[
            ...(liveMode ? [{ id: "cameras", label: "Live" }] : []),
            { id: "exterior", label: "Exterior" },
            { id: "interior", label: "Interior" },
            { id: "model", label: "Orbit" },
          ]}
        />
      </View>

      {tab === "cameras" && liveMode ? (
        <View style={{ gap: 12 }}>
          <LiveStill frame={frameDms} label="DMS · driver" height={200} />
          <LiveStill frame={frameCms} label="CMS · cabin" height={200} />
        </View>
      ) : null}

      {tab === "exterior" ? (
        <View style={[styles.frame, { backgroundColor: colors.bgSoft }]}>
          <Image source={exterior.source} style={styles.photo} contentFit="cover" transition={180} />
        </View>
      ) : null}

      {tab === "interior" ? (
        <View style={[styles.frame, { backgroundColor: colors.bgSoft }]}>
          <Image source={interiors[interior].source} style={styles.photo} contentFit="cover" transition={180} />
          <View style={styles.dots}>
            {interiors.map((photo, index) => (
              <Pressable
                key={photo.id}
                accessibilityLabel={photo.caption}
                onPress={() => setInterior(index)}
                style={[styles.dot, { backgroundColor: index === interior ? colors.ink : "rgba(255,255,255,0.45)" }]}
              />
            ))}
          </View>
        </View>
      ) : null}

      {tab === "model" ? (
        <View style={styles.model}>
          <PhotoOrbit source={exterior.source} />
          <AppText variant="caption">
            Drag to orbit the exterior photograph. No GLB is bundled, so this is not a 3D mesh.
          </AppText>
        </View>
      ) : null}

      <View style={styles.stats}>
        <Stat label="Speed" value={formatSpeed(speed)} />
        <Stat label="Heading" value={`${Math.round(heading)}°`} />
        <Stat label="Score" value={`${liveMode ? score : safety.index}`} />
      </View>
      <View style={styles.seats}>
        <AppText variant="strong" style={{ marginBottom: 10 }}>
          Seat occupancy
        </AppText>
        <SeatOccupancyGrid seats={seats} awaitingWhenEmpty={liveMode} />
      </View>
    </Page>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="label">{label}</AppText>
      <AppText variant="metric" style={{ fontSize: 22 }}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { marginBottom: 14 },
  frame: { height: 360, borderRadius: 22, overflow: "hidden" },
  photo: { width: "100%", height: "100%" },
  dots: { position: "absolute", bottom: 14, alignSelf: "center", flexDirection: "row", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  model: { gap: 10 },
  stats: { flexDirection: "row", gap: 12, marginTop: 18 },
  stat: { flex: 1, gap: 2 },
  seats: { marginTop: 18 },
});
