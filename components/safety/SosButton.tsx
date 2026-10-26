import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { AppText } from "@/components/ui/AppText";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useTheme } from "@/providers/ThemeProvider";

export function SosButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      return;
    }
    scale.value = withRepeat(withTiming(1.16, { duration: 1400 }), -1, true);
  }, [reduceMotion, scale]);

  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: reduceMotion ? 0 : 2 - scale.value,
  }));

  return (
    <View style={styles.wrap}>
      {reduceMotion ? null : <Animated.View style={[styles.pulse, { backgroundColor: colors.danger }, ring]} />}
      <Pressable
        testID="sos-button"
        accessibilityLabel="Raise SOS"
        accessibilityRole="button"
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          onPress();
        }}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.danger },
          pressed && styles.pressed,
        ]}
      >
        <AppText variant="strong" style={[styles.label, { color: colors.onDanger }]}>
          SOS
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    opacity: 0.28,
  },
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  label: {
    letterSpacing: 0.6,
    fontSize: 13,
  },
});
