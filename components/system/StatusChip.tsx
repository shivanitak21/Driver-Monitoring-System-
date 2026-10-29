import { View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/providers/ThemeProvider";

type Tone = "ok" | "warn" | "danger" | "muted";

export function StatusChip({ label, tone = "muted" }: { label: string; tone?: Tone }) {
  const { colors } = useTheme();
  const color =
    tone === "ok"
      ? colors.signal
      : tone === "warn"
        ? colors.amber
        : tone === "danger"
          ? colors.danger
          : colors.inkMuted;

  return (
    <View
      style={{
        alignSelf: "flex-start",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: colors.bgRaised,
        borderWidth: 1,
        borderColor: colors.line,
      }}
    >
      <AppText variant="caption" style={{ color, textTransform: "capitalize" }}>
        {label}
      </AppText>
    </View>
  );
}
