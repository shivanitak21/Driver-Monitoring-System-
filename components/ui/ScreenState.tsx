import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/providers/ThemeProvider";

type Kind = "loading" | "empty" | "offline" | "denied" | "error";

type Props = {
  kind: Kind;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ScreenState({ kind, title, body, actionLabel, onAction }: Props) {
  const { colors } = useTheme();
  const mark =
    kind === "error" ? colors.danger : kind === "loading" ? colors.signal : kind === "offline" ? colors.amber : colors.inkFaint;
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: "flex-start",
          paddingVertical: 28,
          paddingHorizontal: 4,
          gap: 8,
        },
        mark: {
          width: 28,
          height: 3,
          borderRadius: 2,
          marginBottom: 6,
        },
        body: {
          maxWidth: 320,
        },
        action: {
          marginTop: 12,
          minHeight: 44,
          paddingHorizontal: 16,
          borderRadius: 14,
          backgroundColor: colors.lime,
          alignItems: "center",
          justifyContent: "center",
        },
        actionLabel: {
          color: colors.limeInk,
          fontSize: 15,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap} testID={`state-${kind}`}>
      <View style={[styles.mark, { backgroundColor: mark }]} />
      <AppText variant="title">{title}</AppText>
      {body ? (
        <AppText variant="body" style={styles.body}>
          {body}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.action} accessibilityRole="button">
          <AppText variant="strong" style={styles.actionLabel}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
