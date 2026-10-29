import { useCallback } from "react";
import { useFocusEffect } from "expo-router";

import { useRideStore } from "@/stores/useRideStore";

/** Re-fetch guardian API data whenever a screen comes into focus. */
export function useLiveApiRefresh(
  kind: "all" | "alerts" | "guardians" | "cabin" | "notices" = "all",
) {
  const liveMode = useRideStore((state) => state.liveMode);
  const refreshAll = useRideStore((state) => state.refreshAll);
  const refreshAlerts = useRideStore((state) => state.refreshAlerts);
  const refreshGuardians = useRideStore((state) => state.refreshGuardians);
  const refreshNotices = useRideStore((state) => state.refreshNotices);
  const refreshCabin = useRideStore((state) => state.refreshCabin);

  useFocusEffect(
    useCallback(() => {
      if (!liveMode) return;
      if (kind === "alerts") {
        void refreshAlerts("all");
        return;
      }
      if (kind === "guardians") {
        void Promise.all([refreshGuardians(), refreshNotices()]);
        return;
      }
      if (kind === "cabin") {
        void refreshCabin();
        return;
      }
      if (kind === "notices") {
        void refreshNotices();
        return;
      }
      void refreshAll();
    }, [
      kind,
      liveMode,
      refreshAlerts,
      refreshAll,
      refreshCabin,
      refreshGuardians,
      refreshNotices,
    ]),
  );
}
