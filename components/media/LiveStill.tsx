import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";

import { AppText } from "@/components/ui/AppText";
import { clock } from "@/constants/format";
import { bustMediaUrl } from "@/services/api/media";
import { useTheme } from "@/providers/ThemeProvider";
import type { LiveFrame } from "@/types/domain";

export function LiveStill({
  frame,
  label,
  staleMs = 15_000,
  height = 220,
  /** Bump on each poll so expo-image reloads even if `at` is unchanged. */
  reloadToken,
}: {
  frame: LiveFrame | null;
  label: string;
  staleMs?: number;
  height?: number;
  reloadToken?: number;
}) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const ageMs = frame ? Math.abs(Date.now() - frame.at) : Number.POSITIVE_INFINITY;
  const stale = !frame || ageMs > staleMs;
  const uri = frame
    ? bustMediaUrl(frame.imageUrl, reloadToken != null ? reloadToken : frame.at)
    : "";

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        frame: {
          height,
          borderRadius: 24,
          overflow: "hidden",
          backgroundColor: colors.bgSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.line,
          justifyContent: "center",
        },
        image: { width: "100%", height: "100%" },
        tag: {
          position: "absolute",
          left: 12,
          bottom: 12,
          paddingHorizontal: 11,
          paddingVertical: 7,
          borderRadius: 12,
          backgroundColor: colors.glass,
          maxWidth: "90%",
        },
        empty: { padding: 18, gap: 6 },
      }),
    [colors, height],
  );

  return (
    <View style={styles.frame}>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="cover"
          transition={120}
          cachePolicy="none"
          recyclingKey={`${uri}-${reloadToken ?? frame?.at ?? 0}`}
          onError={() => setFailed(true)}
          onLoad={() => setFailed(false)}
        />
      ) : (
        <View style={styles.empty}>
          <AppText variant="strong">{label}</AppText>
          <AppText variant="caption">
            {failed
              ? "Image failed to load — check HTTP cleartext / network."
              : "Waiting for GET /frames/live …"}
          </AppText>
        </View>
      )}
      <View style={styles.tag}>
        <AppText variant="caption" numberOfLines={1}>
          {label}
          {frame ? ` · ${clock(frame.at)}` : ""}
          {stale ? " · stale" : " · live"}
        </AppText>
      </View>
    </View>
  );
}
