import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { theme } from "@/constants/theme";
import { useRideStore } from "@/stores/useRideStore";

export function SosConfirm() {
  const open = useRideStore((state) => state.sosPrompt);
  const cancel = useRideStore((state) => state.cancelSos);
  const confirm = useRideStore((state) => state.confirmSos);
  if (!open) return null;

  return (
    <View style={styles.backdrop} testID="sos-confirm">
      <Pressable style={StyleSheet.absoluteFill} onPress={cancel} />
      <View style={styles.card}>
        <AppText variant="label">Incident</AppText>
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
    backgroundColor: "rgba(0,0,0,0.62)",
    justifyContent: "flex-end",
    padding: 16,
    zIndex: 30,
  },
  card: {
    backgroundColor: theme.bgRaised,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: theme.line,
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
