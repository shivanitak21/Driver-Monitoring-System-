import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { Haptics, impactFeedback } from "@/utils/haptics";

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
    scale.value = withRepeat(withTiming(1.18, { duration: 1500 }), -1, true);
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
          void impactFeedback(Haptics.ImpactFeedbackStyle.Heavy);
          onPress();
        }}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: colors.danger,
            shadowColor: colors.danger,
            shadowOpacity: 0.45,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          },
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
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 27,
    opacity: 0.28,
  },
  button: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  label: {
    letterSpacing: 0.8,
    fontSize: 13,
  },
});
