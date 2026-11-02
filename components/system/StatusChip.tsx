import { View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/providers/ThemeProvider";

type Tone = "ok" | "warn" | "danger" | "muted";

export function StatusChip({ label, tone = "muted" }: { label: string; tone?: Tone }) {
  const { colors } = useTheme();
  const color =
    tone === "ok" ? colors.signal : tone === "warn" ? colors.amber : tone === "danger" ? colors.danger : colors.inkMuted;
  const background =
    tone === "ok"
      ? colors.limeSoft
      : tone === "warn"
        ? "rgba(230,177,90,0.16)"
        : tone === "danger"
          ? "rgba(255,59,48,0.12)"
          : colors.bgRaised;

  return (
    <View
      style={{
        alignSelf: "flex-start",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: background,
      }}
    >
      <AppText variant="caption" style={{ color, fontSize: 13 }}>
        {label}
      </AppText>
    </View>
  );
}
