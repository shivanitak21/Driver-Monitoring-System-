import { useEffect, useMemo, useRef, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { WebView } from "react-native-webview";
import Animated, { ZoomIn } from "react-native-reanimated";

import { AppText } from "@/components/ui/AppText";
import { clock } from "@/constants/format";
import { useTheme } from "@/providers/ThemeProvider";
import type { GuardianRecording, GuardianSnapshot } from "@/types/domain";

type Props = {
  recordings: GuardianRecording[];
  snapshots: GuardianSnapshot[];
};

function filePlayerSource(uri: string) {
  const name = uri.split("/").pop() || "clip.webm";
  const base = uri.slice(0, uri.length - name.length);
  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#000"><video src="${name}" controls autoplay playsinline style="width:100%;height:100vh;object-fit:contain;background:#000"></video></body></html>`;
  return { html, baseUrl: base };
}

const STATUS: Record<GuardianRecording["status"], string> = {
  recording: "Recording",
  stopping: "Uploading",
  ready: "Ready",
  failed: "Failed",
};

export function CabinLibrary({ recordings, snapshots }: Props) {
  const { colors } = useTheme();
  const seen = useRef(new Set<string>());
  const [freshId, setFreshId] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    const newest = snapshots[0];
    if (!newest) return;
    if (seen.current.size === 0) {
      snapshots.forEach((snap) => seen.current.add(snap.id));
      return;
    }
    if (!seen.current.has(newest.id)) {
      seen.current.add(newest.id);
      setFreshId(newest.id);
    }
  }, [snapshots]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { gap: 18 },
        block: { gap: 8 },
        head: {
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          paddingHorizontal: 4,
        },
        snaps: { gap: 10, paddingVertical: 2, paddingRight: 4 },
        snap: { width: 132, gap: 6 },
        thumb: {
          width: 132,
          height: 96,
          borderRadius: 16,
          backgroundColor: colors.bgSoft,
        },
        player: {
          height: 220,
          borderRadius: 18,
          overflow: "hidden",
          backgroundColor: "#000",
        },
        card: {
          borderRadius: 18,
          backgroundColor: colors.bgRaised,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.line,
          overflow: "hidden",
        },
        row: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.line,
        },
        rowFirst: { borderTopWidth: 0 },
      }),
    [colors],
  );

  if (snapshots.length === 0 && recordings.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {snapshots.length > 0 ? (
        <View style={styles.block}>
          <View style={styles.head}>
            <AppText variant="caption">Snaps</AppText>
            <AppText variant="caption">{snapshots.length}</AppText>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.snaps}>
            {snapshots.slice(0, 12).map((snap) => {
              const fresh = snap.id === freshId;
              const thumb = (
                <Pressable
                  style={styles.snap}
                  onPress={() => void Linking.openURL(snap.imageUrl)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${snap.channel} snap`}
                >
                  <Image source={{ uri: snap.imageUrl }} style={styles.thumb} contentFit="cover" />
                  <AppText variant="caption" numberOfLines={1}>
                    {snap.channel === "cms" ? "Cabin" : "Driver"} · {clock(snap.at)}
                  </AppText>
                </Pressable>
              );
              if (!fresh) return <View key={snap.id}>{thumb}</View>;
              return (
                <Animated.View key={snap.id} entering={ZoomIn.springify().damping(16)}>
                  {thumb}
                </Animated.View>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {recordings.length > 0 ? (
        <View style={styles.block}>
          <View style={styles.head}>
            <AppText variant="caption">Recordings</AppText>
            <AppText variant="caption">{recordings.length}</AppText>
          </View>
          <View style={styles.card}>
            {playing ? (
              <View style={styles.player}>
                <WebView
                  source={filePlayerSource(playing)}
                  style={{ flex: 1, backgroundColor: "#000" }}
                  allowsInlineMediaPlayback
                  mediaPlaybackRequiresUserAction={false}
                  allowFileAccess
                  allowUniversalAccessFromFileURLs
                  originWhitelist={["*"]}
                />
              </View>
            ) : null}
            {recordings.slice(0, 8).map((rec, index) => (
              <View key={rec.id} style={[styles.row, index === 0 && !playing && styles.rowFirst]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="strong" style={{ fontSize: 15 }}>
                    {rec.id.startsWith("phone-") ? "Live recording" : STATUS[rec.status]}
                    {rec.audio ? " · audio" : ""}
                  </AppText>
                  <AppText variant="caption">{clock(rec.startedAt)}</AppText>
                </View>
                {rec.status === "ready" && rec.videoUrl ? (
                  <Pressable
                    onPress={() => {
                      const url = rec.videoUrl!;
                      if (url.startsWith("file:") || url.startsWith("content:")) setPlaying(url);
                      else void Linking.openURL(url);
                    }}
                    hitSlop={8}
                  >
                    <AppText variant="caption" style={{ color: colors.signal }}>
                      {playing === rec.videoUrl ? "Playing" : "Play"}
                    </AppText>
                  </Pressable>
                ) : (
                  <AppText variant="caption" style={{ color: colors.inkFaint }}>
                    {rec.status === "recording" ? "In progress" : rec.status === "stopping" ? "Uploading" : "No file yet"}
                  </AppText>
                )}
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
