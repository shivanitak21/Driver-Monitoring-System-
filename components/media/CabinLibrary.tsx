import { useMemo } from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { clock } from "@/constants/format";
import { useTheme } from "@/providers/ThemeProvider";
import type { GuardianRecording, GuardianSnapshot } from "@/types/domain";

type Props = {
  recordings: GuardianRecording[];
  snapshots: GuardianSnapshot[];
};

export function CabinLibrary({ recordings, snapshots }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          borderRadius: 18,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.line,
          backgroundColor: colors.bgRaised,
          padding: 14,
          gap: 14,
        },
        block: { gap: 8 },
        row: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          paddingVertical: 8,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.line,
        },
        snaps: { gap: 10, paddingVertical: 4 },
        snap: {
          width: 112,
          gap: 6,
        },
        thumb: {
          width: 112,
          height: 84,
          borderRadius: 12,
          backgroundColor: colors.bgSoft,
        },
      }),
    [colors],
  );

  if (recordings.length === 0 && snapshots.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <AppText variant="strong">Your library</AppText>

      {snapshots.length > 0 ? (
        <View style={styles.block}>
          <AppText variant="caption">{snapshots.length} snaps</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.snaps}>
            {snapshots.slice(0, 12).map((snap) => (
              <Pressable
                key={snap.id}
                style={styles.snap}
                onPress={() => void Linking.openURL(snap.imageUrl)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${snap.channel} snap`}
              >
                <Image source={{ uri: snap.imageUrl }} style={styles.thumb} resizeMode="cover" />
                <AppText variant="caption" numberOfLines={1}>
                  {snap.channel === "cms" ? "Cabin" : "Driver"} · {clock(snap.at)}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {recordings.length > 0 ? (
        <View style={styles.block}>
          <AppText variant="caption">{recordings.length} recordings</AppText>
          {recordings.slice(0, 8).map((rec) => (
            <View key={rec.id} style={styles.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="strong" style={{ fontSize: 14 }}>
                  {rec.status}
                  {rec.audio ? " · audio" : ""}
                </AppText>
                <AppText variant="caption">{clock(rec.startedAt)}</AppText>
              </View>
              {rec.status === "ready" && rec.videoUrl ? (
                <Pressable onPress={() => void Linking.openURL(rec.videoUrl!)} hitSlop={8}>
                  <AppText variant="caption" style={{ color: colors.signal }}>
                    Play MP4
                  </AppText>
                </Pressable>
              ) : (
                <AppText variant="caption" style={{ color: colors.inkFaint }}>
                  {rec.status === "recording"
                    ? "In progress"
                    : rec.status === "stopping"
                      ? "Uploading…"
                      : "No file yet"}
                </AppText>
              )}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
