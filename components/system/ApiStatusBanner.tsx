import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Glass } from "@/components/ui/Glass";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";
import { selectionFeedback } from "@/utils/haptics";

export function ApiStatusBanner({ onRetry }: { onRetry?: () => void }) {
  const liveMode = useRideStore((state) => state.liveMode);
  const connection = useRideStore((state) => state.connection);
  const connectionError = useRideStore((state) => state.connectionError);
  const { colors } = useTheme();

  if (!liveMode) return null;
  if (connection === "live" && !connectionError) return null;

  const title =
    connection === "connecting"
      ? "Connecting to guardian API"
      : connection === "error"
        ? "Guardian API unavailable"
        : connection === "degraded"
          ? "Live link degraded"
          : "API notice";

  return (
    <Glass variant="card" radius={18}>
      <View style={styles.banner} testID="api-status-banner">
        <View style={styles.copy}>
          <AppText variant="strong" style={{ fontSize: 13 }}>
            {title}
          </AppText>
          {connectionError ? (
            <AppText variant="caption" numberOfLines={3}>
              {connectionError}
            </AppText>
          ) : null}
        </View>
        {onRetry ? (
          <Pressable
            onPress={() => {
              void selectionFeedback();
              onRetry();
            }}
            accessibilityRole="button"
            hitSlop={8}
            style={[styles.retry, { backgroundColor: colors.bgSoft }]}
          >
            <AppText variant="caption" style={{ color: colors.ink }}>
              Retry
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  retry: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
