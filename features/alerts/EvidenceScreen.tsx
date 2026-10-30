import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";

import { Page } from "@/components/layout/Page";
import { AppText } from "@/components/ui/AppText";
import { ScreenState } from "@/components/ui/ScreenState";
import { clock } from "@/constants/format";
import { ApiError } from "@/services/api/http";
import { bustMediaUrl } from "@/services/api/media";
import { services } from "@/services/createServices";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";
import type { AlertClip } from "@/types/domain";

function channelLabel(channel?: string | null) {
  if (channel === "cms") return "Cabin";
  if (channel === "dms") return "Driver";
  return channel || "Camera";
}

function clipDurationLabel(startAt: number, endAt: number) {
  if (!startAt || !endAt || endAt <= startAt) return null;
  const sec = Math.max(1, Math.round((endAt - startAt) / 1000));
  return `~${sec}s`;
}

export function EvidenceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const alert = useRideStore((state) => state.alerts.find((item) => item.id === id));
  const liveMode = useRideStore((state) => state.liveMode);
  const rideId = useRideStore((state) => state.rideId);
  const { colors } = useTheme();
  const [clip, setClip] = useState<AlertClip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only place the app reads clip id — from the alert payload.
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
      .catch((err: unknown) => {
        if (!alive) return;
        setClip(null);
        if (err instanceof ApiError && err.status === 403) {
          setError("Sharing is off — clips return 403 until a guardian has sharing enabled.");
        } else if (err instanceof ApiError && err.status === 404) {
          setError("Clip not found for this ride.");
        } else {
          setError(err instanceof Error ? err.message : "Clip request failed");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [alert, clipId, liveMode, rideId]);

  const videoHtml = useMemo(() => {
    if (!clip?.videoUrl) return "";
    const src = clip.videoUrl.replace(/"/g, "&quot;");
    return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>html,body{margin:0;padding:0;background:#000;height:100%;}video{width:100%;height:100%;object-fit:contain;background:#000;}</style></head>
<body><video controls autoplay playsinline preload="metadata" src="${src}"></video></body></html>`;
  }, [clip?.videoUrl]);

  if (!alert) {
    return (
      <Page title="Missing evidence" back>
        <ScreenState kind="error" title="This evidence is not stored" body="Open an alert from the Alerts list." />
      </Page>
    );
  }

  const duration = clip ? clipDurationLabel(clip.startAt, clip.endAt) : null;

  return (
    <Page
      title={alert.title}
      subtitle={`${channelLabel(alert.channel)} · ${clock(alert.at)}`}
      back
    >
      <View style={[styles.card, { backgroundColor: colors.bgRaised, borderColor: colors.line }]}>
        <AppText variant="body">{alert.detail}</AppText>
        <AppText variant="caption">
          {alert.severity}
          {clipId ? ` · clip ${clipId}` : " · no clip"}
        </AppText>
      </View>

      {!clipId ? (
        <ScreenState
          kind="empty"
          title="No clip for this alert"
          body="clipId is null on this alert. Only alerts with a clipId expose GET /clips/{clipId}."
        />
      ) : null}

      {clipId && loading ? <ScreenState kind="loading" title="Loading clip" /> : null}

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
            {channelLabel(clip.channel)} clip
            {duration ? ` · ${duration}` : ""}
            {clip.videoUrl ? " · MP4" : ""}
          </AppText>
          {clip.startAt && clip.endAt ? (
            <AppText variant="caption">
              {clock(clip.startAt)} – {clock(clip.endAt)}
            </AppText>
          ) : null}

          {clip.videoUrl ? (
            <>
              <View style={[styles.player, { borderColor: colors.line }]}>
                <WebView
                  originWhitelist={["*"]}
                  source={{ html: videoHtml }}
                  style={styles.webview}
                  allowsInlineMediaPlayback
                  mediaPlaybackRequiresUserAction={false}
                  allowsFullscreenVideo
                />
              </View>
              <Pressable onPress={() => void Linking.openURL(clip.videoUrl!)} hitSlop={8}>
                <AppText variant="caption" style={{ color: colors.signal }}>
                  Open MP4 in browser
                </AppText>
              </Pressable>
            </>
          ) : (
            <AppText variant="caption">
              videoUrl is null — encoder did not produce an MP4. Showing still frames.
            </AppText>
          )}

          {clip.frames.length > 0 ? (
            <>
              <AppText variant="caption">{clip.frames.length} stills</AppText>
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
            </>
          ) : null}
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
  player: {
    height: 240,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: "#000",
  },
  webview: { flex: 1, backgroundColor: "#000" },
  row: { gap: 10, paddingVertical: 4 },
  thumb: {
    width: 140,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    gap: 4,
    paddingBottom: 6,
  },
  image: { width: "100%", height: 110 },
});
