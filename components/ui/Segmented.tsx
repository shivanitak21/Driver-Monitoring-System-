import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";

import { AppText } from "@/components/ui/AppText";
import { theme } from "@/constants/theme";

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
            <AppText variant="caption" style={{ color: selected ? theme.bg : theme.inkMuted }}>
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 14,
    backgroundColor: theme.bgSoft,
    borderWidth: 1,
    borderColor: theme.line,
  },
  item: {
    flex: 1,
    minHeight: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemOn: {
    backgroundColor: theme.ink,
  },
});
