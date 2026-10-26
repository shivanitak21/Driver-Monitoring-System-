import { StyleSheet, View } from "react-native";
import { Image, type ImageSource } from "expo-image";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { useTheme } from "@/providers/ThemeProvider";

export function PhotoOrbit({ source }: { source: ImageSource }) {
  const { colors } = useTheme();
  const yaw = useSharedValue(-12);
  const pitch = useSharedValue(6);
  const startYaw = useSharedValue(0);
  const startPitch = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      startYaw.value = yaw.value;
      startPitch.value = pitch.value;
    })
    .onUpdate((event) => {
      yaw.value = startYaw.value + event.translationX * 0.35;
      pitch.value = Math.min(16, Math.max(-6, startPitch.value + event.translationY * 0.08));
    })
    .onEnd(() => {
      pitch.value = withSpring(6);
    });

  const orbit = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${pitch.value}deg` },
      { rotateY: `${yaw.value}deg` },
    ],
  }));

  return (
    <View style={[styles.stage, { backgroundColor: colors.bgSoft }]}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.card, orbit]}>
          <Image source={source} style={styles.photo} contentFit="cover" transition={180} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: 360,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  card: {
    width: "78%",
    height: "78%",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0A0A0A",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
});
