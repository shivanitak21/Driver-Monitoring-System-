import { useEffect, useMemo } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/providers/ThemeProvider";
import { selectionFeedback } from "@/utils/haptics";

type Item = { id: string; label: string };

export function Segmented({
  items,
  value,
  onChange,
}: {
  items: Item[];
  value: string;
  onChange: (id: string) => void;
}) {
  const { colors } = useTheme();
  const index = Math.max(
    0,
    items.findIndex((item) => item.id === value),
  );
  const trackWidth = useSharedValue(0);
  const offset = useSharedValue(0);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        bar: {
          flexDirection: "row",
          padding: 3,
          borderRadius: 16,
          backgroundColor: colors.bgSoft,
          position: "relative",
        },
        thumb: {
          position: "absolute",
          top: 3,
          bottom: 3,
          borderRadius: 13,
          backgroundColor: colors.bgRaised,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        },
        item: {
          flex: 1,
          minHeight: 40,
          borderRadius: 13,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 2,
          zIndex: 1,
        },
      }),
    [colors],
  );

  useEffect(() => {
    const segment = trackWidth.value / Math.max(items.length, 1);
    if (segment <= 0) return;
    offset.value = withSpring(index * segment, {
      damping: 22,
      stiffness: 260,
      mass: 0.7,
    });
  }, [index, items.length, offset, trackWidth]);

  const thumbStyle = useAnimatedStyle(() => {
    const segment = trackWidth.value / Math.max(items.length, 1);
    return {
      width: Math.max(segment - 0.5, 0),
      transform: [{ translateX: offset.value }],
    };
  });

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width - 6;
    trackWidth.value = next;
    const segment = next / Math.max(items.length, 1);
    offset.value = index * segment;
  };

  return (
    <View style={styles.bar} onLayout={onLayout}>
      <Animated.View style={[styles.thumb, thumbStyle]} pointerEvents="none" />
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              void selectionFeedback();
              onChange(item.id);
            }}
            style={styles.item}
          >
            <AppText
              variant="caption"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
              style={{
                width: "100%",
                textAlign: "center",
                fontSize: 13,
                lineHeight: 16,
                color: selected ? colors.ink : colors.inkMuted,
              }}
            >
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
