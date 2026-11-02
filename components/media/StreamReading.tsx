import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Glass } from "@/components/ui/Glass";
import { AppText } from "@/components/ui/AppText";
import { clock } from "@/constants/format";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";
import type { AnalysisSide, MediaChannel } from "@/types/domain";

type Layout = "both" | MediaChannel;

function line(side: AnalysisSide | null | undefined): string {
  if (!side) return "Waiting for a reading from the car.";
  const description = side.description?.trim();
  if (description) return description;
  const scene = side.scene?.trim();
  if (scene && scene.toLowerCase() !== "short") return scene;
  const hazards = side.hazards.filter(Boolean);
  if (hazards.length) return hazards.join(", ");
  return "The car sent a reading without a scene description.";
}

function meta(side: AnalysisSide | null | undefined): string | null {
  if (!side) return null;
  const parts = [
    Number.isFinite(side.confidence) ? `${Math.round(side.confidence * 100)}%` : null,
    side.at ? clock(side.at) : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

function Row({ title, side }: { title: string; side: AnalysisSide | null | undefined }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 2 }}>
      <AppText variant="caption" style={{ color: colors.signal }}>
        {title}
      </AppText>
      <AppText variant="body" style={{ fontSize: 15, lineHeight: 20 }}>
        {line(side)}
      </AppText>
      {meta(side) ? <AppText variant="caption">{meta(side)}</AppText> : null}
    </View>
  );
}

/** VLM reading for the cameras on screen. Sits with the live picture. */
export function StreamReading({ layout }: { layout: Layout }) {
  const { colors } = useTheme();
  const analysis = useRideStore((state) => state.analysis);
  const analysisError = useRideStore((state) => state.analysisError);
  const showDriver = layout === "both" || layout === "dms";
  const showCabin = layout === "both" || layout === "cms";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: { paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
        rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
      }),
    [colors.line],
  );

  return (
    <Glass radius={18}>
      <View style={styles.body}>
        {analysisError ? <AppText variant="caption">{analysisError}</AppText> : null}
        {showDriver ? <Row title="Driver" side={analysis?.dms} /> : null}
        {showDriver && showCabin ? <View style={styles.rule} /> : null}
        {showCabin ? <Row title="Cabin" side={analysis?.cms} /> : null}
      </View>
    </Glass>
  );
}
