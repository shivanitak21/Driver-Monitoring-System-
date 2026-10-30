import { Pressable, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { statusColor } from "@/components/ui/ScoreRing";
import { useTheme } from "@/providers/ThemeProvider";
import type { SafetyAlert } from "@/types/domain";

type Props = {
  alert: SafetyAlert;
  timeLabel: string;
  showLine: boolean;
  onAcknowledge: () => void;
  onEvidence?: () => void;
};

export function AlertTimelineItem({ alert, timeLabel, showLine, onAcknowledge, onEvidence }: Props) {
  const { colors } = useTheme();
  const color = statusColor(
    colors,
    alert.severity === "critical" || alert.severity === "high"
      ? "emergency"
      : alert.severity === "medium"
        ? "caution"
        : "safe",
  );

  const meta = [
    alert.severity,
    alert.kind,
    alert.channel,
    alert.orinType,
    alert.confidence != null ? `conf ${Number(alert.confidence).toFixed(2)}` : null,
    alert.origin,
    alert.clipId ? "clip" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={{ flexDirection: "row", gap: 12 }} testID={`alert-${alert.kind}`}>
      <View style={{ width: 14, alignItems: "center" }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 6, backgroundColor: color }} />
        {showLine ? <View style={{ width: 1, flex: 1, backgroundColor: colors.line, marginVertical: 4 }} /> : null}
      </View>
      <View style={{ flex: 1, gap: 4, paddingBottom: 18, opacity: alert.acknowledged ? 0.72 : 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <AppText variant="strong" numberOfLines={2} style={{ flex: 1 }}>
            {alert.title}
          </AppText>
          <AppText variant="caption">{timeLabel}</AppText>
        </View>
        <AppText variant="caption">{alert.detail}</AppText>
        <AppText variant="caption" style={{ color: colors.inkMuted }}>
          {meta}
        </AppText>
        {alert.locationLabel ? (
          <AppText variant="caption" style={{ color: colors.inkMuted }}>
            {alert.locationLabel}
            {alert.coordinate?.latitude != null && alert.coordinate?.longitude != null
              ? ` · ${alert.coordinate.latitude.toFixed(5)}, ${alert.coordinate.longitude.toFixed(5)}`
              : ""}
          </AppText>
        ) : null}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          {onEvidence ? (
            <Pressable onPress={onEvidence} accessibilityRole="button" hitSlop={8}>
              <AppText variant="caption" style={{ color: colors.ink }}>
                {alert.clipId ? "Open clip" : "Details"}
              </AppText>
            </Pressable>
          ) : (
            <View />
          )}
          <Pressable disabled={alert.acknowledged} onPress={onAcknowledge} accessibilityRole="button" hitSlop={8}>
            <AppText variant="caption" style={{ color: alert.acknowledged ? colors.inkFaint : colors.signal }}>
              {alert.acknowledged ? "Acknowledged" : "Acknowledge"}
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
