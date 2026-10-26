import { useEffect, useRef, useState } from "react";

import type { Coordinate } from "@/types/domain";

type Pose = Coordinate & { heading: number };

function wrap(delta: number) {
  let value = delta;
  while (value > 180) value -= 360;
  while (value < -180) value += 360;
  return value;
}

export function useSmoothPose(position: Coordinate, heading: number, reduceMotion: boolean): Pose {
  const displayed = useRef<Pose>({ ...position, heading });
  const target = useRef<Pose>({ ...position, heading });
  const [, setFrame] = useState(0);
  target.current = { latitude: position.latitude, longitude: position.longitude, heading };

  useEffect(() => {
    if (reduceMotion) {
      displayed.current = { ...target.current };
      setFrame((value) => value + 1);
      return;
    }

    let alive = true;
    let last = 0;
    let raf = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!alive || now - last < 80) return;
      last = now;
      const current = displayed.current;
      const next = target.current;
      const latD = next.latitude - current.latitude;
      const lngD = next.longitude - current.longitude;
      const headingD = wrap(next.heading - current.heading);
      const jump = Math.abs(latD) > 0.02 || Math.abs(lngD) > 0.02;
      const settled = Math.abs(latD) < 0.000002 && Math.abs(lngD) < 0.000002 && Math.abs(headingD) < 0.35;
      if (settled) return;
      const step = jump ? 1 : 0.28;
      displayed.current = {
        latitude: current.latitude + latD * step,
        longitude: current.longitude + lngD * step,
        heading: current.heading + headingD * step,
      };
      setFrame((value) => value + 1);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [reduceMotion]);

  if (reduceMotion) {
    return { latitude: position.latitude, longitude: position.longitude, heading };
  }

  return displayed.current;
}
