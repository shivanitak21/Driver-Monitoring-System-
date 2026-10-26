import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/providers/ThemeProvider";
import type { Seat } from "@/types/domain";

export function SeatOccupancyGrid({ seats }: { seats: Seat[] }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        grid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
        },
        seat: {
          flexGrow: 1,
          flexBasis: "46%",
          minHeight: 72,
          borderRadius: 18,
          paddingHorizontal: 14,
          paddingVertical: 12,
          justifyContent: "space-between",
          backgroundColor: colors.bgRaised,
          borderWidth: 1,
          borderColor: colors.line,
        },
        occupied: {
          backgroundColor: colors.limeSoft,
          borderColor: colors.lineStrong,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.grid}>
      {seats.map((seat) => (
        <View key={seat.id} style={[styles.seat, seat.occupied && styles.occupied]}>
          <AppText variant="caption" style={{ color: colors.inkMuted }}>
            {seat.label}
          </AppText>
          <AppText variant="strong" style={{ color: seat.occupied ? colors.signal : colors.ink }}>
            {seat.occupied ? "In" : "Empty"}
          </AppText>
        </View>
      ))}
    </View>
  );
}
