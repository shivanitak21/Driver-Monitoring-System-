import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { AppText } from "@/components/ui/AppText";
import { theme } from "@/constants/theme";

export function SosButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.18, { duration: 1400 }), -1, true);
  }, [scale]);

  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 2 - scale.value,
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.pulse, ring]} />
      <Pressable
        testID="sos-button"
        accessibilityLabel="Raise SOS"
        accessibilityRole="button"
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          onPress();
        }}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <AppText variant="strong" style={styles.label}>
          SOS
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,59,48,0.28)",
  },
  button: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.danger,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  label: {
    color: "#FFFFFF",
    letterSpacing: 0.4,
    fontSize: 12,
  },
});
