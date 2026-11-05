import { type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/providers/ThemeProvider";

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Use a softer top-lit wash (default) or a flatter sheet wash. */
  tone?: "screen" | "sheet";
};

/** Soft iOS-like atmospheric gradient behind content. */
export function ScreenGradient({ children, style, tone = "screen" }: Props) {
  const { colors } = useTheme();
  const stops = tone === "sheet" ? ([colors.bgRaised, colors.bg] as const) : colors.gradient;

  return (
    <View style={[styles.fill, style]}>
      <LinearGradient
        colors={[...stops]}
        locations={tone === "sheet" ? [0, 1] : [0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
