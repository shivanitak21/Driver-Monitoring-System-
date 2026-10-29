import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { Page } from "@/components/layout/Page";
import { AppText } from "@/components/ui/AppText";
import { ScreenState } from "@/components/ui/ScreenState";
import { clock } from "@/constants/format";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";

export function EvidenceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const alert = useRideStore((state) => state.alerts.find((item) => item.id === id));
  const liveMode = useRideStore((state) => state.liveMode);
  const { colors } = useTheme();

  if (!alert) {
    return (
      <Page title="Missing evidence" back>
        <ScreenState
          kind="error"
          title="This evidence is not stored"
          body="Open an alert from the Alerts list."
        />
      </Page>
    );
  }

  if (!alert.evidenceId) {
    return (
      <Page title={alert.title} subtitle="No evidence id" back>
        <ScreenState
          kind="empty"
          title="No evidence attached"
          body="This alert has timeline details only."
        />
      </Page>
    );
  }

  return (
    <Page title={alert.title} subtitle={`${clock(alert.at)} · ${alert.locationLabel || "Location unknown"}`} back>
      <View style={[styles.card, { backgroundColor: colors.bgRaised, borderColor: colors.line }]}>
        <AppText variant="strong">{alert.severity}</AppText>
        <AppText variant="body">{alert.detail}</AppText>
        <AppText variant="caption">
          {clock(alert.at)} · {alert.kind} · {alert.origin}
        </AppText>
        <AppText variant="caption">evidenceId: {alert.evidenceId}</AppText>
      </View>
      <ScreenState
        kind="empty"
        title="No media endpoint"
        body={
          liveMode
            ? "The guardian API stores evidenceId but does not expose a still or clip URL yet."
            : "Evidence media is not bundled for this event."
        }
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    marginBottom: 12,
  },
});
