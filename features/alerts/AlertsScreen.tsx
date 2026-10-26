import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { AlertTimelineItem } from "@/components/alerts/AlertTimelineItem";
import { Page } from "@/components/layout/Page";
import { AppText } from "@/components/ui/AppText";
import { ScreenState } from "@/components/ui/ScreenState";
import { Segmented } from "@/components/ui/Segmented";
import { useOffline } from "@/components/system/OfflineBanner";
import { timeAgo } from "@/constants/format";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";

const filters = [
  { id: "open", label: "Open" },
  { id: "all", label: "All" },
  { id: "caution", label: "Caution" },
  { id: "emergency", label: "Emergency" },
];

export function AlertsScreen() {
  const alerts = useRideStore((state) => state.alerts);
  const acknowledge = useRideStore((state) => state.acknowledge);
  const acknowledgeAll = useRideStore((state) => state.acknowledgeAll);
  const offline = useOffline();
  const { colors } = useTheme();
  const [filter, setFilter] = useState("open");
  const openCount = alerts.filter((alert) => !alert.acknowledged).length;

  const visible = alerts.filter((alert) => {
    if (filter === "open") return !alert.acknowledged;
    if (filter === "caution") return alert.severity === "medium" || alert.severity === "low" || alert.severity === "info";
    if (filter === "emergency") return alert.severity === "high" || alert.severity === "critical";
    return true;
  });

  return (
    <Page
      title="Alerts"
      subtitle={openCount > 0 ? `${openCount} open` : "Nothing waiting"}
      action={
        <Pressable onPress={acknowledgeAll} accessibilityRole="button" hitSlop={8}>
          <AppText variant="caption" style={{ color: colors.signal }}>
            Clear
          </AppText>
        </Pressable>
      }
    >
      {offline ? (
        <View style={styles.offline}>
          <ScreenState kind="offline" title="Alerts are on this phone" body="The list stays available without a connection." />
        </View>
      ) : null}
      <View style={styles.filters}>
        <Segmented items={filters} value={filter} onChange={setFilter} />
      </View>
      {visible.length === 0 ? (
        <ScreenState
          kind="empty"
          title="Nothing here"
          body="Open events show up as the ride continues."
          actionLabel="Show all"
          onAction={() => setFilter("all")}
        />
      ) : (
        <View>
          {visible.map((alert, index) => (
            <AlertTimelineItem
              key={alert.id}
              alert={alert}
              timeLabel={timeAgo(alert.at)}
              showLine={index < visible.length - 1}
              onAcknowledge={() => acknowledge(alert.id)}
              onEvidence={alert.evidenceId ? () => router.push(`/evidence/${alert.id}`) : undefined}
            />
          ))}
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  offline: { marginBottom: 8 },
  filters: { marginBottom: 18 },
});
