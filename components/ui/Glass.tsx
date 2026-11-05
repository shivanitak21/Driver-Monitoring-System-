import { ReactNode, useMemo } from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import { elevation, radius as radii } from "@/constants/theme";
import { useTheme } from "@/providers/ThemeProvider";

type GlassVariant = "default" | "float" | "card" | "sheet" | "pill";

type GlassProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  padded?: boolean;
  intensity?: number;
  variant?: GlassVariant;
  border?: boolean;
};

const VARIANT_RADIUS: Record<GlassVariant, number> = {
  default: radii.lg,
  float: radii.xl,
  card: radii.lg,
  sheet: radii.xxl,
  pill: radii.pill,
};

const VARIANT_ELEVATION: Record<GlassVariant, ViewStyle | undefined> = {
  default: undefined,
  float: elevation.float,
  card: elevation.card,
  sheet: elevation.float,
  pill: elevation.soft,
};

export function Glass({
  children,
  style,
  radius,
  padded = false,
  intensity,
  variant = "default",
  border = true,
}: GlassProps) {
  const { colors, scheme } = useTheme();
  const resolvedRadius = radius ?? VARIANT_RADIUS[variant];
  const blurIntensity = intensity ?? (scheme === "dark" ? 48 : 62);
  const elev = VARIANT_ELEVATION[variant];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        host: {
          borderRadius: resolvedRadius,
          ...(elev ?? null),
        },
        shell: {
          overflow: "hidden",
          borderRadius: resolvedRadius,
          borderWidth: border ? StyleSheet.hairlineWidth : 0,
          borderColor: colors.glassBorder,
          backgroundColor: Platform.OS === "android" ? colors.glass : "transparent",
        },
        tint: {
          backgroundColor: colors.glassTint,
        },
        content: {
          position: "relative",
        },
        padded: {
          padding: 16,
        },
      }),
    [border, colors, elev, resolvedRadius],
  );

  return (
    <View style={[styles.host, style]}>
      <View style={styles.shell}>
        <BlurView intensity={blurIntensity} tint={colors.blurTint} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={[...colors.cardGradient]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, styles.tint]} />
        <View style={[styles.content, padded && styles.padded]}>{children}</View>
      </View>
    </View>
  );
}
