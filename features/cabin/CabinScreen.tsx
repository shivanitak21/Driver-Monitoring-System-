import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";

import { Page } from "@/components/layout/Page";
import { SeatOccupancyGrid } from "@/components/safety/SeatOccupancyGrid";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { ScreenState } from "@/components/ui/ScreenState";
import { evidenceStill } from "@/data/photos";
import { initialSeats } from "@/data/fleet";
import { useTheme } from "@/providers/ThemeProvider";
import { services } from "@/services/createServices";
import { useRideStore, useSafetyIndex } from "@/stores/useRideStore";

type Phase = "idle" | "loading" | "live" | "error";

export function CabinScreen() {
  const consent = useRideStore((state) => state.cabinConsent);
  const setConsent = useRideStore((state) => state.setCabinConsent);
  const fault = useRideStore((state) => state.feedFault);
  const setFault = useRideStore((state) => state.setFeedFault);
  const driverState = useRideStore((state) => state.driverState);
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
      void services.cabin
        .open({ camera: "cabin", fault })
        .then(() => {
          if (!alive) return;
          setPhase("live");
        })
        .catch((error: Error) => {
          if (!alive) return;
          setNote(error.message);
          setPhase("error");
        });
    }, 800);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [consent, fault]);

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
        frame: {
          height: 320,
          borderRadius: 22,
          overflow: "hidden",
          backgroundColor: colors.bgSoft,
        },
        preview: { width: "100%", height: "100%" },
        tag: {
          position: "absolute",
          left: 12,
          bottom: 12,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: colors.glass,
        },
        row: { flexDirection: "row", alignItems: "center", gap: 10 },
        flex: { flex: 1 },
        pill: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
        actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        action: { flexGrow: 1, minWidth: 96 },
      }),
    [colors],
  );

  return (
    <Page title="Cabin" subtitle="Interior view for this ride">
      {!consent ? (
        <ScreenState
          kind="denied"
          title="Cabin monitoring is off"
          body="Turn this on to view the cabin for the current ride."
          actionLabel="Allow cabin monitoring"
          onAction={() => setConsent(true)}
        />
      ) : null}

      {consent && phase === "loading" ? <ScreenState kind="loading" title="Opening the cabin" /> : null}

      {consent && phase === "error" ? (
        <ScreenState kind="error" title="The cabin feed failed" body={note} actionLabel="Retry" onAction={() => setFault(false)} />
      ) : null}

      {consent && phase === "live" ? (
        <View style={styles.stack}>
          <View style={styles.frame}>
            <Image source={evidenceStill} style={styles.preview} contentFit="cover" />
            <View style={styles.tag}>
              <AppText variant="caption">{recording ? `Recording ${seconds}s` : "Cabin"}</AppText>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.pill, { backgroundColor: colors.bgRaised, borderWidth: 1, borderColor: attentive ? colors.line : colors.danger }]}>
              <AppText variant="strong" style={{ color: attentive ? colors.signal : colors.danger, textTransform: "capitalize" }}>
                {driverState}
              </AppText>
            </View>
            <AppText variant="caption" style={styles.flex}>
              {safety.line}
            </AppText>
          </View>
          <SeatOccupancyGrid seats={initialSeats} />
          <View style={styles.actions}>
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
            <View style={styles.action}>
              <Button label="Video call" tone="ghost" onPress={() => startCall("video")} />
            </View>
            <View style={styles.action}>
              <Button label="Audio call" tone="ghost" onPress={() => startCall("audio")} />
            </View>
          </View>
          <Button label="Interrupt feed" tone="quiet" onPress={() => setFault(true)} />
          <Button label="Raise SOS" tone="danger" onPress={askSos} />
        </View>
      ) : null}
    </Page>
  );
}
