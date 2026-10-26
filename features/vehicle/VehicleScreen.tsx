import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";

import { Page } from "@/components/layout/Page";
import { SeatOccupancyGrid } from "@/components/safety/SeatOccupancyGrid";
import { AppText } from "@/components/ui/AppText";
import { ScreenState } from "@/components/ui/ScreenState";
import { Segmented } from "@/components/ui/Segmented";
import { PhotoOrbit } from "@/components/vehicle/PhotoOrbit";
import { vehiclePhotos } from "@/data/photos";
import { VEHICLE_ID, initialSeats, vehicleProfile } from "@/data/fleet";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore, useSafetyIndex } from "@/stores/useRideStore";

const exterior = vehiclePhotos[0];
const interiors = vehiclePhotos.slice(1);

export function VehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const safety = useSafetyIndex();
  const speed = useRideStore((state) => state.speedKmh);
  const heading = useRideStore((state) => state.heading);
  const { colors } = useTheme();
  const [tab, setTab] = useState("exterior");
  const [interior, setInterior] = useState(0);

  if (id !== VEHICLE_ID) {
    return (
      <Page title="Unknown vehicle" back>
        <ScreenState kind="error" title="This vehicle is not enrolled" body="Only the BMW M5 on this ride is enrolled." />
      </Page>
    );
  }

  return (
    <Page
      title={vehicleProfile.name}
      subtitle={`${vehicleProfile.trim} · ${vehicleProfile.color} · ${vehicleProfile.plate}`}
      back
    >
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
          <AppText variant="caption">
            Drag to orbit the exterior photograph. No GLB is bundled, so this is not a 3D mesh.
          </AppText>
        </View>
      ) : null}

      <View style={styles.stats}>
        <Stat label="Speed" value={`${speed} km/h`} />
        <Stat label="Heading" value={`${Math.round(heading)}°`} />
        <Stat label="Safety score" value={`${safety.index}`} />
      </View>
      <View style={styles.seats}>
        <SeatOccupancyGrid seats={initialSeats} />
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
