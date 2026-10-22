import { pointOnRoute, routeLine } from "@/data/route";
import type { Guardian, PastTrip, Seat } from "@/types/domain";

export const LIVE_TRIP_ID = "ride-1842";
export const VEHICLE_ID = "bmw-m5";

export const passenger = {
  name: "Meera Shah",
  seat: "Rear left",
  phone: "+91 98450 22011",
};

export const driverProfile = {
  name: "Arun Deshpande",
  code: "DRV-1042",
  note: "Must wear glasses",
};

export const vehicleProfile = {
  id: VEHICLE_ID,
  name: "BMW M5",
  trim: "Competition",
  color: "Alpine White",
  plate: "KA 03 MH 5301",
  cabinId: "CAB-18",
  vinTail: "1842",
};

export const initialSeats: Seat[] = [
  { id: "driver", label: "Driver", occupied: true },
  { id: "front", label: "Front", occupied: false },
  { id: "rear-left", label: "Rear left", occupied: true },
  { id: "rear-right", label: "Rear right", occupied: false },
];

export const initialGuardians: Guardian[] = [
  {
    id: "g-priya",
    name: "Priya Shah",
    relationship: "Mother",
    phone: "+91 98450 11008",
    sharing: true,
    lastNotifiedAt: Date.now() - 1000 * 60 * 42,
  },
  {
    id: "g-kabir",
    name: "Kabir Shah",
    relationship: "Brother",
    phone: "+91 98450 11042",
    sharing: true,
    lastNotifiedAt: Date.now() - 1000 * 60 * 42,
  },
  {
    id: "g-desk",
    name: "North Desk",
    relationship: "Fleet desk",
    phone: "+91 80 4120 0188",
    sharing: false,
    lastNotifiedAt: null,
  },
];

function pastRoute(start: number, end: number) {
  const from = Math.floor(routeLine.length * start);
  const to = Math.max(from + 2, Math.floor(routeLine.length * end));
  return routeLine.slice(from, to);
}

const yesterday = Date.now() - 1000 * 60 * 60 * 26;
const monday = Date.now() - 1000 * 60 * 60 * 24 * 3;
const lastWeek = Date.now() - 1000 * 60 * 60 * 24 * 6;

const evening = pointOnRoute(0.72);
const short = pointOnRoute(0.4);
const interrupted = pointOnRoute(0.22);

export const pastTrips: PastTrip[] = [
  {
    id: "ride-1790",
    originLabel: "UB City",
    destinationLabel: "Indiranagar",
    startedAt: yesterday,
    endedAt: yesterday + 1000 * 60 * 28,
    status: "completed",
    distanceKm: 7.4,
    safetyStatus: "caution",
    route: pastRoute(0.15, 0.95),
    position: evening.coordinate,
    heading: evening.heading,
  },
  {
    id: "ride-1766",
    originLabel: "Cubbon Park",
    destinationLabel: "Indiranagar",
    startedAt: monday,
    endedAt: monday + 1000 * 60 * 22,
    status: "completed",
    distanceKm: 5.1,
    safetyStatus: "safe",
    route: pastRoute(0.4, 1),
    position: short.coordinate,
    heading: short.heading,
  },
  {
    id: "ride-1702",
    originLabel: "Indiranagar",
    destinationLabel: "UB City",
    startedAt: lastWeek,
    endedAt: lastWeek + 1000 * 60 * 11,
    status: "interrupted",
    distanceKm: 2.2,
    safetyStatus: "caution",
    route: pastRoute(0, 0.35),
    position: interrupted.coordinate,
    heading: interrupted.heading,
  },
];

export const LIVE_CUES = [
  { id: "cue-deviation", at: 0.3, kind: "route_deviation" as const },
  { id: "cue-distract", at: 0.48, kind: "distraction" as const },
  { id: "cue-brake", at: 0.66, kind: "harsh_braking" as const },
  { id: "cue-seat", at: 0.82, kind: "seat_occupancy" as const },
];
