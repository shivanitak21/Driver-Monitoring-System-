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
import { timeAgo } from "@/constants/format";
import type { AlertStatusFilter } from "@/services/api/types";
import { useLiveApiRefresh } from "@/hooks/useLiveApiRefresh";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";

const filters = [
  { id: "open", label: "Open" },
  { id: "all", label: "All" },
  { id: "caution", label: "Caution" },
  { id: "emergency", label: "Emergency" },
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
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const openCount = useMemo(() => alerts.filter((alert) => !alert.acknowledged).length, [alerts]);

  const visible = useMemo(() => {
    return alerts.filter((alert) => {
      if (filter === "open") return !alert.acknowledged;
      if (filter === "caution") return alert.severity === "medium" || alert.severity === "low" || alert.severity === "info";
      if (filter === "emergency") return alert.severity === "high" || alert.severity === "critical";
      return true;
    });
  }, [alerts, filter]);

  const onRefresh = useCallback(() => {
    if (!liveMode) return;
    void (filter === "all" || filter === "open" || filter === "caution" || filter === "emergency"
      ? refreshAlerts(filter === "open" ? "open" : filter)
      : refreshAll());
  }, [filter, liveMode, refreshAlerts, refreshAll]);

  const onFilterChange = (id: string) => {
    const next = id as AlertStatusFilter | "open";
    setFilter(next);
    if (liveMode) {
      const status: AlertStatusFilter = next === "open" ? "open" : next;
      void refreshAlerts(status).catch(() => undefined);
    }
  };

  return (
    <Page
      title="Alerts"
      subtitle={openCount > 0 ? `${openCount} open` : "Nothing waiting"}
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
        <Segmented items={filters} value={filter} onChange={onFilterChange} />
      </View>
      {visible.length === 0 ? (
        <ScreenState
          kind="empty"
          title={liveMode ? "No alerts from the API" : "Nothing here"}
          body={
            liveMode
              ? filter === "all"
                ? "The guardian API returned an empty alerts list for this ride. New events appear over the live socket."
                : "Nothing matches this filter. Switch to All to confirm the API list."
              : "Open events show up as the ride continues."
          }
          actionLabel={filter === "all" ? undefined : "Show all"}
          onAction={filter === "all" ? undefined : () => onFilterChange("all")}
        />
      ) : (
        <View>
          {visible.map((alert, index) => (
            <AlertTimelineItem
              key={alert.id}
              alert={alert}
              timeLabel={timeAgo(alert.at)}
              showLine={index < visible.length - 1}
              onAcknowledge={() => {
                setActionError(null);
                void acknowledge(alert.id).catch((error: Error) => setActionError(error.message));
              }}
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
  banner: { marginBottom: 10 },
  filters: { marginBottom: 18 },
});
