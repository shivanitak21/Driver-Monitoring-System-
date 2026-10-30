import { StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { Page } from "@/components/layout/Page";
import { TripHistoryCard } from "@/components/trips/TripHistoryCard";
import { ApiStatusBanner } from "@/components/system/ApiStatusBanner";
import { AppText } from "@/components/ui/AppText";
import { ScreenState } from "@/components/ui/ScreenState";
import { rideDate } from "@/constants/format";
import { pastTrips } from "@/data/fleet";
import { useLiveApiRefresh } from "@/hooks/useLiveApiRefresh";
import { useRideStore } from "@/stores/useRideStore";
import { historyTripKey } from "@/types/domain";

/** Past rides only. Live map → Live tab. Events → Alerts tab. */
export function TripsScreen() {
  useLiveApiRefresh("all");
  const liveMode = useRideStore((state) => state.liveMode);
  const rideId = useRideStore((state) => state.rideId);
  const history = useRideStore((state) => state.history);
  const refreshing = useRideStore((state) => state.refreshing);
  const refreshHistory = useRideStore((state) => state.refreshHistory);
  const refreshAll = useRideStore((state) => state.refreshAll);

  return (
    <Page
      title="Trips"
      subtitle={liveMode ? "Past rides for this device" : "Saved on this phone"}
      refreshing={refreshing}
      onRefresh={
        liveMode
          ? () => void refreshHistory().catch(() => refreshAll())
          : undefined
      }
    >
      <View style={{ marginBottom: 10 }}>
        <ApiStatusBanner onRetry={() => void refreshAll()} />
      </View>

      {liveMode ? (
        history.length === 0 ? (
          <ScreenState kind="empty" title="No past rides" body="Trips from GET /v1/history show here." />
        ) : (
          <>
            <AppText variant="caption" style={styles.hint}>
              Same ride id can appear more than once — each row is a trip keyed by start time.
            </AppText>
            {history.map((trip) => (
              <TripHistoryCard
                key={historyTripKey(trip)}
                title={trip.passenger || trip.id}
                meta={[
                  trip.status,
                  trip.startedAt ? rideDate(trip.startedAt) : null,
                  `score ${trip.score}`,
                  `${trip.alertCount} alerts`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                status={trip.safetyStatus}
                onPress={() => {
                  const qs =
                    trip.startedAt != null
                      ? `?startedAt=${encodeURIComponent(String(trip.startedAt))}`
                      : "";
                  router.push(`/trip/${trip.id}${qs}`);
                }}
              />
            ))}
          </>
        )
      ) : (
        pastTrips.map((trip) => (
          <TripHistoryCard
            key={trip.id}
            title={trip.destinationLabel}
            meta={`${trip.distanceKm.toFixed(1)} km`}
            status={trip.safetyStatus}
            onPress={() => router.push(`/trip/${trip.id}`)}
          />
        ))
      )}

      {liveMode ? (
        <AppText variant="caption" style={styles.footer}>
          Active tracking is on Live. Full events are on Alerts.
          {rideId ? ` · ${rideId}` : ""}
        </AppText>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  hint: { marginBottom: 8 },
  footer: { marginTop: 20 },
});
