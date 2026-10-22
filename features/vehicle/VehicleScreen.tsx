import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";

import { Page } from "@/components/layout/Page";
import { AppText } from "@/components/ui/AppText";
import { ScreenState } from "@/components/ui/ScreenState";
import { Segmented } from "@/components/ui/Segmented";
import { PhotoOrbit } from "@/components/vehicle/PhotoOrbit";
import { theme } from "@/constants/theme";
import { vehiclePhotos } from "@/data/photos";
import { VEHICLE_ID, initialSeats, vehicleProfile } from "@/data/fleet";
import { useRideStore, useSafetyIndex } from "@/stores/useRideStore";

const exterior = vehiclePhotos[0];
const interiors = vehiclePhotos.slice(1);

export function VehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const safety = useSafetyIndex();
  const speed = useRideStore((state) => state.speedKmh);
  const heading = useRideStore((state) => state.heading);
  const [tab, setTab] = useState("exterior");
  const [interior, setInterior] = useState(0);

  if (id !== VEHICLE_ID) {
    return (
      <Page title="Unknown vehicle" back>
        <ScreenState
          kind="error"
          title="This vehicle is not enrolled"
          body="The demo roster only includes the BMW M5 on the live ride."
        />
      </Page>
    );
  }

  return (
    <Page title={vehicleProfile.name} back>
      <AppText variant="caption">
        {vehicleProfile.trim} · {vehicleProfile.color} · {vehicleProfile.plate}
      </AppText>
      <View style={styles.tabs}>
        <Segmented
          value={tab}
          onChange={setTab}
          items={[
            { id: "exterior", label: "Exterior" },
            { id: "interior", label: "Interior" },
            { id: "model", label: "3D" },
          ]}
        />
      </View>

      {tab === "exterior" ? (
        <View style={styles.frame}>
          <Image source={exterior.source} style={styles.photo} contentFit="cover" transition={180} />
        </View>
      ) : null}

      {tab === "interior" ? (
        <View style={styles.frame}>
          <Image source={interiors[interior].source} style={styles.photo} contentFit="cover" transition={180} />
          <View style={styles.dots}>
            {interiors.map((photo, index) => (
              <Pressable
                key={photo.id}
                accessibilityLabel={photo.caption}
                onPress={() => setInterior(index)}
                style={[styles.dot, index === interior && styles.dotOn]}
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
        <Stat label="Score" value={`${safety.index}`} />
      </View>
      <View style={styles.seats}>
        {initialSeats.map((seat) => (
          <View key={seat.id} style={[styles.seat, seat.occupied && styles.seatOn]}>
            <AppText variant="caption" style={{ color: seat.occupied ? theme.limeInk : theme.inkMuted }}>
              {seat.label}
            </AppText>
          </View>
        ))}
      </View>
    </Page>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="label">{label}</AppText>
      <AppText variant="strong">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    marginTop: 14,
    marginBottom: 12,
  },
  frame: {
    height: 360,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: theme.bgSoft,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  dots: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotOn: {
    backgroundColor: theme.ink,
  },
  model: {
    gap: 10,
  },
  stats: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  seats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  seat: {
    width: "48%",
    minHeight: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.bgRaised,
  },
  seatOn: {
    backgroundColor: theme.lime,
    borderColor: theme.lime,
  },
});
