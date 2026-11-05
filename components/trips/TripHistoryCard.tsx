import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { AppText } from "@/components/ui/AppText";
import { Glass } from "@/components/ui/Glass";
import { StatusPill } from "@/components/ui/ScoreRing";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useTheme } from "@/providers/ThemeProvider";
import type { SafetyStatus } from "@/types/domain";

type Props = {
  title: string;
  meta: string;
  status: SafetyStatus;
  onPress: () => void;
  testID?: string;
  index?: number;
};

export function TripHistoryCard({ title, meta, status, onPress, testID, index = 0 }: Props) {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInUp.delay(Math.min(index, 8) * 40).duration(360)}
      style={styles.wrap}
    >
      <Glass variant="card" radius={22}>
        <Pressable
          testID={testID}
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.82 }]}
        >
          <View style={styles.flex}>
            <AppText variant="strong" numberOfLines={1}>
              {title}
            </AppText>
            <AppText variant="caption" numberOfLines={2}>
              {meta}
            </AppText>
          </View>
          <StatusPill status={status} />
          <View style={[styles.chevron, { borderColor: colors.line }]}>
            <AppText variant="caption" style={{ color: colors.inkFaint, fontSize: 16 }}>
              ›
            </AppText>
          </View>
        </Pressable>
      </Glass>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  flex: {
    flex: 1,
    gap: 4,
  },
  chevron: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
