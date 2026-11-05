import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Glass } from "@/components/ui/Glass";
import { statusColor } from "@/components/ui/ScoreRing";
import { useTheme } from "@/providers/ThemeProvider";
import type { SafetyAlert } from "@/types/domain";
import { alertDescription, cameraLabel } from "@/utils/alerts";
import { selectionFeedback } from "@/utils/haptics";

type Props = {
  alert: SafetyAlert;
  timeLabel: string;
  showLine: boolean;
  onAcknowledge: () => void;
  onEvidence?: () => void;
};

export function AlertTimelineItem({ alert, timeLabel, showLine: _showLine, onAcknowledge, onEvidence }: Props) {
  const { colors } = useTheme();
  const color = statusColor(
    colors,
    alert.severity === "critical" || alert.severity === "high"
      ? "emergency"
      : alert.severity === "medium"
        ? "caution"
        : "safe",
  );

  const channel = cameraLabel(alert.channel);
  const description = alertDescription(alert);
  const meta = [
    alert.severity,
    alert.kind.replace(/_/g, " "),
    channel,
    alert.origin,
    alert.confidence != null ? `${Math.round(alert.confidence * 100)}%` : null,
    alert.clipId ? `clip ${alert.clipId}` : null,
    alert.acknowledged ? "acknowledged" : "open",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.wrap} testID={`alert-${alert.kind}`}>
      <Glass variant="card" radius={22}>
        <View style={[styles.card, alert.acknowledged && styles.acked]}>
          <View style={styles.head}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <AppText variant="strong" numberOfLines={1} style={styles.title}>
              {alert.title}
            </AppText>
            <AppText variant="caption">{timeLabel}</AppText>
          </View>
          <AppText variant="caption" style={styles.desc}>
            {description}
          </AppText>
          <AppText variant="caption" numberOfLines={2} style={{ color: colors.inkFaint }}>
            {meta}
          </AppText>
          {alert.detail?.trim() && alert.locationLabel?.trim() ? (
            <AppText variant="caption">{alert.locationLabel}</AppText>
          ) : null}
          <View style={styles.actions}>
            {onEvidence ? (
              <Pressable
                onPress={() => {
                  void selectionFeedback();
                  onEvidence();
                }}
                accessibilityRole="button"
                hitSlop={8}
                style={[styles.actionBtn, { backgroundColor: colors.bgSoft }]}
              >
                <AppText variant="caption" style={{ color: colors.ink }}>
                  {alert.clipId ? "Clip" : "Details"}
                </AppText>
              </Pressable>
            ) : (
              <View />
            )}
            <Pressable
              disabled={alert.acknowledged}
              onPress={() => {
                void selectionFeedback();
                onAcknowledge();
              }}
              accessibilityRole="button"
              hitSlop={8}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: colors.bgSoft,
                },
              ]}
            >
              <AppText
                variant="caption"
                style={{ color: alert.acknowledged ? colors.inkFaint : colors.ink }}
              >
                {alert.acknowledged ? "Done" : "Ack"}
              </AppText>
            </Pressable>
          </View>
        </View>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 10,
  },
  card: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  acked: {
    opacity: 0.72,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    flex: 1,
  },
  desc: {
    paddingLeft: 18,
  },
  actions: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    paddingLeft: 18,
  },
  actionBtn: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
