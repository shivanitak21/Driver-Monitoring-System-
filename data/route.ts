import type { Coordinate } from "@/types/domain";

const EARTH_M = 6_371_000;

export const ORIGIN_LABEL = "100 Feet Road, Indiranagar";
export const DESTINATION_LABEL = "UB City, Kasturba Road";

const WAYPOINTS: Coordinate[] = [
  { latitude: 12.9784, longitude: 77.6408 },
  { latitude: 12.9772, longitude: 77.6369 },
  { latitude: 12.9756, longitude: 77.6322 },
  { latitude: 12.9739, longitude: 77.6274 },
  { latitude: 12.9724, longitude: 77.6221 },
  { latitude: 12.9712, longitude: 77.6168 },
  { latitude: 12.9708, longitude: 77.6112 },
  { latitude: 12.9716, longitude: 77.6064 },
  { latitude: 12.9728, longitude: 77.6018 },
  { latitude: 12.9734, longitude: 77.5982 },
  { latitude: 12.9726, longitude: 77.5958 },
  { latitude: 12.9716, longitude: 77.5946 },
];

export function haversine(a: Coordinate, b: Coordinate) {
  const φ1 = (a.latitude * Math.PI) / 180;
  const φ2 = (b.latitude * Math.PI) / 180;
  const dφ = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dλ = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h =
    Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function bearing(a: Coordinate, b: Coordinate) {
  const φ1 = (a.latitude * Math.PI) / 180;
  const φ2 = (b.latitude * Math.PI) / 180;
  const λ1 = (a.longitude * Math.PI) / 180;
  const λ2 = (b.longitude * Math.PI) / 180;
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function densify(points: Coordinate[], stepM = 80): Coordinate[] {
  const line: Coordinate[] = [{ ...points[0] }];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const next = points[index];
    const distance = haversine(previous, next);
    const steps = Math.max(1, Math.round(distance / stepM));
    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      line.push({
        latitude: previous.latitude + (next.latitude - previous.latitude) * t,
        longitude: previous.longitude + (next.longitude - previous.longitude) * t,
      });
    }
  }
  return line;
}

type Vertex = Coordinate & { distance: number; heading: number };

function withDistance(points: Coordinate[]): { vertices: Vertex[]; total: number } {
  const vertices: Vertex[] = [];
  let total = 0;
  for (let index = 0; index < points.length; index += 1) {
    if (index > 0) total += haversine(points[index - 1], points[index]);
    const ahead = points[Math.min(index + 1, points.length - 1)];
    const behind = points[Math.max(index - 1, 0)];
    const heading =
      index === points.length - 1 ? bearing(behind, points[index]) : bearing(points[index], ahead);
    vertices.push({ ...points[index], distance: total, heading });
  }
  return { vertices, total };
}

const dense = densify(WAYPOINTS);
const built = withDistance(dense);

export function shiftCoordinate(point: Coordinate, shift: Coordinate | null) {
  if (!shift) return point;
  return {
    latitude: point.latitude + shift.latitude,
    longitude: point.longitude + shift.longitude,
  };
}

export function shiftLine(points: Coordinate[], shift: Coordinate | null) {
  if (!shift) return points;
  return points.map((point) => shiftCoordinate(point, shift));
}

export const routeLine: Coordinate[] = built.vertices.map(({ latitude, longitude }) => ({
  latitude,
  longitude,
}));

export const routeTotalM = built.total;

export const mapSeed = {
  latitude: 12.9742,
  longitude: 77.617,
  latitudeDelta: 0.055,
  longitudeDelta: 0.055,
};

export function sampleAt(distanceM: number) {
  const { vertices, total } = built;
  const distance = Math.min(Math.max(distanceM, 0), total);
  let index = 1;
  while (index < vertices.length && vertices[index].distance < distance) index += 1;
  const next = vertices[Math.min(index, vertices.length - 1)];
  const previous = vertices[Math.max(index - 1, 0)];
  const span = Math.max(next.distance - previous.distance, 0.001);
  const t = (distance - previous.distance) / span;
  return {
    coordinate: {
      latitude: previous.latitude + (next.latitude - previous.latitude) * t,
      longitude: previous.longitude + (next.longitude - previous.longitude) * t,
    },
    heading: previous.heading,
  };
}

const PLACE_MARKS = [
  { at: 0, label: "100 Feet Road" },
  { at: 0.28, label: "Old Madras Road" },
  { at: 0.55, label: "Trinity Circle" },
  { at: 0.78, label: "Cubbon Park edge" },
  { at: 1, label: "UB City" },
];

export function labelAt(distanceM: number) {
  const ratio = routeTotalM === 0 ? 0 : distanceM / routeTotalM;
  let label = PLACE_MARKS[0].label;
  for (const mark of PLACE_MARKS) {
    if (ratio + 0.04 >= mark.at) label = mark.label;
  }
  return label;
}

export function pointOnRoute(ratio: number) {
  return sampleAt(routeTotalM * Math.min(Math.max(ratio, 0), 1));
}
