import { ReactNode, useMemo } from "react";
import { Platform, StyleProp, Text, TextProps, TextStyle } from "react-native";

import { typeface } from "@/constants/theme";
import { useTheme } from "@/providers/ThemeProvider";

type Variant = "display" | "title" | "metric" | "body" | "label" | "strong" | "caption";

type Props = TextProps & {
  variant?: Variant;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
};

const FACE: Record<Variant, Parameters<typeof typeface>[0]> = {
  display: "display",
  title: "title",
  metric: "title",
  body: "body",
  label: "medium",
  strong: "strong",
  caption: "medium",
};

export function AppText({ variant = "body", style, children, ...props }: Props) {
  const { colors } = useTheme();
  const variants = useMemo<Record<Variant, TextStyle>>(
    () => ({
      display: {
        ...typeface(FACE.display),
        fontSize: 34,
        lineHeight: 40,
        letterSpacing: Platform.OS === "ios" ? 0.37 : -0.9,
        color: colors.ink,
      },
      title: {
        ...typeface(FACE.title),
        fontSize: 28,
        lineHeight: 34,
        letterSpacing: Platform.OS === "ios" ? 0.36 : -0.6,
        color: colors.ink,
      },
      metric: {
        ...typeface(FACE.metric),
        fontSize: 26,
        lineHeight: 32,
        letterSpacing: Platform.OS === "ios" ? 0.36 : -0.6,
        color: colors.ink,
        fontVariant: ["tabular-nums"],
      },
      body: {
        ...typeface(FACE.body),
        fontSize: 15,
        lineHeight: 22,
        letterSpacing: Platform.OS === "ios" ? -0.24 : 0,
        color: colors.inkMuted,
      },
      label: {
        ...typeface(FACE.label),
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: 0.2,
        textTransform: "uppercase",
        color: colors.inkFaint,
      },
      strong: {
        ...typeface(FACE.strong),
        fontSize: 16,
        lineHeight: 21,
        letterSpacing: Platform.OS === "ios" ? -0.32 : 0,
        color: colors.ink,
      },
      caption: {
        ...typeface(FACE.caption),
        fontSize: 13,
        lineHeight: 18,
        letterSpacing: Platform.OS === "ios" ? -0.08 : 0,
        color: colors.inkMuted,
      },
    }),
    [colors],
  );

  return (
    <Text {...props} style={[variants[variant], style]} allowFontScaling>
      {children}
    </Text>
  );
}
