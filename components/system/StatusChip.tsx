import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/providers/ThemeProvider";

type Tone = "ok" | "warn" | "danger" | "muted";

/** Soft monochrome chips — color only for true danger. */
export function StatusChip({ label, tone = "muted" }: { label: string; tone?: Tone }) {
  const { colors } = useTheme();
  const color =
    tone === "danger" ? colors.danger : tone === "ok" ? colors.ink : colors.inkMuted;
  const background =
    tone === "danger"
      ? "rgba(255,59,48,0.12)"
      : tone === "ok"
        ? colors.bgSoft
        : tone === "warn"
          ? colors.bgSoft
          : colors.bgRaised;

  return (
    <View
      style={{
        alignSelf: "flex-start",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
        backgroundColor: background,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.line,
      }}
    >
      <AppText variant="caption" style={{ color, fontSize: 13 }}>
        {label}
      </AppText>
    </View>
  );
}
