type Shape =
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number; fill: string; spin: boolean }
  | {
      kind: "path";
      d: string;
      fill: string;
      stroke?: string;
      strokeWidth?: number;
      spin: boolean;
    };

/** Navigation chevron, tip north. The map rotates it to the live heading. */
const CHEVRON =
  "M48 11C52.6 11 56 14.8 57.2 20.2L73.4 65.2C74.7 68.8 70.8 71.6 67.6 69.2L48 55.2L28.4 69.2C25.2 71.6 21.3 68.8 22.6 65.2L38.8 20.2C40 14.8 43.4 11 48 11Z";

const NOSE = "M48 18.5L57.2 38.5L48 33.2L38.8 38.5Z";

export const carShapes: Shape[] = [
  { kind: "ellipse", cx: 48, cy: 64, rx: 15, ry: 6, fill: "rgba(0,0,0,0.28)", spin: false },
  { kind: "path", d: CHEVRON, fill: "#F4F6F8", stroke: "#1A1E0C", strokeWidth: 2.4, spin: true },
  { kind: "path", d: NOSE, fill: "#D7F76B", spin: true },
];

function shapeXml(shape: Shape) {
  if (shape.kind === "ellipse") {
    return `<ellipse cx="${shape.cx}" cy="${shape.cy}" rx="${shape.rx}" ry="${shape.ry}" fill="${shape.fill}"/>`;
  }
  const stroke = shape.stroke ? ` stroke="${shape.stroke}" stroke-width="${shape.strokeWidth ?? 1}"` : "";
  return `<path d="${shape.d}" fill="${shape.fill}"${stroke} stroke-linejoin="round" stroke-linecap="round"/>`;
}

export function carMarkerSvg(heading: number) {
  const safe = Number.isFinite(heading) ? heading : 0;
  const ground = carShapes.filter((shape) => !shape.spin).map(shapeXml).join("");
  const body = carShapes.filter((shape) => shape.spin).map(shapeXml).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">${ground}<g transform="rotate(${safe} 48 48)">${body}</g></svg>`;
}
