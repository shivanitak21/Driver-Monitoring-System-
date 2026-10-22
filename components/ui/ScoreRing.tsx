import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { AppText } from "@/components/ui/AppText";
import { theme } from "@/constants/theme";
import type { SafetyStatus } from "@/types/domain";

const colorFor: Record<SafetyStatus, string> = {
  safe: theme.lime,
  caution: theme.ink,
  emergency: theme.danger,
};

const labelFor: Record<SafetyStatus, string> = {
  safe: "Safe",
  caution: "Caution",
  emergency: "Emergency",
};

export function ScoreRing({ index, status, size = 58 }: { index: number; status: SafetyStatus; size?: number }) {
  const stroke = 3;
  const radius = (size - stroke) / 2 - 1;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, index)) / 100) * circumference;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }} accessibilityLabel={`Safety index ${index}, ${labelFor[status]}`}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.line}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colorFor[status]}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.center}>
        <AppText variant="strong" style={styles.value}>
          {index}
        </AppText>
      </View>
    </View>
  );
}

export function StatusPill({ status }: { status: SafetyStatus }) {
  return (
    <View style={[styles.pill, { borderColor: colorFor[status] }]}>
      <View style={[styles.dot, { backgroundColor: colorFor[status] }]} />
      <AppText variant="caption" style={{ color: colorFor[status] }}>
        {labelFor[status]}
      </AppText>
    </View>
  );
}

export const safetyColor = colorFor;
export const safetyLabel = labelFor;

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 16,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(8,9,11,0.35)",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
