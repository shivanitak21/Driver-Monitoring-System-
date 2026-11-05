import { View } from "react-native";
import { router } from "expo-router";

import { Page } from "@/components/layout/Page";
import { TripHistoryCard } from "@/components/trips/TripHistoryCard";
import { ApiStatusBanner } from "@/components/system/ApiStatusBanner";
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
  const history = useRideStore((state) => state.history);
  const refreshing = useRideStore((state) => state.refreshing);
  const refreshHistory = useRideStore((state) => state.refreshHistory);
  const refreshAll = useRideStore((state) => state.refreshAll);

  return (
    <Page
      title="Trips"
      subtitle={liveMode ? "Past rides for this device" : undefined}
      refreshing={refreshing}
      onRefresh={
        liveMode
          ? () => void refreshHistory().catch(() => refreshAll())
          : undefined
      }
    >
      <View style={{ marginBottom: 12 }}>
        <ApiStatusBanner onRetry={() => void refreshAll()} />
      </View>

      {liveMode ? (
        history.length === 0 ? (
          <ScreenState kind="empty" title="No past rides" />
        ) : (
          history.map((trip, index) => (
            <TripHistoryCard
              key={historyTripKey(trip)}
              index={index}
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
          ))
        )
      ) : (
        pastTrips.map((trip, index) => (
          <TripHistoryCard
            key={trip.id}
            index={index}
            title={trip.destinationLabel}
            meta={`${trip.distanceKm.toFixed(1)} km`}
            status={trip.safetyStatus}
            onPress={() => router.push(`/trip/${trip.id}`)}
          />
        ))
      )}
    </Page>
  );
}
