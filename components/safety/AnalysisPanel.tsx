import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { clock } from "@/constants/format";
import { useTheme } from "@/providers/ThemeProvider";
import type { AnalysisSide } from "@/types/domain";

function formatValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number" || typeof value === "string") return String(value);
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "—";
    return entries.map(([key, item]) => `${key}: ${formatValue(item)}`).join(" · ");
  }
  return String(value);
}

export function AnalysisPanel({
  title,
  side,
  emptyLabel = "No analysis yet from the API.",
}: {
  title: string;
  side: AnalysisSide | null | undefined;
  emptyLabel?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: 22,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.bgRaised,
          padding: 16,
          gap: 10,
        },
        row: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        },
        chip: {
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.line,
          paddingHorizontal: 10,
          paddingVertical: 5,
          backgroundColor: colors.bgSoft,
        },
        obs: { gap: 6 },
        obsRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 12,
        },
      }),
    [colors],
  );

  if (!side) {
    return (
      <View style={styles.card}>
        <AppText variant="strong">{title}</AppText>
        <AppText variant="caption">{emptyLabel}</AppText>
      </View>
    );
  }

  const observations = Object.entries(side.observations || {});

  return (
    <View style={styles.card}>
      <AppText variant="strong">{title}</AppText>
      <AppText variant="body">{side.scene || "No scene text."}</AppText>
      <AppText variant="caption">
        confidence {Number.isFinite(side.confidence) ? side.confidence.toFixed(2) : "—"}
        {side.at ? ` · ${clock(side.at)}` : ""}
      </AppText>

      {side.hazards.length > 0 ? (
        <View style={styles.row}>
          {side.hazards.map((hazard) => (
            <View key={hazard} style={styles.chip}>
              <AppText variant="caption" style={{ color: colors.danger }}>
                {hazard}
              </AppText>
            </View>
          ))}
        </View>
      ) : (
        <AppText variant="caption">No hazards reported</AppText>
      )}

      {side.suppressed.length > 0 ? (
        <AppText variant="caption">Suppressed: {side.suppressed.join(", ")}</AppText>
      ) : null}

      {observations.length > 0 ? (
        <View style={styles.obs}>
          {observations.map(([key, value]) => (
            <View key={key} style={styles.obsRow}>
              <AppText variant="caption" style={{ color: colors.inkMuted, flex: 1 }}>
                {key}
              </AppText>
              <AppText variant="caption" style={{ flex: 1.4, textAlign: "right" }}>
                {formatValue(value)}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
