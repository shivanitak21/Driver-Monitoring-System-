export type Palette = {
  bg: string;
  bgRaised: string;
  bgSoft: string;
  chip: string;
  ink: string;
  inkMuted: string;
  inkFaint: string;
  line: string;
  lineStrong: string;
  glass: string;
  glassTint: string;
  lime: string;
  limeInk: string;
  limeSoft: string;
  signal: string;
  amber: string;
  danger: string;
  dangerSoft: string;
  onDanger: string;
  cyan: string;
  shadow: string;
  mapBg: string;
  scrim: string;
  blurTint: "light" | "dark";
  statusBar: "light" | "dark";
};

export const darkPalette: Palette = {
  bg: "#090A0C",
  bgRaised: "#14171C",
  bgSoft: "#1C2128",
  chip: "#2A3038",
  ink: "#F5F6F7",
  inkMuted: "#A1A6AF",
  inkFaint: "#8B929C",
  line: "rgba(255,255,255,0.10)",
  lineStrong: "rgba(255,255,255,0.18)",
  glass: "rgba(16,18,22,0.78)",
  glassTint: "rgba(9,10,12,0.42)",
  lime: "#D7F76B",
  limeInk: "#1A1E0C",
  limeSoft: "rgba(215,247,107,0.16)",
  signal: "#D7F76B",
  amber: "#E6B15A",
  danger: "#FF453A",
  dangerSoft: "#FF8A80",
  onDanger: "#FFFFFF",
  cyan: "#8FD4D0",
  shadow: "#000000",
  mapBg: "#101216",
  scrim: "rgba(0,0,0,0.58)",
  blurTint: "dark",
  statusBar: "light",
};

export const lightPalette: Palette = {
  bg: "#F2F2F7",
  bgRaised: "#FFFFFF",
  bgSoft: "#E5E5EA",
  chip: "#FFFFFF",
  ink: "#1C1C1E",
  inkMuted: "#636366",
  inkFaint: "#8E8E93",
  line: "rgba(60,60,67,0.12)",
  lineStrong: "rgba(60,60,67,0.18)",
  glass: "rgba(255,255,255,0.82)",
  glassTint: "rgba(242,242,247,0.72)",
  lime: "#D7F76B",
  limeInk: "#1A1E0C",
  limeSoft: "rgba(76,97,16,0.12)",
  signal: "#3A4F0C",
  amber: "#8A5A10",
  danger: "#FF3B30",
  dangerSoft: "#FF6961",
  onDanger: "#FFFFFF",
  cyan: "#1F6F6A",
  shadow: "rgba(0,0,0,0.12)",
  mapBg: "#E5E5EA",
  scrim: "rgba(28,28,30,0.28)",
  blurTint: "light",
  statusBar: "dark",
};

/** Dark palette for boot screens that render before the provider. */
export const theme = darkPalette;

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const font = {
  display: "Sora_600SemiBold",
  title: "Sora_500Medium",
  body: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  strong: "Manrope_600SemiBold",
};
