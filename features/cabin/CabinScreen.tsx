import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Page } from "@/components/layout/Page";
import { CabinMediaBar } from "@/components/media/CabinMediaBar";
import { LiveStill } from "@/components/media/LiveStill";
import { AnalysisPanel } from "@/components/safety/AnalysisPanel";
import { SeatOccupancyGrid } from "@/components/safety/SeatOccupancyGrid";
import { ApiStatusBanner } from "@/components/system/ApiStatusBanner";
import { StatusChip } from "@/components/system/StatusChip";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { ScreenState } from "@/components/ui/ScreenState";
import { Segmented } from "@/components/ui/Segmented";
import { driverStateLabel } from "@/constants/liveMap";
import { useLiveApiRefresh } from "@/hooks/useLiveApiRefresh";
import { useTheme } from "@/providers/ThemeProvider";
import { services } from "@/services/createServices";
import { useRideStore } from "@/stores/useRideStore";
import type { MediaChannel } from "@/types/domain";

type Phase = "idle" | "loading" | "live" | "error";
type CameraTab = "both" | "cms" | "dms";

export function CabinScreen() {
  useLiveApiRefresh("cabin");
  const consent = useRideStore((state) => state.cabinConsent);
  const setConsent = useRideStore((state) => state.setCabinConsent);
  const fault = useRideStore((state) => state.feedFault);
  const setFault = useRideStore((state) => state.setFeedFault);
  const driverState = useRideStore((state) => state.driverState);
  const seats = useRideStore((state) => state.seats);
  const passengerName = useRideStore((state) => state.passengerName);
  const deviceId = useRideStore((state) => state.deviceId);
  const publisherOnline = useRideStore((state) => state.publisherOnline);
  const rideId = useRideStore((state) => state.rideId);
  const analysis = useRideStore((state) => state.analysis);
  const frameDms = useRideStore((state) => state.frameDms);
  const frameCms = useRideStore((state) => state.frameCms);
  const liveMode = useRideStore((state) => state.liveMode);
  const refreshing = useRideStore((state) => state.refreshing);
  const refreshCabin = useRideStore((state) => state.refreshCabin);
  const refreshFrames = useRideStore((state) => state.refreshFrames);
  const refreshAnalysis = useRideStore((state) => state.refreshAnalysis);
  const refreshAll = useRideStore((state) => state.refreshAll);
  const askSos = useRideStore((state) => state.askSos);
  const { colors } = useTheme();
  const [phase, setPhase] = useState<Phase>("idle");
  const [note, setNote] = useState("");
  const [camera, setCamera] = useState<CameraTab>("both");

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
            await Promise.all([refreshCabin(), refreshFrames(), refreshAnalysis()]);
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
  }, [consent, fault, liveMode, refreshAnalysis, refreshCabin, refreshFrames]);

  useEffect(() => {
    if (!liveMode || !consent || phase !== "live") return;
    const id = setInterval(() => {
      void Promise.all([refreshFrames(), refreshAnalysis().catch(() => undefined)]);
    }, 4000);
    return () => clearInterval(id);
  }, [consent, liveMode, phase, refreshAnalysis, refreshFrames]);

  const attentive = driverState === "attentive";
  const snapChannel: MediaChannel = camera === "cms" ? "cms" : "dms";
  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: { gap: 14 },
        chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        dual: { gap: 12 },
        section: { gap: 10 },
      }),
    [],
  );

  const onRefresh = () => {
    void Promise.all([refreshCabin(), refreshFrames(), refreshAnalysis()]);
  };

  return (
    <Page
      title="Cabin"
      subtitle={liveMode ? `${passengerName || rideId} · ${deviceId}` : "Interior view"}
      refreshing={refreshing}
      onRefresh={liveMode ? onRefresh : undefined}
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
          <View style={styles.chips}>
            <StatusChip label={driverStateLabel(driverState)} tone={attentive ? "ok" : "danger"} />
            <StatusChip label={publisherOnline ? "cam on" : "cam off"} tone={publisherOnline ? "ok" : "warn"} />
          </View>

          {liveMode ? (
            <>
              <CabinMediaBar channel={snapChannel} />

              <Segmented
                value={camera}
                onChange={(id) => setCamera(id as CameraTab)}
                items={[
                  { id: "both", label: "Both" },
                  { id: "dms", label: "Driver" },
                  { id: "cms", label: "Cabin" },
                ]}
              />

              {camera === "both" ? (
                <View style={styles.dual}>
                  <LiveStill frame={frameDms} label="Driver" height={200} />
                  <LiveStill frame={frameCms} label="Cabin" height={200} />
                </View>
              ) : (
                <LiveStill
                  frame={camera === "cms" ? frameCms : frameDms}
                  label={camera === "cms" ? "Cabin" : "Driver"}
                  height={260}
                />
              )}

              {(camera === "both" || camera === "dms") && (
                <AnalysisPanel title="Driver" side={analysis?.dms} />
              )}
              {(camera === "both" || camera === "cms") && (
                <AnalysisPanel title="Cabin" side={analysis?.cms} />
              )}
            </>
          ) : (
            <ScreenState kind="empty" title="Offline demo" body="Set EXPO_PUBLIC_TELEMETRY_URL for live cabin." />
          )}

          <View style={styles.section}>
            <AppText variant="strong">Seats</AppText>
            <SeatOccupancyGrid seats={seats} awaitingWhenEmpty={liveMode} />
          </View>

          <Button label="Raise SOS" tone="danger" onPress={askSos} />
        </View>
      ) : null}
    </Page>
  );
}
