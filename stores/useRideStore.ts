import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  LIVE_CUES,
  LIVE_TRIP_ID,
  driverProfile,
  initialGuardians,
  passenger,
} from "@/data/fleet";
import { DESTINATION_LABEL, ORIGIN_LABEL, labelAt, routeTotalM, sampleAt, shiftCoordinate } from "@/data/route";
import { services } from "@/services/createServices";
import { assess, riskLine, type RiskAssessment } from "@/services/risk";
import type {
  AlertKind,
  CallMode,
  CallSession,
  Coordinate,
  DriverState,
  Guardian,
  GuardianNotice,
  SafetyAlert,
  SafetyStatus,
} from "@/types/domain";

const HOUR = 1000 * 60 * 60;

let sequence = 1;
function uid(prefix: string) {
  sequence += 1;
  return `${prefix}-${sequence}`;
}

const COPY: Record<AlertKind, { title: string; detail: string; evidence?: boolean }> = {
  harsh_braking: {
    title: "Harsh braking",
    detail: "Longitudinal deceleration crossed the ride threshold.",
    evidence: true,
  },
  route_deviation: {
    title: "Route deviation",
    detail: "The vehicle left the expected corridor toward UB City.",
  },
  suspicious_activity: {
    title: "Suspicious activity",
    detail: "Cabin model flagged an unusual object above the confidence gate.",
    evidence: true,
  },
  drowsiness: {
    title: "Driver drowsiness",
    detail: "Driver monitor held a drowsiness and eye-state signal.",
    evidence: true,
  },
  distraction: {
    title: "Driver distraction",
    detail: "Gaze left the road corridor. Attention points were applied.",
    evidence: true,
  },
  seat_occupancy: {
    title: "Seat occupancy",
    detail: "Rear left remains occupied. The front passenger seat is empty.",
  },
  sos: {
    title: "SOS raised",
    detail: "Incident signal published for the guardians sharing this ride.",
    evidence: true,
  },
};

function assessmentFor(kind: AlertKind): RiskAssessment {
  switch (kind) {
    case "distraction":
      return assess(["distraction@0.74", "gaze:off-road@0.66"], null, false);
    case "drowsiness":
      return assess(["drowsiness@0.81", "eye_state:closed@0.70"], null, false);
    case "suspicious_activity":
      return assess(["activity:Phone Use@0.80"], { event: "unusual_object", confidence: 0.72 }, false);
    case "sos":
      return assess([], null, true);
    default:
      return assess([], null, false);
  }
}

function severityFor(kind: AlertKind): SafetyAlert["severity"] {
  if (kind === "sos") return "critical";
  if (kind === "suspicious_activity") return "high";
  if (kind === "seat_occupancy") return "info";
  return "medium";
}

function makeAlert(
  kind: AlertKind,
  coordinate: Coordinate,
  locationLabel: string,
  options?: { id?: string; at?: number; acknowledged?: boolean; tripId?: string },
): SafetyAlert {
  const copy = COPY[kind];
  return {
    id: options?.id ?? uid(kind),
    tripId: options?.tripId ?? LIVE_TRIP_ID,
    kind,
    severity: severityFor(kind),
    title: copy.title,
    detail: copy.detail,
    at: options?.at ?? Date.now(),
    locationLabel,
    coordinate,
    acknowledged: options?.acknowledged ?? false,
    evidenceId: copy.evidence ? uid("evidence") : undefined,
    origin: "simulated",
  };
}

const calm = assess([], null, false);
const startDistance = routeTotalM * 0.14;
const startSample = sampleAt(startDistance);

function statusFrom(alerts: SafetyAlert[], risk: RiskAssessment): SafetyStatus {
  const open = alerts.filter((alert) => !alert.acknowledged && alert.tripId === LIVE_TRIP_ID);
  if (open.some((alert) => alert.kind === "sos" || alert.severity === "critical")) return "emergency";
  if (risk.severity === "critical" || risk.severity === "high") return "emergency";
  if (open.some((alert) => alert.severity === "high" || alert.severity === "medium")) return "caution";
  if (risk.severity === "medium") return "caution";
  return "safe";
}

function safetyIndex(status: SafetyStatus, score: number) {
  if (status === "emergency") return Math.max(8, 32 - score);
  if (status === "caution") return Math.max(46, 80 - score * 4);
  return Math.min(98, Math.max(84, 100 - score * 3));
}

