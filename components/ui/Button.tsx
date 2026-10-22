import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";

import { AppText } from "@/components/ui/AppText";
import { theme } from "@/constants/theme";

type Tone = "lime" | "ghost" | "danger" | "quiet";

type Props = {
  label: string;
  onPress: () => void;
  tone?: Tone;
  disabled?: boolean;
  testID?: string;
};

export function Button({ label, onPress, tone = "lime", disabled = false, testID }: Props) {
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
        pressed && !disabled && styles.pressed,
      ]}
    >
      <AppText
        variant="strong"
        style={[
          styles.label,
          tone === "lime" && styles.limeLabel,
          tone === "danger" && styles.dangerLabel,
          tone === "ghost" && styles.ghostLabel,
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
  return (
    <Pressable
      testID={testID}
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.icon, pressed && styles.pressed]}
    >
      <View>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  lime: {
    backgroundColor: theme.lime,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.lineStrong,
  },
  danger: {
    backgroundColor: theme.danger,
  },
  quiet: {
    backgroundColor: theme.bgSoft,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.72,
  },
  label: {
    fontSize: 14,
  },
  limeLabel: {
    color: theme.limeInk,
  },
  dangerLabel: {
    color: "#1A0907",
  },
  ghostLabel: {
    color: theme.ink,
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,12,14,0.78)",
    borderWidth: 1,
    borderColor: theme.line,
  },
});
