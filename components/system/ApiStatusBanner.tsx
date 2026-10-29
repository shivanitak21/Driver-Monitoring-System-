import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";

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
    <View
      style={[styles.banner, { borderColor: colors.line, backgroundColor: colors.glass }]}
      testID="api-status-banner"
    >
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
        <Pressable onPress={onRetry} accessibilityRole="button" hitSlop={8}>
          <AppText variant="caption" style={{ color: colors.signal }}>
            Retry
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  copy: { flex: 1, gap: 2 },
});