const earlier = pointBack(0.62);
const yesterdayPoint = pointBack(0.22);

function pointBack(ratio: number) {
  return sampleAt(routeTotalM * ratio).coordinate;
}

const seededAlerts: SafetyAlert[] = [
  makeAlert("distraction", earlier, "Trinity Circle", {
    id: "alert-distraction",
    at: Date.now() - 1000 * 60 * 8,
    acknowledged: false,
  }),
  makeAlert("route_deviation", pointBack(0.33), "Old Madras Road", {
    id: "alert-deviation",
    at: Date.now() - 1000 * 60 * 18,
    acknowledged: true,
  }),
  makeAlert("seat_occupancy", pointBack(0.5), "Cubbon Park edge", {
    id: "alert-seats",
    at: Date.now() - 1000 * 60 * 15,
    acknowledged: true,
  }),
  makeAlert("harsh_braking", pointBack(0.4), "Old Madras Road", {
    id: "alert-brake",
    at: Date.now() - 1000 * 60 * 24,
    acknowledged: true,
  }),
  makeAlert("drowsiness", yesterdayPoint, "UB City", {
    id: "alert-drowsy",
    at: Date.now() - HOUR * 26,
    acknowledged: true,
    tripId: "ride-1790",
  }),
  makeAlert("suspicious_activity", yesterdayPoint, "Cubbon Park edge", {
    id: "alert-suspicious",
    at: Date.now() - HOUR * 24 * 6,
    acknowledged: false,
    tripId: "ride-1702",
  }),
];

type RideState = {
  booting: boolean;
  follow: boolean;
  offlineOverride: boolean;
  feedFault: boolean;
  cabinConsent: boolean;
  showDeviceLocation: boolean;
  deviceFix: Coordinate | null;
  routeShift: Coordinate | null;
  sosPrompt: boolean;
  distanceM: number;
  direction: 1 | -1;
  position: Coordinate;
  heading: number;
  speedKmh: number;
  trail: Coordinate[];
  etaMin: number;
  leg: "outbound" | "return";
  risk: RiskAssessment;
  driverState: DriverState;
  driverUntil: number;
  fired: string[];
  alerts: SafetyAlert[];
  guardians: Guardian[];
  notices: GuardianNotice[];
  call: CallSession | null;
  shareLink: string | null;
  tick: (dtMs: number) => void;
  setFollow: (value: boolean) => void;
  acknowledge: (id: string) => void;
  acknowledgeAll: () => void;
  askSos: () => void;
  cancelSos: () => void;
  confirmSos: () => Promise<void>;
  shareTrip: () => Promise<void>;
  toggleSharing: (id: string) => void;
  addGuardian: (input: { name: string; relationship: string; phone: string }) => void;
  removeGuardian: (id: string) => void;
  setCabinConsent: (value: boolean) => void;
  setFeedFault: (value: boolean) => void;
  setOfflineOverride: (value: boolean) => void;
  setShowDeviceLocation: (value: boolean) => void;
  setDeviceFix: (fix: Coordinate | null) => void;
  placeOnPhone: (fix: Coordinate) => void;
  startCall: (mode: CallMode) => void;
  patchCall: (patch: Partial<CallSession>) => void;
  endCall: () => void;
};

function deriveMotion(distanceM: number, direction: 1 | -1) {
  const sampled = sampleAt(distanceM);
  const heading = direction === 1 ? sampled.heading : (sampled.heading + 180) % 360;
  const speedKmh = Math.round(30 + 8 * Math.sin(distanceM / 320));
  const remaining = direction === 1 ? routeTotalM - distanceM : distanceM;
  const etaMin = Math.max(1, Math.round(remaining / Math.max(speedKmh / 3.6, 1) / 60));
  return { position: sampled.coordinate, heading, speedKmh, etaMin };
}

const initialMotion = deriveMotion(startDistance, 1);

