import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { Page } from "@/components/layout/Page";
import { CabinLibrary } from "@/components/media/CabinLibrary";
import { CabinMediaBar } from "@/components/media/CabinMediaBar";
import { SeatOccupancyGrid } from "@/components/safety/SeatOccupancyGrid";
import { ApiStatusBanner } from "@/components/system/ApiStatusBanner";
import { StatusChip } from "@/components/system/StatusChip";
import { Button } from "@/components/ui/Button";
import { Settings } from "@/components/ui/icons";
import { ScreenState } from "@/components/ui/ScreenState";
import { driverStateLabel } from "@/constants/liveMap";
import { useLiveApiRefresh } from "@/hooks/useLiveApiRefresh";
import { useTheme } from "@/providers/ThemeProvider";
import { services } from "@/services/createServices";
import { useRideStore } from "@/stores/useRideStore";
import { selectionFeedback } from "@/utils/haptics";

type Phase = "idle" | "loading" | "live" | "error";

export function CabinScreen() {
  useLiveApiRefresh("cabin");
  const consent = useRideStore((state) => state.cabinConsent);
  const setConsent = useRideStore((state) => state.setCabinConsent);
  const fault = useRideStore((state) => state.feedFault);
  const setFault = useRideStore((state) => state.setFeedFault);
  const driverState = useRideStore((state) => state.driverState);
  const seats = useRideStore((state) => state.seats);
  const publisherOnline = useRideStore((state) => state.publisherOnline);
  const deviceState = useRideStore((state) => state.deviceState);
  const recordings = useRideStore((state) => state.recordings);
  const snapshots = useRideStore((state) => state.snapshots);
  const liveMode = useRideStore((state) => state.liveMode);
  const refreshing = useRideStore((state) => state.refreshing);
  const refreshCabin = useRideStore((state) => state.refreshCabin);
  const refreshFrames = useRideStore((state) => state.refreshFrames);
  const refreshAnalysis = useRideStore((state) => state.refreshAnalysis);
  const refreshGuardians = useRideStore((state) => state.refreshGuardians);
  const refreshRecordings = useRideStore((state) => state.refreshRecordings);
  const refreshSnapshots = useRideStore((state) => state.refreshSnapshots);
  const refreshAll = useRideStore((state) => state.refreshAll);
  const askSos = useRideStore((state) => state.askSos);
  const { colors } = useTheme();
  const [phase, setPhase] = useState<Phase>("idle");
  const [note, setNote] = useState("");
  const [frameTick, setFrameTick] = useState(0);

  useEffect(() => {
    if (!consent) {
      setPhase("idle");
      return;
    }
    let alive = true;
    setPhase("loading");
    const timer = setTimeout(() => {
      void (async () => {
        try {
          if (liveMode) {
            await Promise.all([
              refreshCabin(),
              refreshFrames(),
              refreshAnalysis(),
              refreshGuardians().catch(() => undefined),
              refreshRecordings().catch(() => undefined),
              refreshSnapshots().catch(() => undefined),
            ]);
            if (alive) setFrameTick(Date.now());
          } else {
            await services.cabin.open({ camera: "cabin", fault });
          }
          if (!alive) return;
          setPhase("live");
        } catch (error) {
          if (!alive) return;
          setNote(error instanceof Error ? error.message : "Cabin feed failed");
          setPhase("error");
        }
      })();
    }, liveMode ? 120 : 800);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [
    consent,
    fault,
    liveMode,
    refreshAnalysis,
    refreshCabin,
    refreshFrames,
    refreshGuardians,
    refreshRecordings,
    refreshSnapshots,
  ]);

  useEffect(() => {
    if (!liveMode || !consent || phase !== "live") return;
    const id = setInterval(() => {
      void Promise.all([refreshFrames(), refreshAnalysis().catch(() => undefined)]).then(() => {
        setFrameTick(Date.now());
      });
    }, 4000);
    return () => clearInterval(id);
  }, [consent, liveMode, phase, refreshAnalysis, refreshFrames]);

  const attentive = driverState === "attentive";
  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: { gap: 18 },
        chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        settings: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bgRaised,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.line,
        },
      }),
    [colors],
  );

  const onRefresh = () => {
    void Promise.all([
      refreshCabin(),
      refreshFrames(),
      refreshAnalysis(),
      refreshGuardians().catch(() => undefined),
      refreshRecordings().catch(() => undefined),
      refreshSnapshots().catch(() => undefined),
    ]);
  };

  return (
    <Page
      title="Cabin"
      refreshing={refreshing}
      onRefresh={liveMode ? onRefresh : undefined}
      action={
        <Pressable
          accessibilityLabel="Settings"
          accessibilityRole="button"
          onPress={() => {
            void selectionFeedback();
            router.push("/settings");
          }}
          style={styles.settings}
        >
          <Settings size={18} color={colors.ink} strokeWidth={1.75} />
        </Pressable>
      }
    >
      <View style={{ marginBottom: 10 }}>
        <ApiStatusBanner onRetry={() => void refreshAll()} />
      </View>

      {!consent ? (
        <ScreenState
          kind="denied"
          title="Cabin monitoring is off"
          body="Allow cabin monitoring to see driver and cabin cameras."
          actionLabel="Allow"
          onAction={() => setConsent(true)}
        />
      ) : null}

      {consent && phase === "loading" ? <ScreenState kind="loading" title="Loading cabin" /> : null}

      {consent && phase === "error" ? (
        <ScreenState
          kind="error"
          title="Cabin failed"
          body={note}
          actionLabel="Retry"
          onAction={() => {
            setFault(false);
            if (liveMode) onRefresh();
          }}
        />
      ) : null}

      {consent && phase === "live" ? (
        <View style={styles.stack}>
          {liveMode ? (
            <CabinMediaBar reloadToken={frameTick} />
          ) : (
            <ScreenState kind="empty" title="Cabin offline" />
          )}

          <View style={styles.chips}>
            <StatusChip label={driverStateLabel(driverState)} tone={attentive ? "ok" : "danger"} />
            {deviceState ? (
              <StatusChip label={deviceState === "online" ? "Online" : "Offline"} tone={deviceState === "online" ? "ok" : "warn"} />
            ) : null}
            <StatusChip label={publisherOnline ? "Cameras on" : "Cameras off"} tone={publisherOnline ? "ok" : "warn"} />
          </View>

          <CabinLibrary recordings={recordings} snapshots={snapshots} />
          <SeatOccupancyGrid seats={seats} awaitingWhenEmpty={liveMode} />
          <Button label="Raise SOS" tone="danger" onPress={askSos} />
        </View>
      ) : null}
    </Page>
  );
}
