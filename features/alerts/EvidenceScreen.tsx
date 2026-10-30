import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";

import { Page } from "@/components/layout/Page";
import { AppText } from "@/components/ui/AppText";
import { ScreenState } from "@/components/ui/ScreenState";
import { clock } from "@/constants/format";
import { bustMediaUrl } from "@/services/api/media";
import { services } from "@/services/createServices";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";
import type { AlertClip } from "@/types/domain";

export function EvidenceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const alert = useRideStore((state) => state.alerts.find((item) => item.id === id));
  const liveMode = useRideStore((state) => state.liveMode);
  const rideId = useRideStore((state) => state.rideId);
  const { colors } = useTheme();
  const [clip, setClip] = useState<AlertClip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clipId = alert?.clipId || null;

  useEffect(() => {
    if (!liveMode || !alert || !clipId || !services.api) {
      setClip(null);
      setError(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    void services.api
      .getClip(rideId, clipId)
      .then((next) => {
        if (!alive) return;
        setClip(next);
      })
      .catch((err: Error) => {
        if (!alive) return;
        setClip(null);
        setError(err.message || "Clip request failed");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [alert, clipId, liveMode, rideId]);

  if (!alert) {
    return (
      <Page title="Missing evidence" back>
        <ScreenState kind="error" title="This evidence is not stored" body="Open an alert from the Alerts list." />
      </Page>
    );
  }

  return (
    <Page
      title={alert.title}
      subtitle={`${clock(alert.at)} · ${alert.channel || alert.kind}`}
      back
    >
      <View style={[styles.card, { backgroundColor: colors.bgRaised, borderColor: colors.line }]}>
        <AppText variant="strong">{alert.severity}</AppText>
        <AppText variant="body">{alert.detail}</AppText>
        <AppText variant="caption">
          {clock(alert.at)} · {alert.kind} · {alert.origin}
          {alert.channel ? ` · ${alert.channel}` : ""}
        </AppText>
        {alert.confidence != null ? (
          <AppText variant="caption">confidence {alert.confidence}</AppText>
        ) : null}
        <AppText variant="caption">
          {clipId ? `clipId: ${clipId}` : "clipId: null (no stored clip yet)"}
        </AppText>
      </View>

      {!clipId ? (
        <ScreenState
          kind="empty"
          title="No clip stored"
          body={
            liveMode
              ? "This alert has no clipId. GET /clips only works when the API sets clipId on the alert."
              : "Evidence media is not bundled for this event."
          }
        />
      ) : null}

      {clipId && loading ? <ScreenState kind="loading" title="Loading clip frames" /> : null}

      {clipId && !loading && error ? (
        <ScreenState
          kind="error"
          title="Clip unavailable"
          body={error}
          actionLabel="Retry"
          onAction={() => {
            setError(null);
            setLoading(true);
            void services.api
              ?.getClip(rideId, clipId)
              .then(setClip)
              .catch((err: Error) => setError(err.message))
              .finally(() => setLoading(false));
          }}
        />
      ) : null}

      {clipId && !loading && !error && clip ? (
        <View style={styles.stack}>
          <AppText variant="strong">
            {clip.channel.toUpperCase()} · {clip.frames.length} frames
          </AppText>
          <AppText variant="caption">
            {clip.videoUrl ? `videoUrl: ${clip.videoUrl}` : "Frame sequence only (videoUrl is null)."}
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {clip.frames.map((frame) => (
              <View key={`${frame.at}-${frame.imageUrl}`} style={[styles.thumb, { borderColor: colors.line }]}>
                <Image
                  source={{ uri: bustMediaUrl(frame.imageUrl, frame.at) }}
                  style={styles.image}
                  contentFit="cover"
                />
                <AppText variant="caption" style={{ paddingHorizontal: 6 }}>
                  {clock(frame.at)}
                </AppText>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    marginBottom: 12,
  },
  stack: { gap: 10 },
  row: { gap: 10, paddingVertical: 4 },
  thumb: {
    width: 160,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    gap: 4,
    paddingBottom: 6,
  },
  image: { width: "100%", height: 120 },
});
