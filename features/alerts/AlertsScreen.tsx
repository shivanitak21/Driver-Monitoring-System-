import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { Page } from "@/components/layout/Page";
import { AppText } from "@/components/ui/AppText";
import { ScreenState } from "@/components/ui/ScreenState";
import { Segmented } from "@/components/ui/Segmented";
import { theme } from "@/constants/theme";
import { timeAgo } from "@/constants/format";
import { useOffline } from "@/components/system/OfflineBanner";
import { useRideStore } from "@/stores/useRideStore";
import type { Severity } from "@/types/domain";

const filters = [
  { id: "open", label: "Open" },
  { id: "all", label: "All" },
  { id: "caution", label: "Caution" },
  { id: "emergency", label: "Emergency" },
];

function tone(severity: Severity) {
  if (severity === "critical" || severity === "high") return theme.danger;
  if (severity === "medium") return theme.ink;
  return theme.lime;
}

export function AlertsScreen() {
  const alerts = useRideStore((state) => state.alerts);
  const acknowledge = useRideStore((state) => state.acknowledge);
  const acknowledgeAll = useRideStore((state) => state.acknowledgeAll);
  const offline = useOffline();
  const [filter, setFilter] = useState("open");

  const visible = alerts.filter((alert) => {
    if (filter === "open") return !alert.acknowledged;
    if (filter === "caution") return alert.severity === "medium" || alert.severity === "low" || alert.severity === "info";
    if (filter === "emergency") return alert.severity === "high" || alert.severity === "critical";
    return true;
  });

  return (
    <Page
      title="Alerts"
      action={
        <Pressable onPress={acknowledgeAll} accessibilityRole="button">
          <AppText variant="caption" style={{ color: theme.lime }}>
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
        <View style={styles.timeline}>
          {visible.map((alert, index) => (
            <View key={alert.id} style={styles.item} testID={`alert-${alert.kind}`}>
              <View style={styles.rail}>
                <View style={[styles.dot, { backgroundColor: tone(alert.severity) }]} />
                {index < visible.length - 1 ? <View style={styles.line} /> : null}
              </View>
              <View style={styles.copy}>
                <View style={styles.row}>
                  <AppText variant="strong" numberOfLines={1} style={styles.flex}>
                    {alert.title}
                  </AppText>
                  <AppText variant="caption">{timeAgo(alert.at)}</AppText>
                </View>
                <AppText variant="caption" numberOfLines={2}>
                  {alert.detail}
                </AppText>
                <View style={styles.row}>
                  {alert.evidenceId ? (
                    <Pressable onPress={() => router.push(`/evidence/${alert.id}`)} accessibilityRole="button">
                      <AppText variant="caption" style={{ color: theme.ink }}>
                        Evidence
                      </AppText>
                    </Pressable>
                  ) : (
                    <View />
                  )}
                  <Pressable
                    disabled={alert.acknowledged}
                    onPress={() => acknowledge(alert.id)}
                    accessibilityRole="button"
                  >
                    <AppText variant="caption" style={{ color: alert.acknowledged ? theme.inkFaint : theme.lime }}>
                      {alert.acknowledged ? "Acknowledged" : "Acknowledge"}
                    </AppText>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  offline: {
    marginBottom: 8,
  },
  filters: {
    marginTop: 8,
    marginBottom: 16,
  },
  timeline: {
    gap: 0,
  },
  item: {
    flexDirection: "row",
    gap: 12,
  },
  rail: {
    width: 14,
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  line: {
    width: 1,
    flex: 1,
    backgroundColor: theme.line,
    marginVertical: 4,
  },
  copy: {
    flex: 1,
    gap: 4,
    paddingBottom: 18,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  flex: {
    flex: 1,
  },
});
