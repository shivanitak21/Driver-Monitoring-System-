import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";

import { Page } from "@/components/layout/Page";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { ScreenState } from "@/components/ui/ScreenState";
import { theme } from "@/constants/theme";
import { clock } from "@/constants/format";
import { evidenceStill } from "@/data/photos";
import { useRideStore } from "@/stores/useRideStore";

export function EvidenceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const alert = useRideStore((state) => state.alerts.find((item) => item.id === id));
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setProgress((value) => (value >= 1 ? 0 : value + 0.04));
    }, 180);
    return () => clearInterval(timer);
  }, [playing]);

  if (!alert) {
    return (
      <Page kicker="Evidence" title="Missing still" back>
        <ScreenState
          kind="error"
          title="This evidence is not stored"
          body="The event id does not match a simulated still on this phone."
        />
      </Page>
    );
  }

  if (!alert.evidenceId) {
    return (
      <Page kicker="Evidence" title={alert.title} back>
        <ScreenState
          kind="empty"
          title="No still was kept"
          body="This event has a timeline card only. The simulated cabin did not store a frame."
        />
      </Page>
    );
  }

  return (
    <Page kicker="Recorded event" title={alert.title} back>
      <View style={styles.frame}>
        <Image source={evidenceStill} style={styles.image} contentFit="cover" />
        <View style={styles.tag}>
          <AppText variant="caption">Simulated still · not a live cabin camera</AppText>
        </View>
      </View>
      <View style={styles.copy}>
        <AppText variant="body">{alert.detail}</AppText>
        <AppText variant="caption">
          {clock(alert.at)} · {alert.locationLabel} · {alert.severity}
        </AppText>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      {loading ? (
        <ScreenState kind="loading" title="Opening the clip" body="Preparing the simulated playback timeline." />
      ) : (
        <Button
          testID="play-evidence"
          label={playing ? "Pause playback" : "Play recorded event"}
          onPress={() => {
            if (playing) {
              setPlaying(false);
              return;
            }
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              setPlaying(true);
            }, 600);
          }}
        />
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 240,
    borderRadius: 24,
    overflow: "hidden",
    marginTop: 8,
    backgroundColor: theme.bgSoft,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  tag: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: "rgba(7,8,10,0.78)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  copy: {
    gap: 6,
    marginVertical: 16,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.bgSoft,
    marginBottom: 16,
    overflow: "hidden",
  },
  fill: {
    height: 4,
    backgroundColor: theme.lime,
  },
});
