import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { theme } from "@/constants/theme";

type Kind = "loading" | "empty" | "offline" | "denied" | "error";

type Props = {
  kind: Kind;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

const kicker: Record<Kind, string> = {
  loading: "Acquiring",
  empty: "Nothing here",
  offline: "Offline",
  denied: "Permission",
  error: "Interrupted",
};

export function ScreenState({ kind, title, body, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap} testID={`state-${kind}`}>
      <View style={[styles.mark, kind === "error" && styles.markDanger, kind === "loading" && styles.markLime]} />
      <AppText variant="label">{kicker[kind]}</AppText>
      <AppText variant="title" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="body" style={styles.body}>
        {body}
      </AppText>
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

const styles = StyleSheet.create({
  wrap: {
    alignItems: "flex-start",
    padding: 24,
    gap: 8,
  },
  mark: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.amber,
    marginBottom: 8,
  },
  markDanger: {
    backgroundColor: theme.danger,
  },
  markLime: {
    backgroundColor: theme.lime,
  },
  title: {
    marginTop: 4,
  },
  body: {
    maxWidth: 320,
  },
  action: {
    marginTop: 12,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: theme.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    color: theme.limeInk,
    fontSize: 14,
  },
});
