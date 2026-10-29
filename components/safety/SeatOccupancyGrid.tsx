import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { CABIN_SEAT_SLOTS } from "@/constants/liveMap";
import { useTheme } from "@/providers/ThemeProvider";
import type { Seat } from "@/types/domain";

type Props = {
  seats: Seat[];
  /** When the API returns an empty seats array, show labeled slots as awaiting. */
  awaitingWhenEmpty?: boolean;
};

export function SeatOccupancyGrid({ seats, awaitingWhenEmpty = false }: Props) {
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

  const rows =
    seats.length > 0
      ? seats.map((seat) => ({
          id: seat.id,
          label: seat.label,
          value: seat.occupied ? "In" : "Empty",
          occupied: seat.occupied,
          muted: false,
        }))
      : awaitingWhenEmpty
        ? CABIN_SEAT_SLOTS.map((seat) => ({
            id: seat.id,
            label: seat.label,
            value: "Awaiting",
            occupied: false,
            muted: true,
          }))
        : [];

  if (rows.length === 0) return null;

  return (
    <View style={styles.grid}>
      {rows.map((seat) => (
        <View key={seat.id} style={[styles.seat, seat.occupied && styles.occupied]}>
          <AppText variant="caption" style={{ color: colors.inkMuted }}>
            {seat.label}
          </AppText>
          <AppText
            variant="strong"
            style={{ color: seat.occupied ? colors.signal : seat.muted ? colors.inkFaint : colors.ink }}
          >
            {seat.value}
          </AppText>
        </View>
      ))}
    </View>
  );
}
