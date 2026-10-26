import { useNetworkState } from "expo-network";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
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
    <View style={[styles.banner, { borderColor: colors.line, backgroundColor: colors.glass }]} testID="offline-banner">
      <AppText variant="caption" style={{ color: colors.ink }}>
        Offline
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
