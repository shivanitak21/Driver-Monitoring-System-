import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  DEVICE_ID,
  LIVE_TRIP_ID,
  driverProfile,
  initialGuardians,
  initialSeats,
  passenger,
} from "@/data/fleet";
import { DESTINATION_LABEL, ORIGIN_LABEL, labelAt, routeTotalM, sampleAt, shiftCoordinate } from "@/data/route";
import { defaultDeviceId, defaultRideId } from "@/services/api/config";
import type { AlertStatusFilter, RideDto } from "@/services/api/types";
import { describeServiceError, services } from "@/services/createServices";
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
  Seat,
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

function pointBack(ratio: number) {
  return sampleAt(routeTotalM * ratio).coordinate;
}

const earlier = pointBack(0.62);
const yesterdayPoint = pointBack(0.22);

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

export type ConnectionState = "idle" | "connecting" | "live" | "degraded" | "error";

type RideState = {
  liveMode: boolean;
  rideId: string;
  deviceId: string;
  booting: boolean;
  refreshing: boolean;
  connection: ConnectionState;
  connectionError: string | null;
  lastSyncedAt: number | null;
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
  speedKmh: number | null;
  trail: Coordinate[];
  etaMin: number | null;
  leg: "outbound" | "return";
  risk: RiskAssessment;
  driverState: DriverState;
  driverUntil: number;
  safetyStatus: SafetyStatus;
  score: number;
  seats: Seat[];
  passengerName: string;
  deviceState: string;
  updatedAt: string | null;
  shareLink: string | null;
  fired: string[];
  alerts: SafetyAlert[];
  guardians: Guardian[];
  notices: GuardianNotice[];
  call: CallSession | null;
  tick: (dtMs: number) => void;
  setFollow: (value: boolean) => void;
  acknowledge: (id: string) => Promise<void>;
  acknowledgeAll: () => Promise<void>;
  askSos: () => void;
  cancelSos: () => void;
  confirmSos: () => Promise<void>;
  shareTrip: () => Promise<void>;
  toggleSharing: (id: string) => Promise<void>;
  addGuardian: (input: { name: string; relationship: string; phone: string }) => Promise<void>;
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
  applyRide: (ride: RideDto) => void;
  prependAlert: (alert: SafetyAlert) => void;
  setConnection: (connection: ConnectionState, error?: string | null) => void;
  bootstrapLive: () => Promise<void>;
  refreshAlerts: (status?: AlertStatusFilter) => Promise<void>;
  refreshGuardians: () => Promise<void>;
  refreshNotices: () => Promise<void>;
  refreshCabin: () => Promise<void>;
  refreshAll: () => Promise<void>;
  publishTelemetry: (fix: Coordinate) => Promise<void>;
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
const liveMode = services.live;

function mergeAlert(alerts: SafetyAlert[], alert: SafetyAlert): SafetyAlert[] {
  const without = alerts.filter((item) => item.id !== alert.id);
  return [alert, ...without].sort((a, b) => b.at - a.at);
}

export const useRideStore = create<RideState>()(
  persist(
    (set, get) => ({
      liveMode,
      rideId: defaultRideId(),
      deviceId: defaultDeviceId(),
      booting: true,
      refreshing: false,
      connection: liveMode ? "connecting" : "idle",
      connectionError: null,
      lastSyncedAt: null,
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
      speedKmh: liveMode ? null : initialMotion.speedKmh,
      trail: liveMode ? [] : [initialMotion.position],
      etaMin: liveMode ? null : initialMotion.etaMin,
      leg: "outbound",
      risk: calm,
      driverState: "attentive",
      driverUntil: 0,
      safetyStatus: "safe",
      score: 98,
      seats: liveMode ? [] : initialSeats,
      passengerName: liveMode ? "" : passenger.name,
      deviceState: liveMode ? "unknown" : "online",
      updatedAt: null,
      shareLink: `vms://trip/${defaultRideId()}`,
      fired: [],
      alerts: liveMode ? [] : seededAlerts,
      guardians: liveMode ? [] : initialGuardians,
      notices: liveMode
        ? []
        : [
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
      tick: (dtMs) => {
        if (get().liveMode) return;
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
          for (const cue of [
            { id: "cue-deviation", at: 0.3, kind: "route_deviation" as const },
            { id: "cue-distract", at: 0.48, kind: "distraction" as const },
            { id: "cue-brake", at: 0.66, kind: "harsh_braking" as const },
            { id: "cue-seat", at: 0.82, kind: "seat_occupancy" as const },
          ]) {
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

        const nextStatus = statusFrom(alerts, risk);
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
          safetyStatus: nextStatus,
          score: safetyIndex(nextStatus, risk.score),
        });
      },
      setFollow: (follow) => set({ follow }),
      acknowledge: async (id) => {
        const state = get();
        if (state.liveMode && services.api) {
          try {
            const alert = await services.api.acknowledgeAlert(id);
            set({ alerts: mergeAlert(get().alerts, alert), lastSyncedAt: Date.now() });
          } catch (error) {
            set({ connectionError: describeServiceError(error) });
            throw error;
          }
          return;
        }
        set({
          alerts: state.alerts.map((alert) => (alert.id === id ? { ...alert, acknowledged: true } : alert)),
        });
      },
      acknowledgeAll: async () => {
        const state = get();
        const open = state.alerts.filter((alert) => !alert.acknowledged);
        if (state.liveMode && services.api) {
          try {
            for (const alert of open) {
              await services.api.acknowledgeAlert(alert.id);
            }
            await get().refreshAlerts("all");
          } catch (error) {
            set({ connectionError: describeServiceError(error) });
            throw error;
          }
          return;
        }
        set({ alerts: state.alerts.map((alert) => ({ ...alert, acknowledged: true })) });
      },
      askSos: () => set({ sosPrompt: true }),
      cancelSos: () => set({ sosPrompt: false }),
      confirmSos: async () => {
        const state = get();
        try {
          const receipt = await services.sos.raise({
            rideId: state.rideId,
            coordinate: state.position,
            passenger: state.passengerName,
          });

          if (state.liveMode && services.api) {
            const [alerts, guardians, notices, ride] = await Promise.all([
              services.api.listAlerts(state.rideId, "all"),
              services.api.listGuardians(state.rideId),
              services.api.listNotices(state.rideId),
              services.api.getRide(state.rideId),
            ]);
            get().applyRide(ride);
            set({
              sosPrompt: false,
              alerts,
              guardians,
              notices,
              lastSyncedAt: Date.now(),
              connectionError: null,
            });
            return;
          }

          const names = state.guardians.filter((guardian) => guardian.sharing).map((guardian) => guardian.name);
          const notice = await services.guardians.notify({
            names,
            title: "SOS",
            body: `${state.passengerName} raised SOS near ${labelAt(state.distanceM)}.`,
          });
          const alert = makeAlert("sos", state.position, labelAt(state.distanceM), {
            id: receipt.alertId ?? receipt.id,
            at: receipt.at,
          });
          const risk = assessmentFor("sos");
          set({
            sosPrompt: false,
            risk,
            safetyStatus: "emergency",
            score: Math.max(8, state.score - 20),
            alerts: [alert, ...state.alerts],
            guardians: state.guardians.map((guardian) =>
              guardian.sharing ? { ...guardian, lastNotifiedAt: Date.now() } : guardian,
            ),
            notices: [
              {
                id: uid("notice"),
                at: Date.now(),
                title: "SOS sent",
                body: notice.note || receipt.note,
                guardianNames: names,
                origin: "simulated",
              },
              ...state.notices,
            ],
          });
        } catch (error) {
          set({ sosPrompt: false, connectionError: describeServiceError(error) });
          throw error;
        }
      },
      shareTrip: async () => {
        const state = get();
        try {
          if (state.liveMode && services.api) {
            const shared = await services.api.shareTrip(state.rideId);
            const notices = await services.api.listNotices(state.rideId);
            set({
              shareLink: shared.link,
              notices,
              lastSyncedAt: Date.now(),
              connectionError: null,
            });
            return;
          }
          const names = state.guardians.filter((guardian) => guardian.sharing).map((guardian) => guardian.name);
          const shared = await services.guardians.shareTrip({ rideId: state.rideId, names });
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
        } catch (error) {
          set({ connectionError: describeServiceError(error) });
          throw error;
        }
      },
      toggleSharing: async (id) => {
        const state = get();
        if (state.liveMode && services.api) {
          try {
            const result = await services.api.toggleSharing(state.rideId, id);
            set({
              guardians: state.guardians.map((guardian) =>
                guardian.id === result.id ? { ...guardian, sharing: result.sharing } : guardian,
              ),
              connectionError: null,
            });
          } catch (error) {
            set({ connectionError: describeServiceError(error) });
            throw error;
          }
          return;
        }
        set({
          guardians: state.guardians.map((guardian) =>
            guardian.id === id ? { ...guardian, sharing: !guardian.sharing } : guardian,
          ),
        });
      },
      addGuardian: async (input) => {
        const state = get();
        if (state.liveMode && services.api) {
          try {
            await services.api.addGuardian(state.rideId, {
              name: input.name.trim(),
              relationship: input.relationship.trim(),
              phone: input.phone.trim(),
              sharing: true,
            });
            const guardians = await services.api.listGuardians(state.rideId);
            set({ guardians, connectionError: null, lastSyncedAt: Date.now() });
          } catch (error) {
            set({ connectionError: describeServiceError(error) });
            throw error;
          }
          return;
        }
        set({
          guardians: [
            ...state.guardians,
            {
              id: uid("guardian"),
              name: input.name.trim(),
              relationship: input.relationship.trim(),
              phone: input.phone.trim(),
              sharing: true,
              lastNotifiedAt: null,
            },
          ],
        });
      },
      removeGuardian: (id) => {
        if (get().liveMode) return;
        set({ guardians: get().guardians.filter((guardian) => guardian.id !== id) });
      },
      setCabinConsent: (cabinConsent) => set({ cabinConsent }),
      setFeedFault: (feedFault) => set({ feedFault }),
      setOfflineOverride: (offlineOverride) => set({ offlineOverride }),
      setShowDeviceLocation: (showDeviceLocation) => set({ showDeviceLocation }),
      setDeviceFix: (deviceFix) => set({ deviceFix }),
      placeOnPhone: (fix) => {
        const state = get();
        if (state.liveMode) {
          // Phone fix is the blue dot; vehicle pose still comes from ride/socket.
          set({ deviceFix: fix });
          void get().publishTelemetry(fix);
          return;
        }
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
      applyRide: (ride) => {
        const coordinate =
          ride.position &&
          typeof ride.position.latitude === "number" &&
          typeof ride.position.longitude === "number"
            ? { latitude: ride.position.latitude, longitude: ride.position.longitude }
            : null;
        const state = get();
        set({
          rideId: ride.id || state.rideId,
          deviceId: ride.deviceId || state.deviceId || DEVICE_ID,
          passengerName: ride.passenger || state.passengerName,
          safetyStatus: ride.safetyStatus,
          driverState: ride.driverState,
          deviceState: ride.deviceState || state.deviceState,
          updatedAt: ride.updatedAt || state.updatedAt,
          score: typeof ride.score === "number" ? ride.score : state.score,
          seats: Array.isArray(ride.seats) ? ride.seats : state.seats,
          shareLink: ride.shareLink || state.shareLink,
          etaMin: ride.etaMin === undefined ? state.etaMin : ride.etaMin,
          speedKmh: ride.speedKmh === undefined ? state.speedKmh : ride.speedKmh,
          heading: ride.heading === undefined || ride.heading === null ? state.heading : ride.heading,
          position: coordinate ?? state.position,
          trail: coordinate ? [...state.trail, coordinate].slice(-40) : state.trail,
          lastSyncedAt: Date.now(),
          connectionError: null,
        });
      },
      prependAlert: (alert) => {
        set({ alerts: mergeAlert(get().alerts, alert) });
      },
      setConnection: (connection, error = null) => set({ connection, connectionError: error }),
      bootstrapLive: async () => {
        if (!services.api) {
          set({ booting: false, connection: "idle", liveMode: false });
          return;
        }
        set({ liveMode: true, connection: "connecting", connectionError: null, booting: true });
        try {
          const health = await services.api.health();
          const rideId = health.ride || get().rideId || defaultRideId();
          const [ride, alerts, guardians, notices] = await Promise.all([
            services.api.getRide(rideId),
            services.api.listAlerts(rideId, "all"),
            services.api.listGuardians(rideId),
            services.api.listNotices(rideId),
          ]);
          get().applyRide(ride);
          set({
            rideId,
            alerts,
            guardians,
            notices,
            booting: false,
            connection: "live",
            connectionError: null,
            lastSyncedAt: Date.now(),
          });
        } catch (error) {
          set({
            booting: false,
            connection: "error",
            connectionError: describeServiceError(error),
          });
        }
      },
      refreshAlerts: async (status = "all") => {
        if (!services.api) return;
        set({ refreshing: true });
        try {
          const alerts = await services.api.listAlerts(get().rideId, status);
          set({
            alerts: status === "all" ? alerts : mergeFiltered(get().alerts, alerts, status),
            refreshing: false,
            lastSyncedAt: Date.now(),
            connectionError: null,
          });
        } catch (error) {
          set({ refreshing: false, connectionError: describeServiceError(error) });
          throw error;
        }
      },
      refreshGuardians: async () => {
        if (!services.api) return;
        set({ refreshing: true });
        try {
          const guardians = await services.api.listGuardians(get().rideId);
          set({ guardians, refreshing: false, lastSyncedAt: Date.now(), connectionError: null });
        } catch (error) {
          set({ refreshing: false, connectionError: describeServiceError(error) });
          throw error;
        }
      },
      refreshNotices: async () => {
        if (!services.api) return;
        try {
          const notices = await services.api.listNotices(get().rideId);
          set({ notices, lastSyncedAt: Date.now(), connectionError: null });
        } catch (error) {
          set({ connectionError: describeServiceError(error) });
          throw error;
        }
      },
      refreshCabin: async () => {
        if (!services.api) return;
        try {
          const cabin = await services.api.getCabin(get().rideId);
          set({
            driverState: cabin.driverState,
            seats: Array.isArray(cabin.seats) ? cabin.seats : get().seats,
            safetyStatus: cabin.safetyStatus,
            lastSyncedAt: Date.now(),
            connectionError: null,
          });
        } catch (error) {
          set({ connectionError: describeServiceError(error) });
          throw error;
        }
      },
      refreshAll: async () => {
        if (!services.api) return;
        set({ refreshing: true });
        try {
          const rideId = get().rideId;
          const [ride, alerts, guardians, notices] = await Promise.all([
            services.api.getRide(rideId),
            services.api.listAlerts(rideId, "all"),
            services.api.listGuardians(rideId),
            services.api.listNotices(rideId),
          ]);
          get().applyRide(ride);
          set({
            alerts,
            guardians,
            notices,
            refreshing: false,
            connection: "live",
            connectionError: null,
            lastSyncedAt: Date.now(),
          });
        } catch (error) {
          set({
            refreshing: false,
            connection: get().connection === "live" ? "degraded" : "error",
            connectionError: describeServiceError(error),
          });
          throw error;
        }
      },
      publishTelemetry: async (fix) => {
        if (!services.api || !get().liveMode) return;
        try {
          const state = get();
          const body: {
            latitude: number;
            longitude: number;
            heading?: number;
            speedKmh?: number;
            etaMin?: number;
          } = {
            latitude: fix.latitude,
            longitude: fix.longitude,
          };
          if (Number.isFinite(state.heading)) body.heading = state.heading;
          if (typeof state.speedKmh === "number") body.speedKmh = state.speedKmh;
          if (typeof state.etaMin === "number") body.etaMin = state.etaMin;
          const ride = await services.api.postTelemetry(state.rideId, body);
          get().applyRide(ride);
        } catch {
          // Keep the local fix; socket or next refresh will recover.
        }
      },
    }),
    {
      name: "vms",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        cabinConsent: state.cabinConsent,
        showDeviceLocation: state.showDeviceLocation,
        offlineOverride: state.offlineOverride,
        ...(state.liveMode
          ? {}
          : {
              guardians: state.guardians,
              notices: state.notices,
              alerts: state.alerts,
              fired: state.fired,
            }),
      }),
      onRehydrateStorage: () => (state) => {
        if (!state?.liveMode) return;
        state.alerts = [];
        state.guardians = [];
        state.notices = [];
        state.fired = [];
        state.connection = "connecting";
        state.booting = true;
      },
    },
  ),
);

