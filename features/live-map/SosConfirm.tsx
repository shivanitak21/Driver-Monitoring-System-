import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Haptics, notificationFeedback } from "@/utils/haptics";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";

export function SosConfirm() {
  const open = useRideStore((state) => state.sosPrompt);
  const cancel = useRideStore((state) => state.cancelSos);
  const confirm = useRideStore((state) => state.confirmSos);
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open) return null;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(180)}
      style={styles.backdrop}
      testID="sos-confirm"
    >
      <BlurView intensity={28} tint={colors.blurTint} style={StyleSheet.absoluteFill} />
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]} onPress={busy ? undefined : cancel} />
      <Animated.View
        entering={reduceMotion ? undefined : FadeInDown.springify().damping(18)}
        style={[styles.card, { backgroundColor: colors.bgRaised, borderColor: colors.glassBorder }]}
      >
        <View style={[styles.accent, { backgroundColor: colors.danger }]} />
        <AppText variant="title" style={{ fontSize: 26 }}>
          Raise SOS for this ride
        </AppText>
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
                void notificationFeedback(Haptics.NotificationFeedbackType.Warning);
                void confirm()
                  .catch((err: Error) => setError(err.message || "SOS failed"))
                  .finally(() => setBusy(false));
              }}
            />
          </View>
        </View>
      </Animated.View>
    </Animated.View>
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
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 22,
    gap: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  accent: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
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
