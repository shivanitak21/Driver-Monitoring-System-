import { ReactNode, useMemo } from "react";
import { StyleProp, Text, TextProps, TextStyle } from "react-native";

import { font } from "@/constants/theme";
import { useTheme } from "@/providers/ThemeProvider";

type Variant = "display" | "title" | "metric" | "body" | "label" | "strong" | "caption";

type Props = TextProps & {
  variant?: Variant;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
};

export function AppText({ variant = "body", style, children, ...props }: Props) {
  const { colors } = useTheme();
  const variants = useMemo<Record<Variant, TextStyle>>(
    () => ({
      display: {
        fontFamily: font.display,
        fontSize: 34,
        letterSpacing: -0.9,
        color: colors.ink,
      },
      title: {
        fontFamily: font.display,
        fontSize: 28,
        letterSpacing: -0.6,
        color: colors.ink,
      },
      metric: {
        fontFamily: font.title,
        fontSize: 26,
        letterSpacing: -0.6,
        color: colors.ink,
        fontVariant: ["tabular-nums"],
      },
      body: {
        fontFamily: font.body,
        fontSize: 15,
        lineHeight: 21,
        color: colors.inkMuted,
      },
      label: {
        fontFamily: font.medium,
        fontSize: 13,
        letterSpacing: 0.1,
        color: colors.inkFaint,
      },
      strong: {
        fontFamily: font.strong,
        fontSize: 16,
        color: colors.ink,
      },
      caption: {
        fontFamily: font.medium,
        fontSize: 13,
        lineHeight: 18,
        color: colors.inkMuted,
      },
    }),
    [colors],
  );

  return (
    <Text {...props} style={[variants[variant], style]}>
      {children}
    </Text>
  );
}
