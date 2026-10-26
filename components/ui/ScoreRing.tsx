import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";

import { AppText } from "@/components/ui/AppText";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useTheme } from "@/providers/ThemeProvider";
import type { Palette } from "@/constants/theme";
import type { SafetyStatus } from "@/types/domain";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const labelFor: Record<SafetyStatus, string> = {
  safe: "Safe",
  caution: "Caution",
  emergency: "Emergency",
};

export function statusColor(colors: Palette, status: SafetyStatus) {
  if (status === "emergency") return colors.danger;
  if (status === "caution") return colors.amber;
  return colors.signal;
}

export function ScoreRing({
  index,
  status,
  size = 58,
  caption,
}: {
  index: number;
  status: SafetyStatus;
  size?: number;
  caption?: string;
}) {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const stroke = 3.5;
  const radius = (size - stroke) / 2 - 1;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const progress = useSharedValue(0);
  const color = statusColor(colors, status);

  useEffect(() => {
    const next = Math.max(0, Math.min(100, index)) / 100;
    progress.value = reduceMotion ? next : withTiming(next, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [index, progress, reduceMotion]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: `${progress.value * circumference} ${circumference}`,
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        center: {
          ...StyleSheet.absoluteFill,
          alignItems: "center",
          justifyContent: "center",
        },
        value: {
          fontSize: 16,
          fontVariant: ["tabular-nums"],
        },
      }),
    [],
  );

  return (
    <View style={{ width: caption ? 84 : size, alignItems: "center" }} accessibilityLabel={`Safety score ${index}, ${labelFor[status]}`}>
      <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke={colors.lineStrong} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          animatedProps={animatedProps}
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
      {caption ? (
        <AppText variant="label" style={{ marginTop: 4, textAlign: "center", color: colors.inkMuted, lineHeight: 14 }}>
          {caption}
        </AppText>
      ) : null}
    </View>
  );
}

export function StatusPill({ status }: { status: SafetyStatus }) {
  const { colors } = useTheme();
  const color = statusColor(colors, status);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: colors.bgSoft,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <AppText variant="caption" style={{ color }}>
        {labelFor[status]}
      </AppText>
    </View>
  );
}

export const safetyLabel = labelFor;
