import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Page } from "@/components/layout/Page";
import { SeatOccupancyGrid } from "@/components/safety/SeatOccupancyGrid";
import { ApiStatusBanner } from "@/components/system/ApiStatusBanner";
import { StatusChip } from "@/components/system/StatusChip";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { ScreenState } from "@/components/ui/ScreenState";
import { driverStateLabel } from "@/constants/liveMap";
import { useLiveApiRefresh } from "@/hooks/useLiveApiRefresh";
import { useTheme } from "@/providers/ThemeProvider";
import { services } from "@/services/createServices";
import { useRideStore, useSafetyIndex } from "@/stores/useRideStore";

type Phase = "idle" | "loading" | "live" | "error";

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
  const rideId = useRideStore((state) => state.rideId);
  const liveMode = useRideStore((state) => state.liveMode);
  const refreshing = useRideStore((state) => state.refreshing);
  const refreshCabin = useRideStore((state) => state.refreshCabin);
  const refreshAll = useRideStore((state) => state.refreshAll);
  const askSos = useRideStore((state) => state.askSos);
  const startCall = useRideStore((state) => state.startCall);
  const safety = useSafetyIndex();
  const { colors } = useTheme();
  const [phase, setPhase] = useState<Phase>("idle");
  const [note, setNote] = useState("");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

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
          if (liveMode) await refreshCabin();
          await services.cabin.open({ camera: "cabin", fault });
          if (!alive) return;
          setPhase("live");
        } catch (error) {
          if (!alive) return;
          setNote(error instanceof Error ? error.message : "Cabin feed failed");
          setPhase("error");
        }
      })();
    }, liveMode ? 200 : 800);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [consent, fault, liveMode, refreshCabin]);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  const attentive = driverState === "attentive";
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
        row: { flexDirection: "row", alignItems: "center", gap: 10 },
        flex: { flex: 1 },
        section: { marginTop: 4, gap: 10 },
        actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        action: { flexGrow: 1, minWidth: 96 },
      }),
    [colors],
  );

  return (
    <Page
      title="Cabin"
      subtitle={liveMode ? `${passengerName || rideId} · ${deviceId}` : "Interior view for this ride"}
      refreshing={refreshing}
      onRefresh={liveMode ? () => void refreshCabin() : undefined}
    >
      <View style={{ marginBottom: 10 }}>
        <ApiStatusBanner onRetry={() => void refreshAll()} />
      </View>

      {!consent ? (
        <ScreenState
          kind="denied"
          title="Cabin monitoring is off"
          body="Turn this on to view driver and seat state for the current ride."
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
            if (liveMode) void refreshCabin();
          }}
        />
      ) : null}

      {consent && phase === "live" ? (
        <View style={styles.stack}>
          <View style={styles.hero}>
            <AppText variant="title" style={{ fontSize: 24 }}>
              {driverStateLabel(driverState)}
            </AppText>
            <AppText variant="body">
              {liveMode
                ? "Driver and occupancy come from the cabin API. No camera stream URL is published yet."
                : "Simulated cabin preview on this phone."}
            </AppText>
            <View style={styles.chips}>
              <StatusChip
                label={safetyStatus}
                tone={safetyStatus === "emergency" ? "danger" : safetyStatus === "caution" ? "warn" : "ok"}
              />
              <StatusChip
                label={driverState}
                tone={attentive ? "ok" : "danger"}
              />
              <StatusChip
                label={deviceState || "device"}
                tone={(deviceState || "").toLowerCase() === "online" ? "ok" : "warn"}
              />
            </View>
            <AppText variant="caption">{safety.line}</AppText>
          </View>

          <View style={styles.section}>
            <AppText variant="strong">Seat occupancy</AppText>
            <SeatOccupancyGrid seats={seats} awaitingWhenEmpty={liveMode} />
            {liveMode && seats.length === 0 ? (
              <AppText variant="caption">The cabin API returned an empty seats list for this ride.</AppText>
            ) : null}
          </View>

          <View style={styles.actions}>
            {!liveMode ? (
              <View style={styles.action}>
                <Button
                  label={recording ? "Stop" : "Record"}
                  tone={recording ? "danger" : "quiet"}
                  onPress={() => {
                    setRecording((value) => !value);
                    if (recording) setSeconds(0);
                  }}
                />
              </View>
            ) : null}
            <View style={styles.action}>
              <Button label="Video call" tone="ghost" onPress={() => startCall("video")} />
            </View>
            <View style={styles.action}>
              <Button label="Audio call" tone="ghost" onPress={() => startCall("audio")} />
            </View>
          </View>
          {!liveMode ? <Button label="Interrupt feed" tone="quiet" onPress={() => setFault(true)} /> : null}
          <Button label="Raise SOS" tone="danger" onPress={askSos} />
        </View>
      ) : null}
    </Page>
  );
}
