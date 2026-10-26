import { Pressable, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { StatusPill } from "@/components/ui/ScoreRing";
import { useTheme } from "@/providers/ThemeProvider";
import type { SafetyStatus } from "@/types/domain";

type Props = {
  title: string;
  meta: string;
  status: SafetyStatus;
  onPress: () => void;
  testID?: string;
};

export function TripHistoryCard({ title, meta, status, onPress, testID }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <AppText variant="strong">{title}</AppText>
        <AppText variant="caption">{meta}</AppText>
      </View>
      <StatusPill status={status} />
    </Pressable>
  );
}
