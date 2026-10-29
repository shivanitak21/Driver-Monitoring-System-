import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";

export function SosConfirm() {
  const open = useRideStore((state) => state.sosPrompt);
  const cancel = useRideStore((state) => state.cancelSos);
  const confirm = useRideStore((state) => state.confirmSos);
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open) return null;

  return (
    <View style={[styles.backdrop, { backgroundColor: colors.scrim }]} testID="sos-confirm">
      <Pressable style={StyleSheet.absoluteFill} onPress={busy ? undefined : cancel} />
      <View style={[styles.card, { backgroundColor: colors.bgRaised, borderColor: colors.line }]}>
        <AppText variant="title">Raise SOS for this ride</AppText>
        <AppText variant="body">
          People with sharing on are notified, and this ride is marked Emergency.
        </AppText>
        {error ? (
          <AppText variant="caption" style={{ color: colors.dangerSoft }}>
            {error}
          </AppText>
        ) : null}
        <View style={styles.row}>
          <View style={styles.flex}>
            <Button label="Cancel" tone="ghost" onPress={cancel} />
          </View>
          <View style={styles.flex}>
            <Button
              testID="sos-confirm-button"
              label={busy ? "Sending…" : "Raise SOS"}
              tone="danger"
              onPress={() => {
                setBusy(true);
                setError(null);
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                void confirm()
                  .catch((err: Error) => setError(err.message || "SOS failed"))
                  .finally(() => setBusy(false));
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    justifyContent: "flex-end",
    padding: 16,
    zIndex: 30,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    gap: 10,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  flex: {
    flex: 1,
  },
});
