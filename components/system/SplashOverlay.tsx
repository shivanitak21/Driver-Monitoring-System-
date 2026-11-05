import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { AppText } from "@/components/ui/AppText";
import { useReduceMotion } from "@/hooks/useReduceMotion";

type Props = {
  onFinish: () => void;
};

/** Quiet monochrome splash — soft graphite gradient, silver mark. */
export function SplashOverlay({ onFinish }: Props) {
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(0);
  const mark = useSharedValue(0);
  const word = useSharedValue(0);
  const glow = useSharedValue(0.2);

  useEffect(() => {
    if (reduceMotion) {
      const timer = setTimeout(onFinish, 320);
      return () => clearTimeout(timer);
    }

    mark.value = withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) });
    word.value = withDelay(240, withTiming(1, { duration: 640, easing: Easing.out(Easing.cubic) }));
    glow.value = withDelay(
      160,
      withSequence(
        withTiming(0.55, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.28, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
    );
    progress.value = withDelay(
      1100,
      withTiming(1, { duration: 480, easing: Easing.inOut(Easing.quad) }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
  }, [glow, mark, onFinish, progress, reduceMotion, word]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: mark.value,
    transform: [{ scale: interpolate(mark.value, [0, 1], [0.88, 1]) }],
  }));

  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    transform: [{ translateY: interpolate(word.value, [0, 1], [10, 0]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: interpolate(glow.value, [0.2, 0.55], [0.94, 1.06]) }],
  }));

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0]),
  }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.host, fadeStyle]}>
      <LinearGradient
        colors={["#141416", "#050506", "#000000"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.glow, glowStyle]} />
      <View style={styles.center}>
        <Animated.View style={[styles.mark, markStyle]}>
          <LinearGradient colors={["#3A3A3C", "#1C1C1E"]} style={styles.ring}>
            <View style={styles.core} />
          </LinearGradient>
        </Animated.View>
        <Animated.View style={wordStyle}>
          <AppText variant="display" style={styles.brand}>
            VMS
          </AppText>
          <AppText variant="caption" style={styles.tag}>
            Cabin intelligence
          </AppText>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    zIndex: 100,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  center: {
    alignItems: "center",
    gap: 28,
  },
  mark: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
  },
  core: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#F5F5F7",
  },
  brand: {
    color: "#F5F5F7",
    textAlign: "center",
    letterSpacing: 6,
    fontSize: 40,
  },
  tag: {
    marginTop: 8,
    textAlign: "center",
    color: "#8E8E93",
    letterSpacing: 2,
    textTransform: "uppercase",
    fontSize: 11,
  },
});
