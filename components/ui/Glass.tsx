import { ReactNode, useMemo } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

import { useTheme } from "@/providers/ThemeProvider";

type GlassProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  padded?: boolean;
  intensity?: number;
};

export function Glass({ children, style, radius = 22, padded = false, intensity = 36 }: GlassProps) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        shell: {
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.glass,
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
    [colors],
  );

  return (
    <View style={[styles.shell, { borderRadius: radius }, style]}>
      <BlurView intensity={intensity} tint={colors.blurTint} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.tint]} />
      <View style={[styles.content, padded && styles.padded]}>{children}</View>
    </View>
  );
}
