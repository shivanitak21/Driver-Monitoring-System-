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
  if (typeof value === "boolean") return value ? "Yes" : "No";
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
  emptyLabel = "Waiting for a reading",
}: {
  title: string;
  side: AnalysisSide | null | undefined;
  emptyLabel?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: { gap: 8 },
        card: {
          borderRadius: 18,
          backgroundColor: colors.bgRaised,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.line,
          overflow: "hidden",
        },
        row: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 11,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.line,
        },
        rowFirst: { borderTopWidth: 0 },
        empty: { paddingHorizontal: 14, paddingVertical: 14 },
      }),
    [colors],
  );

  const scene = side?.scene && side.scene !== "short" ? side.scene : null;
  const observations = Object.entries(side?.observations || {}).slice(0, 6);
  const summary = side ? (side.hazards.length ? side.hazards.join(", ") : "No hazards") : emptyLabel;

  return (
    <View style={styles.section}>
      <AppText variant="caption" style={{ paddingHorizontal: 4 }}>
        {title}
      </AppText>
      <View style={styles.card}>
        {!side ? (
          <View style={styles.empty}>
            <AppText variant="caption">{emptyLabel}</AppText>
          </View>
        ) : (
          <>
            <View style={[styles.row, styles.rowFirst]}>
              <AppText variant="strong" style={{ fontSize: 15, flex: 1 }} numberOfLines={2}>
                {summary}
              </AppText>
              {side.at ? <AppText variant="caption">{clock(side.at)}</AppText> : null}
            </View>
            {scene ? (
              <View style={styles.row}>
                <AppText variant="caption" style={{ flex: 1 }}>
                  {scene}
                </AppText>
              </View>
            ) : null}
            {observations.map(([key, value]) => (
              <View key={key} style={styles.row}>
                <AppText variant="caption" style={{ color: colors.inkMuted, flex: 1 }}>
                  {LABELS[key] || key}
                </AppText>
                <AppText variant="caption" style={{ flex: 1, textAlign: "right", color: colors.ink }}>
                  {formatValue(value)}
                </AppText>
              </View>
            ))}
          </>
        )}
      </View>
    </View>
  );
}
