import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";

import { AppText } from "@/components/ui/AppText";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useTheme } from "@/providers/ThemeProvider";
import { selectionFeedback } from "@/utils/haptics";

type Kind = "loading" | "empty" | "offline" | "denied" | "error";

type Props = {
  kind: Kind;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ScreenState({ kind, title, body, actionLabel, onAction }: Props) {
  const { colors, scheme } = useTheme();
  const reduceMotion = useReduceMotion();
  const mark =
    kind === "error"
      ? colors.danger
      : kind === "loading"
        ? colors.ink
        : colors.inkFaint;
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: "flex-start",
          paddingVertical: 32,
          paddingHorizontal: 4,
          gap: 10,
        },
        mark: {
          width: 28,
          height: 3,
          borderRadius: 2,
          marginBottom: 4,
        },
        body: {
          maxWidth: 320,
        },
        action: {
          marginTop: 14,
          minHeight: 46,
          paddingHorizontal: 18,
          borderRadius: 16,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.primary,
        },
        actionLabel: {
          color: colors.onPrimary,
          fontSize: 15,
        },
      }),
    [colors],
  );

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(280)}
      style={styles.wrap}
      testID={`state-${kind}`}
    >
      <View style={[styles.mark, { backgroundColor: mark }]} />
      <AppText variant="title" style={{ fontSize: 24 }}>
        {title}
      </AppText>
      {body ? (
        <AppText variant="body" style={styles.body}>
          {body}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={() => {
            void selectionFeedback();
            onAction();
          }}
          style={({ pressed }) => [styles.action, pressed && { opacity: 0.86, transform: [{ scale: 0.98 }] }]}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={scheme === "dark" ? ["#FFFFFF", "#E8E8ED"] : ["#2C2C2E", "#1C1C1E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <AppText variant="strong" style={styles.actionLabel}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}
