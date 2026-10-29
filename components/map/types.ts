import type { Coordinate } from "@/types/domain";

export type RideMapProps = {
  route: Coordinate[];
  trail: Coordinate[];
  position: Coordinate;
  heading: number;
  destination?: Coordinate | null;
  origin?: Coordinate | null;
  follow: boolean;
  deviceFix: Coordinate | null;
  onPan: () => void;
  onPressVehicle: () => void;
};
