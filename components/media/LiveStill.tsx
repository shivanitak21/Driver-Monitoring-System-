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
  /** Fill a parent frame: no chrome, name only. */
  embedded = false,
  /** Extra top space so a control above the picture does not cover the name. */
  tagClearance = 0,
  hideTag = false,
}: {
  frame: LiveFrame | null;
  label: string;
  staleMs?: number;
  height?: number;
  reloadToken?: number;
  embedded?: boolean;
  tagClearance?: number;
  hideTag?: boolean;
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
          flex: embedded ? 1 : undefined,
          height: embedded ? undefined : height,
          borderRadius: embedded ? 0 : 24,
          overflow: "hidden",
          backgroundColor: "#0C0D10",
          borderWidth: embedded ? 0 : StyleSheet.hairlineWidth,
          borderColor: colors.line,
          justifyContent: "center",
        },
        image: { width: "100%", height: "100%" },
        tag: {
          position: "absolute",
          left: embedded ? 0 : 12,
          right: embedded ? 0 : undefined,
          top: embedded ? 12 + tagClearance : undefined,
          bottom: embedded ? undefined : 12,
          alignItems: embedded ? "center" : undefined,
        },
        tagPill: {
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: "rgba(9,10,12,0.55)",
          maxWidth: "70%",
        },
        empty: { padding: 18, alignItems: "center" },
      }),
    [colors.line, embedded, height, tagClearance],
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
          <AppText variant="caption" style={{ color: "#F5F6F7" }}>
            {failed ? "Couldn’t load" : label}
          </AppText>
        </View>
      )}
      {uri && !failed && !hideTag ? (
        <View style={styles.tag} pointerEvents="none">
          <View style={styles.tagPill}>
            <AppText variant="caption" numberOfLines={1} style={{ color: "#F5F6F7" }}>
              {label}
              {!embedded && frame ? ` · ${clock(frame.at)}` : ""}
              {!embedded ? (stale ? " · stale" : " · live") : ""}
            </AppText>
          </View>
        </View>
      ) : null}
    </View>
  );
}
