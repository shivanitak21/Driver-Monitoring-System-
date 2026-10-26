import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/providers/ThemeProvider";

type Item = { id: string; label: string };

export function Segmented({
  items,
  value,
  onChange,
}: {
  items: Item[];
  value: string;
  onChange: (id: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        bar: {
          flexDirection: "row",
          padding: 3,
          borderRadius: 14,
          backgroundColor: colors.bgSoft,
        },
        item: {
          flex: 1,
          minHeight: 44,
          borderRadius: 11,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 2,
        },
        itemOn: {
          backgroundColor: colors.chip,
          borderWidth: 1,
          borderColor: colors.line,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.bar}>
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(item.id);
            }}
            style={[styles.item, selected && styles.itemOn]}
          >
            <AppText
              variant="caption"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
              style={{ width: "100%", textAlign: "center", fontSize: 12, lineHeight: 16, color: selected ? colors.ink : colors.inkMuted }}
            >
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
