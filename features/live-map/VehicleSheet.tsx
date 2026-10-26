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
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore, useSafetyIndex } from "@/stores/useRideStore";

type Props = {
  sheetRef: RefObject<BottomSheetModal | null>;
};

export function VehicleSheet({ sheetRef }: Props) {
  const snapPoints = useMemo(() => ["78%"], []);
  const { width } = useWindowDimensions();
  const safety = useSafetyIndex();
  const speed = useRideStore((state) => state.speedKmh);
  const { colors } = useTheme();
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
      backgroundStyle={{ backgroundColor: colors.bgRaised, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
      handleIndicatorStyle={{ backgroundColor: colors.lineStrong, width: 42 }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
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
              <Image source={photo.source} style={[styles.photo, { backgroundColor: colors.bgSoft }]} contentFit="cover" transition={200} />
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
        <Button
          label="Vehicle details"
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
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.bg, borderColor: colors.line }]}>
      <AppText variant="label">{label}</AppText>
      <AppText variant="metric">{value}</AppText>
      <AppText variant="caption">{unit}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    gap: 2,
  },
});
