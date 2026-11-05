import { Platform, type TextStyle, type ViewStyle } from "react-native";

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
  glassBorder: string;
  lime: string;
  limeInk: string;
  limeSoft: string;
  signal: string;
  amber: string;
  amberSoft: string;
  danger: string;
  dangerSoft: string;
  onDanger: string;
  cyan: string;
  shadow: string;
  mapBg: string;
  scrim: string;
  blurTint: "light" | "dark";
  statusBar: "light" | "dark";
  /** Soft vertical wash for screen shells (top → bottom). */
  gradient: [string, string, string];
  /** Card / glass highlight wash. */
  cardGradient: [string, string];
  /** Primary CTA fill (monochrome, Apple-like). */
  primary: string;
  onPrimary: string;
};

/**
 * Near-monochrome Apple dark — charcoal, silver text, whisper green only for live/safe.
 */
export const darkPalette: Palette = {
  bg: "#000000",
  bgRaised: "#161618",
  bgSoft: "#232326",
  chip: "#2A2A2E",
  ink: "#F5F5F7",
  inkMuted: "#98989F",
  inkFaint: "#6C6C70",
  line: "rgba(255,255,255,0.07)",
  lineStrong: "rgba(255,255,255,0.14)",
  glass: "rgba(22,22,24,0.78)",
  glassTint: "rgba(255,255,255,0.04)",
  glassBorder: "rgba(255,255,255,0.10)",
  lime: "#A8C96A",
  limeInk: "#0E1208",
  limeSoft: "rgba(168,201,106,0.10)",
  signal: "#D1D1D6",
  amber: "#C7C7CC",
  amberSoft: "rgba(199,199,204,0.12)",
  danger: "#FF453A",
  dangerSoft: "#FF6961",
  onDanger: "#FFFFFF",
  cyan: "#AEAEB2",
  shadow: "#000000",
  mapBg: "#12151A",
  scrim: "rgba(0,0,0,0.58)",
  blurTint: "dark",
  statusBar: "light",
  gradient: ["#0A0A0C", "#000000", "#050507"],
  cardGradient: ["rgba(255,255,255,0.07)", "rgba(255,255,255,0.015)"],
  primary: "#F5F5F7",
  onPrimary: "#0A0A0C",
};

/**
 * Soft iOS light — system grey wash, black type, almost no chroma.
 */
export const lightPalette: Palette = {
  bg: "#F2F2F7",
  bgRaised: "#FFFFFF",
  bgSoft: "#EBEBF0",
  chip: "#FFFFFF",
  ink: "#1C1C1E",
  inkMuted: "#6C6C70",
  inkFaint: "#8E8E93",
  line: "rgba(60,60,67,0.09)",
  lineStrong: "rgba(60,60,67,0.16)",
  glass: "rgba(255,255,255,0.72)",
  glassTint: "rgba(255,255,255,0.35)",
  glassBorder: "rgba(255,255,255,0.80)",
  lime: "#7A9448",
  limeInk: "#FFFFFF",
  limeSoft: "rgba(122,148,72,0.10)",
  signal: "#3A3A3C",
  amber: "#8E8E93",
  amberSoft: "rgba(142,142,147,0.12)",
  danger: "#FF3B30",
  dangerSoft: "#FF6961",
  onDanger: "#FFFFFF",
  cyan: "#636366",
  shadow: "rgba(0,0,0,0.14)",
  mapBg: "#E6E8EB",
  scrim: "rgba(28,28,30,0.28)",
  blurTint: "light",
  statusBar: "dark",
  gradient: ["#FFFFFF", "#F2F2F7", "#EBEBF0"],
  cardGradient: ["rgba(255,255,255,0.95)", "rgba(245,245,247,0.82)"],
  primary: "#1C1C1E",
  onPrimary: "#FFFFFF",
};

/** Dark palette for boot screens that render before the provider. */
export const theme = darkPalette;

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 36,
  pill: 999,
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
};

export const font = {
  display: "Sora_600SemiBold",
  title: "Sora_500Medium",
  body: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  strong: "Manrope_600SemiBold",
};

export const iosWeight: Record<keyof typeof font, TextStyle["fontWeight"]> = {
  display: "600",
  title: "500",
  body: "400",
  medium: "500",
  strong: "600",
};

export function typeface(key: keyof typeof font): TextStyle {
  if (Platform.OS === "ios") {
    return { fontWeight: iosWeight[key] };
  }
  return { fontFamily: font[key] };
}

export const elevation = {
  float: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 14,
  } satisfies ViewStyle,
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  } satisfies ViewStyle,
  soft: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  } satisfies ViewStyle,
};

export const motion = {
  fast: 180,
  base: 280,
  slow: 420,
  sheet: 480,
};
