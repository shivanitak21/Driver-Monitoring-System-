import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, router } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";

import { Page } from "@/components/layout/Page";
import { AppText } from "@/components/ui/AppText";
import { Glass } from "@/components/ui/Glass";
import { ScreenState } from "@/components/ui/ScreenState";
import { Segmented } from "@/components/ui/Segmented";
import { PhotoOrbit } from "@/components/vehicle/PhotoOrbit";
import { vehiclePhotos } from "@/data/photos";
import { DEVICE_ID, VEHICLE_ID } from "@/data/fleet";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";
import { selectionFeedback } from "@/utils/haptics";

const exterior = vehiclePhotos[0];
const interiors = vehiclePhotos.slice(1);

/** Vehicle photos only. Live telemetry → Live. Cameras/seats → Cabin. */
export function VehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deviceId = useRideStore((state) => state.deviceId);
  const rideId = useRideStore((state) => state.rideId);
  const passengerName = useRideStore((state) => state.passengerName);
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
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
        <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(280)}>
          <Glass variant="card" radius={28}>
            <View style={[styles.frame, { backgroundColor: colors.bgSoft }]}>
              <Image source={exterior.source} style={styles.photo} contentFit="cover" transition={220} />
            </View>
          </Glass>
        </Animated.View>
      ) : null}

      {tab === "interior" ? (
        <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(280)}>
          <Glass variant="card" radius={28}>
            <View style={[styles.frame, { backgroundColor: colors.bgSoft }]}>
              <Image source={interiors[interior].source} style={styles.photo} contentFit="cover" transition={220} />
              <View style={styles.dots}>
                {interiors.map((photo, index) => (
                  <Pressable
                    key={photo.id}
                    accessibilityLabel={photo.caption}
                    onPress={() => setInterior(index)}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: index === interior ? "#F5F5F7" : "rgba(255,255,255,0.35)",
                        transform: [{ scale: index === interior ? 1.15 : 1 }],
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </Glass>
        </Animated.View>
      ) : null}

      {tab === "model" ? (
        <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(280)} style={styles.model}>
          <Glass variant="card" radius={28} padded>
            <PhotoOrbit source={exterior.source} />
            <AppText variant="caption" style={{ marginTop: 12 }}>
              Drag to orbit the exterior photo.
            </AppText>
          </Glass>
        </Animated.View>
      ) : null}

      <Glass variant="card" radius={22} style={{ marginTop: 16 }}>
        <View style={styles.note}>
          <AppText variant="caption">Live map and speed are on Live. Cameras and seats are on Cabin.</AppText>
          <Pressable
            onPress={() => {
              void selectionFeedback();
              router.push("/cabin");
            }}
            hitSlop={8}
            style={{ marginTop: 10 }}
          >
            <AppText variant="strong" style={{ color: colors.ink, fontSize: 15 }}>
              Open Cabin
            </AppText>
          </Pressable>
        </View>
      </Glass>
    </Page>
  );
}

const styles = StyleSheet.create({
  tabs: { marginBottom: 16 },
  frame: { height: 380, overflow: "hidden", borderRadius: 28 },
  photo: { width: "100%", height: "100%" },
  dots: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  model: { gap: 10 },
  note: { padding: 16 },
});
