import { Circle, Line, Path, Polygon, Rect, Svg } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

function frame({ size = 24, color = "#F5F5F7", strokeWidth = 2 }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

export function Bell(props: IconProps) {
  return (
    <Svg {...frame(props)}>
      <Path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <Path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </Svg>
  );
}

export function Car(props: IconProps) {
  return (
    <Svg {...frame(props)}>
      <Path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <Circle cx="7" cy="17" r="2" />
      <Path d="M9 17h6" />
      <Circle cx="17" cy="17" r="2" />
    </Svg>
  );
}

export function ChevronLeft(props: IconProps) {
  return (
    <Svg {...frame(props)}>
      <Path d="m15 18-6-6 6-6" />
    </Svg>
  );
}

export function LocateFixed(props: IconProps) {
  return (
    <Svg {...frame(props)}>
      <Line x1="2" x2="5" y1="12" y2="12" />
      <Line x1="19" x2="22" y1="12" y2="12" />
      <Line x1="12" x2="12" y1="2" y2="5" />
      <Line x1="12" x2="12" y1="19" y2="22" />
      <Circle cx="12" cy="12" r="7" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

export function Navigation(props: IconProps) {
  return (
    <Svg {...frame(props)}>
      <Polygon points="3 11 22 2 13 21 11 13 3 11" />
    </Svg>
  );
}

export function Phone(props: IconProps) {
  return (
    <Svg {...frame(props)}>
      <Path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
    </Svg>
  );
}

export function Route(props: IconProps) {
  return (
    <Svg {...frame(props)}>
      <Circle cx="6" cy="19" r="3" />
      <Path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <Circle cx="18" cy="5" r="3" />
    </Svg>
  );
}

export function Settings(props: IconProps) {
  return (
    <Svg {...frame(props)}>
      <Path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

export function Users(props: IconProps) {
  return (
    <Svg {...frame(props)}>
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <Path d="M16 3.128a4 4 0 0 1 0 7.744" />
      <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <Circle cx="9" cy="7" r="4" />
    </Svg>
  );
}

export function Video(props: IconProps) {
  return (
    <Svg {...frame(props)}>
      <Path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
      <Rect x="2" y="6" width="14" height="12" rx="2" />
    </Svg>
  );
}

export function X(props: IconProps) {
  return (
    <Svg {...frame(props)}>
      <Path d="M18 6 6 18" />
      <Path d="m6 6 12 12" />
    </Svg>
  );
}

export function Mic(props: IconProps) {
  return (
    <Svg {...frame(props)}>
      <Path d="M12 19v3" />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <Rect x="9" y="2" width="6" height="13" rx="3" />
    </Svg>
  );
}

export function Camera(props: IconProps) {
  return (
    <Svg {...frame(props)}>
      <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <Circle cx="12" cy="13" r="3" />
    </Svg>
  );
}

export function Ear(props: IconProps) {
  return (
    <Svg {...frame(props)}>
      <Path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10" />
      <Path d="M6 8.5a3 3 0 0 0 6 0" />
    </Svg>
  );
}

export function CircleDot(props: IconProps) {
  return (
    <Svg {...frame(props)}>
      <Circle cx="12" cy="12" r="10" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  );
}
