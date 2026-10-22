import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { useCallback, useMemo, type RefObject } from "react";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { vehiclePhotos } from "@/data/photos";
import { vehicleProfile } from "@/data/fleet";
import { theme } from "@/constants/theme";
import { services } from "@/services/createServices";
import { useRideStore, useSafetyIndex } from "@/stores/useRideStore";

type Props = {
  sheetRef: RefObject<BottomSheetModal | null>;
};

export function VehicleSheet({ sheetRef }: Props) {
  const snapPoints = useMemo(() => ["78%"], []);
  const { width } = useWindowDimensions();
  const safety = useSafetyIndex();
  const speed = useRideStore((state) => state.speedKmh);
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.55} />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheet}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <AppText variant="label">Simulated vehicle record</AppText>
        <AppText variant="title" style={styles.name}>
          {vehicleProfile.name}
        </AppText>
        <AppText variant="body">
          {vehicleProfile.trim} · {vehicleProfile.color} · {vehicleProfile.plate}
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
          {vehiclePhotos.map((photo) => (
            <Pressable
              key={photo.id}
              onPress={() => {
                sheetRef.current?.dismiss();
                router.push(`/vehicle/${vehicleProfile.id}`);
              }}
              style={{ width: width * 0.72 }}
            >
              <Image source={photo.source} style={styles.photo} contentFit="cover" transition={200} />
              <AppText variant="caption" style={styles.caption}>
                {photo.caption}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.stats}>
          <Stat label="Speed" value={`${speed}`} unit="km/h" />
          <Stat label="Cabin risk" value={`${safety.risk.score}`} unit={safety.risk.severity} />
          <Stat label="Index" value={`${safety.index}`} unit={safety.status} />
        </View>
        <AppText variant="caption">
          Photographs are the vehicle. No illustration is used in their place. {services.gps.describe()}
        </AppText>
        <Button
          label="Open vehicle studio"
          onPress={() => {
            sheetRef.current?.dismiss();
            router.push(`/vehicle/${vehicleProfile.id}`);
          }}
        />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="label">{label}</AppText>
      <AppText variant="metric">{value}</AppText>
      <AppText variant="caption">{unit}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: theme.bgRaised,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: {
    backgroundColor: "rgba(243,240,232,0.28)",
    width: 42,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 10,
  },
  name: {
    marginTop: 4,
  },
  gallery: {
    gap: 12,
    paddingVertical: 8,
  },
  photo: {
    height: 180,
    borderRadius: 20,
    backgroundColor: theme.bgSoft,
  },
  caption: {
    marginTop: 8,
  },
  stats: {
    flexDirection: "row",
    gap: 10,
  },
  stat: {
    flex: 1,
    backgroundColor: theme.bg,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.line,
    gap: 2,
  },
});
