import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { useCallback, useMemo, type RefObject } from "react";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { formatMetric } from "@/constants/liveMap";
import { vehiclePhotos } from "@/data/photos";
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
  const deviceId = useRideStore((state) => state.deviceId);
  const rideId = useRideStore((state) => state.rideId);
  const passengerName = useRideStore((state) => state.passengerName);
  const deviceState = useRideStore((state) => state.deviceState);
  const { colors } = useTheme();
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
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
      backgroundStyle={{ backgroundColor: colors.bgRaised, borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
      handleIndicatorStyle={{ backgroundColor: colors.lineStrong, width: 42 }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <AppText variant="title" style={styles.name}>
          {deviceId || "Vehicle"}
        </AppText>
        <AppText variant="body">
          {rideId}
          {passengerName ? ` · ${passengerName}` : ""} · {deviceState || "device"}
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
          {vehiclePhotos.map((photo) => (
            <Pressable
              key={photo.id}
              onPress={() => {
                sheetRef.current?.dismiss();
                router.push(`/vehicle/${deviceId}`);
              }}
              style={{ width: width * 0.72 }}
            >
              <Image
                source={photo.source}
                style={[styles.photo, { backgroundColor: colors.bgSoft }]}
                contentFit="cover"
                transition={200}
              />
              <AppText variant="caption" style={styles.caption}>
                {photo.caption}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.stats}>
          <Stat label="Speed" value={formatMetric(speed, "")} unit="km/h" />
          <Stat label="Safety" value={`${safety.index}`} unit={safety.status} />
          <Stat label="Device" value={deviceState || "—"} unit={deviceId} />
        </View>
        <Button
          label="Vehicle details"
          onPress={() => {
            sheetRef.current?.dismiss();
            router.push(`/vehicle/${deviceId}`);
          }}
        />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.statHost}>
      <Glass variant="card" radius={18}>
        <View style={styles.stat}>
          <AppText variant="label">{label}</AppText>
          <AppText variant="metric" numberOfLines={1} style={{ fontSize: 22 }}>
            {value}
          </AppText>
          <AppText variant="caption" numberOfLines={1}>
            {unit}
          </AppText>
        </View>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 12,
  },
  name: {
    marginTop: 4,
  },
  gallery: {
    gap: 12,
    paddingVertical: 8,
  },
  photo: {
    height: 188,
    borderRadius: 24,
  },
  caption: {
    marginTop: 8,
  },
  stats: {
    flexDirection: "row",
    gap: 10,
  },
  statHost: {
    flex: 1,
  },
  stat: {
    borderRadius: 18,
    padding: 12,
    gap: 2,
  },
});
