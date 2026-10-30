import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, router } from "expo-router";

import { Page } from "@/components/layout/Page";
import { AppText } from "@/components/ui/AppText";
import { ScreenState } from "@/components/ui/ScreenState";
import { Segmented } from "@/components/ui/Segmented";
import { PhotoOrbit } from "@/components/vehicle/PhotoOrbit";
import { vehiclePhotos } from "@/data/photos";
import { DEVICE_ID, VEHICLE_ID } from "@/data/fleet";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";

const exterior = vehiclePhotos[0];
const interiors = vehiclePhotos.slice(1);

/** Vehicle photos only. Live telemetry → Live. Cameras/seats → Cabin. */
export function VehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deviceId = useRideStore((state) => state.deviceId);
  const rideId = useRideStore((state) => state.rideId);
  const passengerName = useRideStore((state) => state.passengerName);
  const { colors } = useTheme();
  const [tab, setTab] = useState("exterior");
  const [interior, setInterior] = useState(0);

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
    <Page title={deviceId || DEVICE_ID} subtitle={passengerName || rideId} back>
      <View style={styles.tabs}>
        <Segmented
          value={tab}
          onChange={setTab}
          items={[
            { id: "exterior", label: "Exterior" },
            { id: "interior", label: "Interior" },
            { id: "model", label: "Orbit" },
          ]}
        />
      </View>

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
          <AppText variant="caption">Drag to orbit the exterior photo.</AppText>
        </View>
      ) : null}

      <AppText variant="caption" style={{ marginTop: 16 }}>
        Live map and speed are on Live. Cameras and seats are on Cabin.
      </AppText>
      <Pressable onPress={() => router.push("/cabin")} hitSlop={8} style={{ marginTop: 8 }}>
        <AppText variant="caption" style={{ color: colors.signal }}>
          Open Cabin
        </AppText>
      </Pressable>
    </Page>
  );
}

const styles = StyleSheet.create({
  tabs: { marginBottom: 14 },
  frame: { height: 360, borderRadius: 22, overflow: "hidden" },
  photo: { width: "100%", height: "100%" },
  dots: { position: "absolute", bottom: 14, alignSelf: "center", flexDirection: "row", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  model: { gap: 10 },
});
