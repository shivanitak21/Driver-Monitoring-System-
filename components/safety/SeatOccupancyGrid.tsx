import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Glass } from "@/components/ui/Glass";
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
        seatHost: {
          flexGrow: 1,
          flexBasis: "46%",
        },
        seat: {
          minHeight: 84,
          paddingHorizontal: 14,
          paddingVertical: 14,
          justifyContent: "space-between",
          gap: 8,
        },
        occupiedDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.ink,
        },
        emptyDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.inkFaint,
          opacity: 0.5,
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
        <View key={seat.id} style={styles.seatHost}>
          <Glass
            variant="card"
            radius={20}
          >
            <View style={styles.seat}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <AppText variant="caption" style={{ color: colors.inkMuted }}>
                  {seat.label}
                </AppText>
                <View style={seat.occupied ? styles.occupiedDot : styles.emptyDot} />
              </View>
              <AppText
                variant="strong"
                style={{
                  color: seat.muted ? colors.inkFaint : colors.ink,
                  fontSize: 18,
                }}
              >
                {seat.value}
              </AppText>
            </View>
          </Glass>
        </View>
      ))}
    </View>
  );
}
