import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";

import { Page } from "@/components/layout/Page";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { ScreenState } from "@/components/ui/ScreenState";
import { clock } from "@/constants/format";
import { evidenceStill } from "@/data/photos";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";

export function EvidenceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const alert = useRideStore((state) => state.alerts.find((item) => item.id === id));
  const { colors } = useTheme();
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
      <Page title="Missing still" back>
        <ScreenState
          kind="error"
          title="This evidence is not stored"
          body="This event is not on the phone."
        />
      </Page>
    );
  }

  if (!alert.evidenceId) {
    return (
      <Page title={alert.title} subtitle="No still was kept" back>
        <ScreenState
          kind="empty"
          title="No still was kept"
          body="This event has a timeline card only."
        />
      </Page>
    );
  }

  return (
    <Page title={alert.title} subtitle={`${clock(alert.at)} · ${alert.locationLabel}`} back>
      <View style={[styles.frame, { backgroundColor: colors.bgSoft }]}>
        <Image source={evidenceStill} style={styles.image} contentFit="cover" />
        <View style={[styles.tag, { backgroundColor: colors.glass }]}>
          <AppText variant="caption">{alert.locationLabel}</AppText>
        </View>
      </View>
      <View style={styles.copy}>
        <AppText variant="body">{alert.detail}</AppText>
        <AppText variant="caption">
        {clock(alert.at)} · {alert.locationLabel} · {alert.severity}
        </AppText>
      </View>
      <View style={[styles.track, { backgroundColor: colors.bgSoft }]}>
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%`, backgroundColor: colors.signal }]} />
      </View>
      {loading ? (
        <ScreenState kind="loading" title="Opening the clip" body="Getting the recording ready." />
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
  },
  image: {
    width: "100%",
    height: "100%",
  },
  tag: {
    position: "absolute",
    left: 12,
    bottom: 12,
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
    marginBottom: 16,
    overflow: "hidden",
  },
  fill: {
    height: 4,
  },
});
