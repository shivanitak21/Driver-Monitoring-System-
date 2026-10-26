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
  if (!open) return null;

  return (
    <View style={[styles.backdrop, { backgroundColor: colors.scrim }]} testID="sos-confirm">
      <Pressable style={StyleSheet.absoluteFill} onPress={cancel} />
      <View style={[styles.card, { backgroundColor: colors.bgRaised, borderColor: colors.line }]}>
        <AppText variant="title">Raise SOS for this ride</AppText>
        <AppText variant="body">
          People with sharing on are notified, and this ride is marked Emergency.
        </AppText>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Button label="Cancel" tone="ghost" onPress={cancel} />
          </View>
          <View style={styles.flex}>
            <Button
              testID="sos-confirm-button"
              label="Raise SOS"
              tone="danger"
              onPress={() => {
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                void confirm();
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
