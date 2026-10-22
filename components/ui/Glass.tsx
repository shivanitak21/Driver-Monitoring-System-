import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

import { theme } from "@/constants/theme";

type GlassProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  padded?: boolean;
};

export function Glass({ children, style, radius = 24, padded = false }: GlassProps) {
  return (
    <View style={[styles.shell, { borderRadius: radius }, style]}>
      <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.tint]} />
      <View style={[styles.content, padded && styles.padded]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: "rgba(12,13,15,0.45)",
  },
  tint: {
    backgroundColor: "rgba(8,9,11,0.58)",
  },
  content: {
    position: "relative",
  },
  padded: {
    padding: 16,
  },
});