export const useRideStore = create<RideState>()(
  persist(
    (set, get) => ({
  booting: true,
  follow: true,
  offlineOverride: false,
  feedFault: false,
  cabinConsent: false,
  showDeviceLocation: false,
  deviceFix: null,
  routeShift: null,
  sosPrompt: false,
  distanceM: startDistance,
  direction: 1,
  position: initialMotion.position,
  heading: initialMotion.heading,
  speedKmh: initialMotion.speedKmh,
  trail: [initialMotion.position],
  etaMin: initialMotion.etaMin,
  leg: "outbound",
  risk: calm,
  driverState: "attentive",
  driverUntil: 0,
  fired: [],
  alerts: seededAlerts,
  guardians: initialGuardians,
  notices: [
    {
      id: "notice-seed",
      at: Date.now() - 1000 * 60 * 42,
      title: "Trip shared",
      body: `${passenger.name} is en route to ${DESTINATION_LABEL}.`,
      guardianNames: ["Priya Shah", "Kabir Shah"],
      origin: "simulated",
    },
  ],
  call: null,
  shareLink: `vms://trip/${LIVE_TRIP_ID}`,
  tick: (dtMs) => {
    const state = get();
    let distanceM = state.distanceM + state.direction * (state.speedKmh / 3.6) * (dtMs / 1000);
    let direction = state.direction;
    let leg = state.leg;
    if (distanceM >= routeTotalM) {
      distanceM = routeTotalM;
      direction = -1;
      leg = "return";
    } else if (distanceM <= 0) {
      distanceM = 0;
      direction = 1;
      leg = "outbound";
    }

    const motion = deriveMotion(distanceM, direction);
    const position = shiftCoordinate(motion.position, state.routeShift);
    const trail = [...state.trail, position].slice(-18);
    let risk = state.risk;
    let driverState = state.driverState;
    let driverUntil = state.driverUntil;
    let alerts = state.alerts;
    const fired = [...state.fired];

    if (direction === 1) {
      const ratio = distanceM / routeTotalM;
      for (const cue of LIVE_CUES) {
        if (fired.includes(cue.id) || ratio < cue.at) continue;
        if (alerts.some((alert) => alert.id === cue.id)) {
          fired.push(cue.id);
          continue;
        }
        fired.push(cue.id);
        const locationLabel = state.routeShift ? "Near your phone" : labelAt(distanceM);
        alerts = [makeAlert(cue.kind, position, locationLabel, { id: cue.id }), ...alerts];
        const nextRisk = assessmentFor(cue.kind);
        if (nextRisk.score > 0) risk = nextRisk;
        if (cue.kind === "distraction") {
          driverState = "distracted";
          driverUntil = Date.now() + 45000;
        }
      }
    }

    if (driverUntil && Date.now() > driverUntil) {
      driverState = "attentive";
      driverUntil = 0;
      if (risk.severity !== "critical") risk = calm;
    }

    set({
      distanceM,
      direction,
      leg,
      position,
      heading: motion.heading,
      speedKmh: motion.speedKmh,
      etaMin: motion.etaMin,
      trail,
      risk,
      driverState,
      driverUntil,
      alerts,
      fired,
    });
  },
  setFollow: (follow) => set({ follow }),
  acknowledge: (id) =>
    set({
      alerts: get().alerts.map((alert) => (alert.id === id ? { ...alert, acknowledged: true } : alert)),
    }),
  acknowledgeAll: () =>
    set({ alerts: get().alerts.map((alert) => ({ ...alert, acknowledged: true })) }),
  askSos: () => set({ sosPrompt: true }),
  cancelSos: () => set({ sosPrompt: false }),
  confirmSos: async () => {
    const state = get();
    await services.sos.raise({
      rideId: LIVE_TRIP_ID,
      coordinate: state.position,
      passenger: passenger.name,
    });
    const names = state.guardians.filter((guardian) => guardian.sharing).map((guardian) => guardian.name);
    const notice = await services.guardians.notify({
      names,
      title: "SOS",
      body: `${passenger.name} raised SOS near ${labelAt(state.distanceM)}.`,
    });
    const alert = makeAlert("sos", state.position, labelAt(state.distanceM));
    const risk = assessmentFor("sos");
    set({
      sosPrompt: false,
      risk,
      alerts: [alert, ...state.alerts],
      guardians: state.guardians.map((guardian) =>
        guardian.sharing ? { ...guardian, lastNotifiedAt: Date.now() } : guardian,
      ),
      notices: [
        {
          id: uid("notice"),
          at: Date.now(),
          title: "SOS sent",
          body: notice.note,
          guardianNames: names,
          origin: "simulated",
        },
        ...state.notices,
      ],
    });
  },
  shareTrip: async () => {
    const state = get();
    const names = state.guardians.filter((guardian) => guardian.sharing).map((guardian) => guardian.name);
    const shared = await services.guardians.shareTrip({ rideId: LIVE_TRIP_ID, names });
    set({
      shareLink: shared.link,
      notices: [
        {
          id: uid("notice"),
          at: Date.now(),
          title: "Trip link refreshed",
          body: names.length
            ? `${shared.link} shared with ${names.join(", ")}.`
            : `${shared.link} refreshed. Nobody is sharing this ride.`,
          guardianNames: names,
          origin: "simulated",
        },
        ...state.notices,
      ],
    });
  },
  toggleSharing: (id) =>
    set({
      guardians: get().guardians.map((guardian) =>
        guardian.id === id ? { ...guardian, sharing: !guardian.sharing } : guardian,
      ),
    }),
  addGuardian: (input) =>
    set({
      guardians: [
        ...get().guardians,
        {
          id: uid("guardian"),
          name: input.name.trim(),
          relationship: input.relationship.trim(),
          phone: input.phone.trim(),
          sharing: true,
          lastNotifiedAt: null,
        },
      ],
    }),
  removeGuardian: (id) => set({ guardians: get().guardians.filter((guardian) => guardian.id !== id) }),
  setCabinConsent: (cabinConsent) => set({ cabinConsent }),
  setFeedFault: (feedFault) => set({ feedFault }),
  setOfflineOverride: (offlineOverride) => set({ offlineOverride }),
  setShowDeviceLocation: (showDeviceLocation) => set({ showDeviceLocation }),
  setDeviceFix: (deviceFix) => set({ deviceFix }),
  placeOnPhone: (fix) => {
    const state = get();
    const far =
      Math.abs(state.position.latitude - fix.latitude) > 0.02 ||
      Math.abs(state.position.longitude - fix.longitude) > 0.02;
    if (state.routeShift && !far) {
      set({ deviceFix: fix });
      return;
    }
    const sampled = sampleAt(state.distanceM);
    set({
      deviceFix: fix,
      routeShift: {
        latitude: fix.latitude - sampled.coordinate.latitude,
        longitude: fix.longitude - sampled.coordinate.longitude,
      },
      position: fix,
      trail: [fix],
      follow: true,
    });
  },
  startCall: (mode) =>
    set({
      call: {
        mode,
        phase: "requesting",
        startedAt: null,
        muted: false,
        hardware: false,
      },
    }),
  patchCall: (patch) => {
    const call = get().call;
    if (!call) return;
    set({ call: { ...call, ...patch } });
  },
  endCall: () => {
    const call = get().call;
    if (!call) return;
    set({ call: { ...call, phase: "ended" } });
    setTimeout(() => {
      if (get().call?.phase === "ended") set({ call: null });
    }, 700);
  },
    }),
    {
      name: "vms",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        cabinConsent: state.cabinConsent,
        showDeviceLocation: state.showDeviceLocation,
        offlineOverride: state.offlineOverride,
        guardians: state.guardians,
        notices: state.notices,
        alerts: state.alerts,
        fired: state.fired,
      }),
    },
  ),
);

export function useSafetyIndex() {
  const alerts = useRideStore((state) => state.alerts);
  const risk = useRideStore((state) => state.risk);
  const status = statusFrom(alerts, risk);
  return {
    status,
    index: safetyIndex(status, risk.score),
    line: riskLine(risk),
    risk,
  };
}

export function tripHeadline(leg: "outbound" | "return", local = false) {
  if (local) {
    return leg === "return"
      ? { from: "Nearby loop", to: "Your location", status: "Returning" }
      : { from: "Your location", to: "Nearby loop", status: "On route" };
  }
  if (leg === "return") {
    return { from: DESTINATION_LABEL, to: ORIGIN_LABEL, status: "Returning" };
  }
  return { from: ORIGIN_LABEL, to: DESTINATION_LABEL, status: "On route" };
}

export const rideMeta = {
  tripId: LIVE_TRIP_ID,
  passenger,
  driver: driverProfile,
  origin: ORIGIN_LABEL,
  destination: DESTINATION_LABEL,
};
