import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { clock } from "@/constants/format";
import { useTheme } from "@/providers/ThemeProvider";
import type { AnalysisSide } from "@/types/domain";

const LABELS: Record<string, string> = {
  handsOnWheel: "Hands on wheel",
  gaze: "Gaze",
  viewBlocked: "View blocked",
  lighting: "Lighting",
  cameraBlocked: "Camera blocked",
  childUnattended: "Child unattended",
  aggression: "Mood",
  weaponOrSmoke: "Weapon / smoke",
  occupants: "Occupants",
};

function formatValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number" || typeof value === "string") return String(value);
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "—";
    return entries.map(([key, item]) => `${key} ${formatValue(item)}`).join(" · ");
  }
  return String(value);
}

export function AnalysisPanel({
  title,
  side,
  emptyLabel = "Waiting for analysis…",
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
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.bgRaised,
          padding: 14,
          gap: 8,
        },
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

  const scene = side.scene && side.scene !== "short" ? side.scene : null;
  const observations = Object.entries(side.observations || {}).slice(0, 6);

  return (
    <View style={styles.card}>
      <AppText variant="strong">{title}</AppText>
      {scene ? <AppText variant="body">{scene}</AppText> : null}
      <AppText variant="caption">
        {side.hazards.length ? side.hazards.join(", ") : "No hazards"}
        {side.at ? ` · ${clock(side.at)}` : ""}
      </AppText>
      {observations.map(([key, value]) => (
        <View key={key} style={styles.obsRow}>
          <AppText variant="caption" style={{ color: colors.inkMuted, flex: 1 }}>
            {LABELS[key] || key}
          </AppText>
          <AppText variant="caption" style={{ flex: 1.2, textAlign: "right" }}>
            {formatValue(value)}
          </AppText>
        </View>
      ))}
    </View>
  );
}
