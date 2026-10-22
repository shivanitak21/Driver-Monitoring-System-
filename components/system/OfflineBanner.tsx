import { useNetworkState } from "expo-network";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { theme } from "@/constants/theme";
import { useRideStore } from "@/stores/useRideStore";

export function useOffline() {
  const network = useNetworkState();
  const override = useRideStore((state) => state.offlineOverride);
  return override || network.isConnected === false;
}

export function OfflineBanner() {
  const offline = useOffline();
  if (!offline) return null;
  return (
    <View style={styles.banner} testID="offline-banner">
      <AppText variant="caption" style={styles.text}>
        Offline · simulated ride
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    color: theme.ink,
  },
});
