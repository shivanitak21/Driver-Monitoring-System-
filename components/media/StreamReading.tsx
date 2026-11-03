import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Glass } from "@/components/ui/Glass";
import { AppText } from "@/components/ui/AppText";
import { clock } from "@/constants/format";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";
import type { AnalysisSide, MediaChannel } from "@/types/domain";

type Layout = "both" | MediaChannel;

export type ReadingTone = "plain" | "ok" | "caution" | "danger";

const DANGER_TEXT =
  /asleep|sleeping|unconscious|eyes closed|passed out|slumped|no driver|weapon|\bsmoke\b|panic|fight|altercation|unattended|seizure/;

const CAUTION_TEXT =
  /on a call|on call|phone call|calling|video call|looking away|looks away|looked away|looking aside|looking down|looking up|looking at (the |a )?phone|not looking|eyes off|head turned|turned away|facing away|looking (left|right|back)|distract|texting|eating|smoking|drinking|yawning|drowsy|sleepy|phone|cigarette|reaching|lying|argument/;

function observationText(value: unknown): string {
  if (typeof value === "string") return value.toLowerCase();
  if (Array.isArray(value)) return value.map(observationText).join(" ");
  if (value && typeof value === "object") return Object.values(value).map(observationText).join(" ");
  return "";
}

/** Light wash behind the line. Plain stays unboxed. */
export function readingTone(side: AnalysisSide | null | undefined): ReadingTone {
  if (!side) return "plain";
  const spoken = [side.description, side.scene, cameraReading(side) ?? ""].join(" ").toLowerCase();
  const hazards = side.hazards.map((item) => item.toLowerCase()).filter(Boolean);
  const noted = observationText(side.observations);
  const text = `${spoken} ${hazards.join(" ")} ${noted}`;
  const observations = side.observations ?? {};
  const aggression = String(observations.aggression ?? "").toLowerCase();
  const gaze = typeof observations.gaze === "string" ? observations.gaze.toLowerCase() : "";

  const danger =
    aggression === "panic" ||
    observations.weaponOrSmoke === true ||
    observations.childUnattended === true ||
    hazards.some((item) => DANGER_TEXT.test(item)) ||
    DANGER_TEXT.test(text);
  if (danger) return "danger";

  const caution =
    aggression === "argument" ||
    observations.viewBlocked === true ||
    observations.cameraBlocked === true ||
    observations.handsOnWheel === false ||
    (gaze !== "" && gaze !== "forward") ||
    hazards.length > 0 ||
    CAUTION_TEXT.test(text);
  if (caution) return "caution";

  const clear =
    aggression === "calm" ||
    observations.handsOnWheel === true ||
    gaze === "forward";
  if (clear && hazards.length === 0) return "ok";
  return "plain";
}

export function cameraReading(side: AnalysisSide | null | undefined): string | null {
  if (!side) return null;
  const description = side.description?.trim();
  if (description) return description;
  const scene = side.scene?.trim();
  if (scene && scene.toLowerCase() !== "short") return scene;
  const hazards = side.hazards.filter(Boolean);
  if (hazards.length) return hazards.join(", ");
  return null;
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
  const text = cameraReading(side);
  if (!text) return null;
  return (
    <View style={{ gap: 2 }}>
      <AppText variant="caption" style={{ color: colors.signal }}>
        {title}
      </AppText>
      <AppText variant="body" style={{ fontSize: 15, lineHeight: 20 }}>
        {text}
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
  const showDriver = (layout === "both" || layout === "dms") && Boolean(cameraReading(analysis?.dms));
  const showCabin = (layout === "both" || layout === "cms") && Boolean(cameraReading(analysis?.cms));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: { paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
        rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
      }),
    [colors.line],
  );

  if (!analysisError && !showDriver && !showCabin) return null;

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
