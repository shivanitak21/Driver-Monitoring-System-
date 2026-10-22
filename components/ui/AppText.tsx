import { ReactNode } from "react";
import { StyleProp, Text, TextProps, TextStyle } from "react-native";

import { font, theme } from "@/constants/theme";

type Variant = "display" | "title" | "metric" | "body" | "label" | "strong" | "caption";

const variants: Record<Variant, TextStyle> = {
  display: {
    fontFamily: font.display,
    fontSize: 32,
    letterSpacing: -0.8,
    color: theme.ink,
  },
  title: {
    fontFamily: font.display,
    fontSize: 22,
    letterSpacing: -0.4,
    color: theme.ink,
  },
  metric: {
    fontFamily: font.title,
    fontSize: 28,
    letterSpacing: -0.8,
    color: theme.ink,
  },
  body: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: theme.inkMuted,
  },
  label: {
    fontFamily: font.medium,
    fontSize: 12,
    letterSpacing: 0.2,
    color: theme.inkFaint,
  },
  strong: {
    fontFamily: font.strong,
    fontSize: 15,
    color: theme.ink,
  },
  caption: {
    fontFamily: font.medium,
    fontSize: 12,
    lineHeight: 16,
    color: theme.inkFaint,
  },
};

type Props = TextProps & {
  variant?: Variant;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
};

export function AppText({ variant = "body", style, children, ...props }: Props) {
  return (
    <Text {...props} style={[variants[variant], style]}>
      {children}
    </Text>
  );
}
