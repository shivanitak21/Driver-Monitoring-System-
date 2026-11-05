import { useNetworkState } from "expo-network";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Glass } from "@/components/ui/Glass";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";

export function useOffline() {
  const network = useNetworkState();
  const override = useRideStore((state) => state.offlineOverride);
  return override || network.isConnected === false;
}

export function OfflineBanner() {
  const offline = useOffline();
  const { colors } = useTheme();
  if (!offline) return null;
  return (
    <Glass variant="pill" radius={999}>
      <View style={styles.banner} testID="offline-banner">
        <View style={[styles.dot, { backgroundColor: colors.inkFaint }]} />
        <AppText variant="caption" style={{ color: colors.ink }}>
          Offline
        </AppText>
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
