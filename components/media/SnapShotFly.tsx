import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export type FlyRect = { x: number; y: number; width: number; height: number };

type Props = {
  uri: string;
  from: FlyRect;
  to: FlyRect;
  onDone: () => void;
};

/** iOS-style screenshot: flash, then the still shrinks into a small box. */
export function SnapShotFly({ uri, from, to, onDone }: Props) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const travel = useSharedValue(0);
  const flash = useSharedValue(0);
  const fromX = from.x;
  const fromY = from.y;
  const fromW = from.width;
  const fromH = from.height;
  const toX = to.x;
  const toY = to.y;
  const toW = to.width;
  const toH = to.height;

  useEffect(() => {
    flash.value = withSequence(withTiming(0.92, { duration: 70 }), withTiming(0, { duration: 220 }));
    travel.value = withDelay(
      50,
      withTiming(1, { duration: 560, easing: Easing.bezier(0.22, 0.85, 0.24, 1) }, (finished) => {
        if (finished) runOnJS(finish)();
      }),
    );
    // Run once per mount. A new snap mounts a new flyer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    onDoneRef.current();
  }

  const shot = useAnimatedStyle(() => {
    const p = travel.value;
    const fromCx = fromX + fromW / 2;
    const fromCy = fromY + fromH / 2;
    const toCx = toX + toW / 2;
    const toCy = toY + toH / 2;
    const scale = fromW > 0 ? toW / fromW : 0.2;
    return {
      opacity: p > 0.97 ? 1 - (p - 0.97) / 0.03 : 1,
      transform: [
        { translateX: (toCx - fromCx) * p },
        { translateY: (toCy - fromCy) * p },
        { scale: 1 + (scale - 1) * p },
      ],
    };
  });

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.flash,
          { left: from.x, top: from.y, width: from.width, height: from.height },
          flashStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.shot,
          { left: from.x, top: from.y, width: from.width, height: from.height },
          shot,
        ]}
      >
        <Image source={{ uri }} style={styles.image} contentFit="cover" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flash: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
  },
  shot: {
    position: "absolute",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#111",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
