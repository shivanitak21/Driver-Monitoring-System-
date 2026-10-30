import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { AlertTimelineItem } from "@/components/alerts/AlertTimelineItem";
import { Page } from "@/components/layout/Page";
import { ApiStatusBanner } from "@/components/system/ApiStatusBanner";
import { AppText } from "@/components/ui/AppText";
import { ScreenState } from "@/components/ui/ScreenState";
import { Segmented } from "@/components/ui/Segmented";
import { useOffline } from "@/components/system/OfflineBanner";
import { clock, timeAgo } from "@/constants/format";
import type { AlertStatusFilter } from "@/services/api/types";
import { useLiveApiRefresh } from "@/hooks/useLiveApiRefresh";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";
import type { MediaChannel } from "@/types/domain";

const statusFilters = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "caution", label: "Caution" },
  { id: "emergency", label: "Emergency" },
];

const channelFilters = [
  { id: "all", label: "Both" },
  { id: "dms", label: "Driver" },
  { id: "cms", label: "Cabin" },
];

export function AlertsScreen() {
  useLiveApiRefresh("alerts");
  const alerts = useRideStore((state) => state.alerts);
  const acknowledge = useRideStore((state) => state.acknowledge);
  const acknowledgeAll = useRideStore((state) => state.acknowledgeAll);
  const liveMode = useRideStore((state) => state.liveMode);
  const refreshing = useRideStore((state) => state.refreshing);
  const refreshAlerts = useRideStore((state) => state.refreshAlerts);
  const refreshAll = useRideStore((state) => state.refreshAll);
  const connectionError = useRideStore((state) => state.connectionError);
  const offline = useOffline();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<AlertStatusFilter | "open">(liveMode ? "all" : "open");
  const [channel, setChannel] = useState<"all" | MediaChannel>("all");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const openCount = useMemo(() => alerts.filter((alert) => !alert.acknowledged).length, [alerts]);

  const visible = useMemo(() => {
    const filtered = alerts.filter((alert) => {
      if (channel !== "all" && alert.channel !== channel) return false;
      if (filter === "open") return !alert.acknowledged;
      if (filter === "caution") return alert.severity === "medium" || alert.severity === "low" || alert.severity === "info";
      if (filter === "emergency") return alert.severity === "high" || alert.severity === "critical";
      return true;
    });
    return [...filtered].sort((a, b) => b.at - a.at);
  }, [alerts, channel, filter]);

  const onRefresh = useCallback(() => {
    if (!liveMode) return;
    void refreshAlerts("all");
  }, [liveMode, refreshAlerts]);

  const onFilterChange = (id: string) => {
    setFilter(id as AlertStatusFilter | "open");
  };

  const onChannelChange = (id: string) => {
    setChannel(id as "all" | MediaChannel);
  };

  return (
    <Page
      title="Alerts"
      subtitle={
        liveMode
          ? `${visible.length} shown · ${alerts.length} total · ${openCount} open`
          : openCount > 0
            ? `${openCount} open`
            : "Nothing waiting"
      }
      refreshing={refreshing}
      onRefresh={liveMode ? onRefresh : undefined}
      action={
        <Pressable
          onPress={() => {
            setBusy(true);
            setActionError(null);
            void acknowledgeAll()
              .catch((error: Error) => setActionError(error.message))
              .finally(() => setBusy(false));
          }}
          accessibilityRole="button"
          hitSlop={8}
          disabled={busy || openCount === 0}
        >
          <AppText variant="caption" style={{ color: openCount === 0 ? colors.inkFaint : colors.signal }}>
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

      <View style={styles.banner}>
        <ApiStatusBanner onRetry={() => void refreshAll()} />
      </View>

      {(actionError || connectionError) && liveMode ? (
        <AppText variant="caption" style={{ color: colors.dangerSoft, marginBottom: 10 }}>
          {actionError || connectionError}
        </AppText>
      ) : null}

      <View style={styles.filters}>
        <Segmented items={statusFilters} value={filter} onChange={onFilterChange} />
      </View>
      <View style={styles.filters}>
        <Segmented items={channelFilters} value={channel} onChange={onChannelChange} />
      </View>

      {visible.length === 0 ? (
        <ScreenState
          kind="empty"
          title={liveMode ? "No alerts from the API" : "Nothing here"}
          body={
            liveMode
              ? filter === "all" && channel === "all"
                ? "The guardian API returned an empty alerts list for this ride."
                : "Nothing matches these filters. Switch to All / Both to see every event."
              : "Open events show up as the ride continues."
          }
          actionLabel={filter === "all" && channel === "all" ? undefined : "Show all"}
          onAction={
            filter === "all" && channel === "all"
              ? undefined
              : () => {
                  onFilterChange("all");
                  onChannelChange("all");
                }
          }
        />
      ) : (
        <View>
          {visible.map((alert, index) => (
            <AlertTimelineItem
              key={alert.id}
              alert={alert}
              timeLabel={`${timeAgo(alert.at)} · ${clock(alert.at)}`}
              showLine={index < visible.length - 1}
              onAcknowledge={() => {
                setActionError(null);
                void acknowledge(alert.id).catch((error: Error) => setActionError(error.message));
              }}
              onEvidence={() => router.push(`/evidence/${alert.id}`)}
            />
          ))}
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  offline: { marginBottom: 8 },
  banner: { marginBottom: 10 },
  filters: { marginBottom: 12 },
});