function mergeFiltered(
  current: SafetyAlert[],
  incoming: SafetyAlert[],
  status: AlertStatusFilter,
): SafetyAlert[] {
  if (status === "all") return incoming;
  const incomingIds = new Set(incoming.map((alert) => alert.id));
  const kept = current.filter((alert) => {
    if (incomingIds.has(alert.id)) return false;
    if (status === "open") return alert.acknowledged;
    if (status === "emergency") return !(alert.severity === "high" || alert.severity === "critical");
    if (status === "caution") return !(alert.severity === "info" || alert.severity === "low" || alert.severity === "medium");
    return true;
  });
  return [...incoming, ...kept].sort((a, b) => b.at - a.at);
}

export function useSafetyIndex() {
  const liveMode = useRideStore((state) => state.liveMode);
  const safetyStatus = useRideStore((state) => state.safetyStatus);
  const score = useRideStore((state) => state.score);
  const alerts = useRideStore((state) => state.alerts);
  const risk = useRideStore((state) => state.risk);

  if (liveMode) {
    return {
      status: safetyStatus,
      index: score,
      line: riskLine(riskFromStatus(safetyStatus)),
      risk: riskFromStatus(safetyStatus),
    };
  }

  const status = statusFrom(alerts, risk);
  return {
    status,
    index: safetyIndex(status, risk.score),
    line: riskLine(risk),
    risk,
  };
}

function riskFromStatus(status: SafetyStatus): RiskAssessment {
  if (status === "emergency") return assess([], null, true);
  if (status === "caution") return assess(["caution@0.55"], null, false);
  return calm;
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
  deviceId: DEVICE_ID,
  passenger,
  driver: driverProfile,
  origin: ORIGIN_LABEL,
  destination: DESTINATION_LABEL,
};
