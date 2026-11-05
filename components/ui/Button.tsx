import { useMemo, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { AppText } from "@/components/ui/AppText";
import { radius } from "@/constants/theme";
import { useTheme } from "@/providers/ThemeProvider";
import { selectionFeedback } from "@/utils/haptics";

type Tone = "lime" | "ghost" | "danger" | "quiet";

type Props = {
  label: string;
  onPress: () => void;
  tone?: Tone;
  disabled?: boolean;
  testID?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({ label, onPress, tone = "lime", disabled = false, testID }: Props) {
  const { colors, scheme } = useTheme();
  const scale = useSharedValue(1);

  // "lime" tone is remapped to monochrome primary — keeps call sites working.
  const isPrimary = tone === "lime";
  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          minHeight: 50,
          borderRadius: radius.lg,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 18,
          overflow: "hidden",
        },
        primary: {
          backgroundColor: colors.primary,
        },
        ghost: {
          backgroundColor: "transparent",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.lineStrong,
        },
        danger: { backgroundColor: colors.danger },
        quiet: { backgroundColor: colors.bgSoft },
        disabled: { opacity: 0.4 },
        label: { fontSize: 16, letterSpacing: -0.2 },
        primaryLabel: { color: colors.onPrimary },
        dangerLabel: { color: colors.onDanger },
        ghostLabel: { color: colors.ink },
      }),
    [colors],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 18, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 280 });
      }}
      onPress={() => {
        void selectionFeedback();
        onPress();
      }}
      style={[
        styles.base,
        isPrimary && styles.primary,
        tone === "ghost" && styles.ghost,
        tone === "danger" && styles.danger,
        tone === "quiet" && styles.quiet,
        disabled && styles.disabled,
        animatedStyle,
      ]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={
            scheme === "dark"
              ? ["#FFFFFF", "#E8E8ED"]
              : ["#2C2C2E", "#1C1C1E"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <AppText
        variant="strong"
        style={[
          styles.label,
          isPrimary && styles.primaryLabel,
          tone === "danger" && styles.dangerLabel,
          (tone === "ghost" || tone === "quiet") && styles.ghostLabel,
        ]}
      >
        {label}
      </AppText>
    </AnimatedPressable>
  );
}

export function IconButton({
  label,
  onPress,
  children,
  testID,
  glass = true,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
  testID?: string;
  glass?: boolean;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        host: {
          width: 46,
          height: 46,
          borderRadius: 23,
          overflow: "hidden",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.glassBorder,
          backgroundColor: glass ? colors.glass : colors.bgRaised,
          alignItems: "center",
          justifyContent: "center",
        },
      }),
    [colors, glass],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityLabel={label}
      accessibilityRole="button"
      onPressIn={() => {
        scale.value = withSpring(0.92, { damping: 18, stiffness: 340 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 280 });
      }}
      onPress={() => {
        void selectionFeedback();
        onPress();
      }}
      style={[styles.host, animatedStyle]}
    >
      {glass ? <BlurView intensity={36} tint={colors.blurTint} style={StyleSheet.absoluteFill} /> : null}
      {glass ? (
        <LinearGradient
          colors={[...colors.cardGradient]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View>{children}</View>
    </AnimatedPressable>
  );
}
