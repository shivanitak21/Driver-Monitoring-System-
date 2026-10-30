import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Page } from "@/components/layout/Page";
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
import { useRideStore, useSafetyIndex } from "@/stores/useRideStore";

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
  const safetyStatus = useRideStore((state) => state.safetyStatus);
  const passengerName = useRideStore((state) => state.passengerName);
  const deviceId = useRideStore((state) => state.deviceId);
  const deviceState = useRideStore((state) => state.deviceState);
  const publisherOnline = useRideStore((state) => state.publisherOnline);
  const score = useRideStore((state) => state.score);
  const rideId = useRideStore((state) => state.rideId);
  const analysis = useRideStore((state) => state.analysis);
  const frameDms = useRideStore((state) => state.frameDms);
  const frameCms = useRideStore((state) => state.frameCms);
  const videoSession = useRideStore((state) => state.videoSession);
  const liveMode = useRideStore((state) => state.liveMode);
  const refreshing = useRideStore((state) => state.refreshing);
  const refreshCabin = useRideStore((state) => state.refreshCabin);
  const refreshFrames = useRideStore((state) => state.refreshFrames);
  const refreshAnalysis = useRideStore((state) => state.refreshAnalysis);
  const refreshVideo = useRideStore((state) => state.refreshVideo);
  const refreshAll = useRideStore((state) => state.refreshAll);
  const askSos = useRideStore((state) => state.askSos);
  const safety = useSafetyIndex();
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
            await Promise.all([
              refreshCabin(),
              refreshFrames(),
              refreshAnalysis(),
              refreshVideo().catch(() => undefined),
            ]);
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
  }, [consent, fault, liveMode, refreshAnalysis, refreshCabin, refreshFrames, refreshVideo]);

  useEffect(() => {
    if (!liveMode || !consent || phase !== "live") return;
    const id = setInterval(() => {
      void Promise.all([refreshFrames(), refreshAnalysis().catch(() => undefined)]);
    }, 4000);
    return () => clearInterval(id);
  }, [consent, liveMode, phase, refreshAnalysis, refreshFrames]);

  const attentive = driverState === "attentive";
  const deviceOnline = (deviceState || "").toLowerCase() === "online";
  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: { gap: 14 },
        hero: {
          borderRadius: 22,
          padding: 18,
          gap: 12,
          backgroundColor: colors.bgRaised,
          borderWidth: 1,
          borderColor: colors.line,
        },
        chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        dual: { gap: 12 },
        section: { marginTop: 4, gap: 10 },
      }),
    [colors],
  );

  const onRefresh = () => {
    void Promise.all([
      refreshCabin(),
      refreshFrames(),
      refreshAnalysis(),
      refreshVideo().catch(() => undefined),
    ]);
  };

  return (
    <Page
      title="Cabin"
      subtitle={liveMode ? `${passengerName || rideId} · ${deviceId}` : "Interior view for this ride"}
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
          body="Turn this on to view driver/cabin stills and analysis for the current ride."
          actionLabel="Allow cabin monitoring"
          onAction={() => setConsent(true)}
        />
      ) : null}

      {consent && phase === "loading" ? <ScreenState kind="loading" title="Loading cabin status" /> : null}

      {consent && phase === "error" ? (
        <ScreenState
          kind="error"
          title="Cabin status failed"
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
          <View style={styles.hero}>
            <AppText variant="title" style={{ fontSize: 24 }}>
              {driverStateLabel(driverState)}
            </AppText>
            <View style={styles.chips}>
              <StatusChip
                label={safetyStatus}
                tone={safetyStatus === "emergency" ? "danger" : safetyStatus === "caution" ? "warn" : "ok"}
              />
              <StatusChip label={driverState} tone={attentive ? "ok" : "danger"} />
              <StatusChip label={deviceOnline ? "device online" : "device offline"} tone={deviceOnline ? "ok" : "warn"} />
              <StatusChip
                label={publisherOnline ? "camera online" : "camera offline"}
                tone={publisherOnline ? "ok" : "warn"}
              />
              <StatusChip label={`score ${score}`} tone={score >= 80 ? "ok" : score >= 50 ? "warn" : "danger"} />
            </View>
            <AppText variant="caption">{safety.line}</AppText>
            {videoSession ? (
              <AppText variant="caption">
                Watch · {videoSession.mode} · room {videoSession.room || rideId}
                {videoSession.tracks.length ? ` · ${videoSession.tracks.join(", ")}` : ""}
                {videoSession.publisherOnline
                  ? " · LiveKit token ready (native client for moving video)"
                  : " · JPEG stills until publisher comes online"}
              </AppText>
            ) : null}
          </View>

          {liveMode ? (
            <>
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
                  <LiveStill frame={frameDms} label="DMS · driver" height={200} />
                  <LiveStill frame={frameCms} label="CMS · cabin" height={200} />
                </View>
              ) : (
                <LiveStill
                  frame={camera === "cms" ? frameCms : frameDms}
                  label={camera === "cms" ? "CMS · cabin" : "DMS · driver"}
                  height={260}
                />
              )}

              {(camera === "both" || camera === "dms") && (
                <AnalysisPanel title="Driver analysis (DMS)" side={analysis?.dms} />
              )}
              {(camera === "both" || camera === "cms") && (
                <AnalysisPanel title="Cabin analysis (CMS)" side={analysis?.cms} />
              )}
            </>
          ) : (
            <ScreenState kind="empty" title="Simulated cabin" body="Connect EXPO_PUBLIC_TELEMETRY_URL for live stills." />
          )}

          <View style={styles.section}>
            <AppText variant="strong">Seat occupancy</AppText>
            <SeatOccupancyGrid seats={seats} awaitingWhenEmpty={liveMode} />
          </View>

          <Button label="Raise SOS" tone="danger" onPress={askSos} />
        </View>
      ) : null}
    </Page>
  );
}
