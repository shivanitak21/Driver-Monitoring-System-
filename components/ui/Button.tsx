import { useMemo, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";

import { AppText } from "@/components/ui/AppText";
import { radius } from "@/constants/theme";
import { useTheme } from "@/providers/ThemeProvider";

type Tone = "lime" | "ghost" | "danger" | "quiet";

type Props = {
  label: string;
  onPress: () => void;
  tone?: Tone;
  disabled?: boolean;
  testID?: string;
};

export function Button({ label, onPress, tone = "lime", disabled = false, testID }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          minHeight: 48,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 16,
        },
        lime: { backgroundColor: colors.lime },
        ghost: {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.lineStrong,
        },
        danger: { backgroundColor: colors.danger },
        quiet: { backgroundColor: colors.bgSoft },
        disabled: { opacity: 0.4 },
        label: { fontSize: 15 },
        limeLabel: { color: colors.limeInk },
        dangerLabel: { color: colors.onDanger },
        ghostLabel: { color: colors.ink },
        icon: {
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.glass,
          borderWidth: 1,
          borderColor: colors.line,
        },
      }),
    [colors],
  );

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        styles[tone],
        disabled && styles.disabled,
        pressed && !disabled && { opacity: 0.82, transform: [{ scale: 0.98 }] },
      ]}
    >
      <AppText
        variant="strong"
        style={[
          styles.label,
          tone === "lime" && styles.limeLabel,
          tone === "danger" && styles.dangerLabel,
          (tone === "ghost" || tone === "quiet") && styles.ghostLabel,
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export function IconButton({
  label,
  onPress,
  children,
  testID,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
  testID?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        icon: {
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.glass,
          borderWidth: 1,
          borderColor: colors.line,
        },
      }),
    [colors],
  );

  return (
    <Pressable
      testID={testID}
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.icon, pressed && { opacity: 0.82, transform: [{ scale: 0.96 }] }]}
    >
      <View>{children}</View>
    </Pressable>
  );
}
