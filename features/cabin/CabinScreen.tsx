import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";

import { Page } from "@/components/layout/Page";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { ScreenState } from "@/components/ui/ScreenState";
import { theme } from "@/constants/theme";
import { evidenceStill } from "@/data/photos";
import { initialSeats } from "@/data/fleet";
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
          setNote("Simulated cabin. This phone is not the vehicle camera.");
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

  const watchful = driverState === "attentive";

  return (
    <Page title="Cabin">
      {!consent ? (
        <ScreenState
          kind="denied"
          title="Cabin monitoring is off"
          body="Allow it to open the simulated cabin. Nothing is recorded from this phone."
          actionLabel="Allow cabin monitoring"
          onAction={() => setConsent(true)}
        />
      ) : null}

      {consent && phase === "loading" ? (
        <ScreenState kind="loading" title="Opening the cabin" body="Loading the simulated view." />
      ) : null}

      {consent && phase === "error" ? (
        <ScreenState kind="error" title="The cabin feed failed" body={note} actionLabel="Retry" onAction={() => setFault(false)} />
      ) : null}

      {consent && phase === "live" ? (
        <View style={styles.stack}>
          <View style={styles.frame}>
            <Image source={evidenceStill} style={styles.preview} contentFit="cover" />
            <View style={styles.tag}>
              <AppText variant="caption">{recording ? `Recording ${seconds}s` : "Simulated"}</AppText>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.pill, watchful ? styles.pillSafe : styles.pillRisk]}>
              <AppText variant="strong" style={{ color: watchful ? theme.limeInk : theme.ink }}>
                {driverState}
              </AppText>
            </View>
            <AppText variant="caption" style={styles.flex}>
              {safety.line}
            </AppText>
          </View>
          <View style={styles.seats}>
            {initialSeats.map((seat) => (
              <View key={seat.id} style={[styles.seat, seat.occupied && styles.seatOn]}>
                <AppText variant="caption" style={{ color: seat.occupied ? theme.limeInk : theme.inkMuted }}>
                  {seat.label}
                </AppText>
                <AppText variant="strong" style={{ color: seat.occupied ? theme.limeInk : theme.ink }}>
                  {seat.occupied ? "In" : "Empty"}
                </AppText>
              </View>
            ))}
          </View>
          <View style={styles.actions}>
            <Button
              label={recording ? "Stop" : "Record"}
              tone={recording ? "danger" : "lime"}
              onPress={() => {
                setRecording((value) => !value);
                if (recording) setSeconds(0);
              }}
            />
            <Button label="Video call" tone="ghost" onPress={() => startCall("video")} />
            <Button label="Audio call" tone="ghost" onPress={() => startCall("audio")} />
          </View>
          <Button label="Interrupt feed" tone="quiet" onPress={() => setFault(true)} />
          <Button label="Raise SOS" tone="danger" onPress={askSos} />
        </View>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
    marginTop: 8,
  },
  frame: {
    height: 320,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: theme.bgSoft,
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  tag: {
    position: "absolute",
    left: 12,
    bottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  pill: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillSafe: {
    backgroundColor: theme.lime,
  },
  pillRisk: {
    backgroundColor: theme.bgRaised,
    borderWidth: 1,
    borderColor: theme.danger,
  },
  seats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  seat: {
    width: "48%",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.bgRaised,
    borderWidth: 1,
    borderColor: theme.line,
    gap: 2,
  },
  seatOn: {
    backgroundColor: theme.lime,
    borderColor: theme.lime,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
