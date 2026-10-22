import type { RiskSeverity } from "@/types/domain";

const VLM_MIN_CONFIDENCE = 0.6;

const VLM_POINTS: Record<string, number> = {
  phone: 2,
  reaching: 2,
  lying_down: 2,
  unusual_object: 3,
  altercation: 5,
};

const FATIGUE_POINTS: Record<string, number> = {
  drowsiness: 3,
  eye_state: 3,
  yawn: 1,
};

const ACTIVITY_POINTS: Record<string, number> = {
  "Phone Use": 3,
  Drinking: 2,
  Cigarette: 2,
};

export type VlmReading = {
  event?: string;
  confidence?: number;
};

export type RiskAssessment = {
  score: number;
  severity: RiskSeverity;
  action: "none" | "warning" | "incident";
  parts: string[];
};

function parseReason(item: string): [string, string] {
  const body = item.includes("@") ? item.slice(0, item.lastIndexOf("@")) : item;
  const split = body.indexOf(":");
  if (split === -1) return [body, ""];
  return [body.slice(0, split), body.slice(split + 1)];
}

function fatigue(parsed: Array<[string, string]>) {
  const scores = parsed
    .filter(([task]) => task in FATIGUE_POINTS)
    .map(([task]) => FATIGUE_POINTS[task]);
  return scores.length ? Math.max(...scores) : 0;
}

function attention(parsed: Array<[string, string]>) {
  let score = 0;
  if (parsed.some(([task]) => task === "distraction")) score += 2;
  if (parsed.some(([task]) => task === "gaze")) score += 1;
  return Math.min(score, 3);
}

function activity(parsed: Array<[string, string]>) {
  const scores = parsed
    .filter(([task, label]) => task === "activity" && label in ACTIVITY_POINTS)
    .map(([, label]) => ACTIVITY_POINTS[label]);
  return scores.length ? Math.max(...scores) : 0;
}

function phoneContext(parsed: Array<[string, string]>) {
  return parsed.some(
    ([task, label]) =>
      task === "distraction" || task === "gaze" || (task === "activity" && label === "Phone Use"),
  );
}

function vlmPoints(vlm: VlmReading | null, parsed: Array<[string, string]>) {
  if (!vlm?.event || !(vlm.event in VLM_POINTS)) return ["", 0] as const;
  const confidence = typeof vlm.confidence === "number" ? vlm.confidence : null;
  if (confidence === null || Number.isNaN(confidence) || confidence < VLM_MIN_CONFIDENCE) {
    return ["", 0] as const;
  }
  let points = VLM_POINTS[vlm.event];
  if (vlm.event === "phone" && phoneContext(parsed)) points = 3;
  return [vlm.event, points] as const;
}

function severityFor(score: number): RiskSeverity {
  if (score >= 5) return "high";
  if (score >= 3) return "medium";
  if (score >= 1) return "low";
  return "none";
}

/**
 * Same starting policy as the vehicle pipeline in DMS-CMS `risk.py`.
 * Points join one driver-monitor hold and one cabin event. They are not a validated safety model.
 */
export function assess(
  dmsReasons: string[] | null,
  vlm: VlmReading | null,
  sos: boolean,
): RiskAssessment {
  if (sos) {
    return { score: 11, severity: "critical", action: "incident", parts: ["sos"] };
  }

  const parsed = (dmsReasons ?? []).map(parseReason);
  const fatigueScore = fatigue(parsed);
  const attentionScore = attention(parsed);
  const activityScore = activity(parsed);
  const [event, vlmScore] = vlmPoints(vlm, parsed);
  const parts: string[] = [];
  if (fatigueScore) parts.push(`fatigue:${fatigueScore}`);
  if (attentionScore) parts.push(`attention:${attentionScore}`);
  if (activityScore) parts.push(`activity:${activityScore}`);
  if (vlmScore) parts.push(`vlm:${event}:${vlmScore}`);

  const score = fatigueScore + attentionScore + activityScore + vlmScore;
  const severity = severityFor(score);
  const action = score >= 5 ? "incident" : score >= 3 ? "warning" : "none";
  return { score, severity, action, parts };
}

export function riskLine(assessment: RiskAssessment) {
  const parts = assessment.parts.join(" ");
  return parts ? `${assessment.severity} ${assessment.score} ${parts}` : `${assessment.severity} ${assessment.score}`;
}
