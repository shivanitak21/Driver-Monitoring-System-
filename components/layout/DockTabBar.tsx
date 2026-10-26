import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Bell, Navigation, Route, Users, Video } from "@/components/ui/icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/AppText";
import { Glass } from "@/components/ui/Glass";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";

type DockTabBarProps = {
  state: {
    index: number;
    routes: Array<{ key: string; name: string; params?: object }>;
  };
  navigation: {
    emit: (event: { type: "tabPress"; target: string; canPreventDefault: true }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string, params?: object) => void;
  };
};

const tabs: Record<string, { label: string; Icon: typeof Navigation }> = {
  index: { label: "Live", Icon: Navigation },
  trips: { label: "Trips", Icon: Route },
  cabin: { label: "Cabin", Icon: Video },
  alerts: { label: "Alerts", Icon: Bell },
  guardians: { label: "Family", Icon: Users },
};

export function DockTabBar({ state, navigation }: DockTabBarProps) {
  const openAlerts = useRideStore((store) => store.alerts.filter((alert) => !alert.acknowledged).length);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        host: {
          paddingHorizontal: 16,
          paddingTop: 6,
        },
        shadow: {
          borderRadius: 26,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.28,
          shadowRadius: 18,
          elevation: 8,
        },
        pill: {
          height: 62,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 6,
        },
        item: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          minHeight: 48,
          borderRadius: 18,
        },
        active: {
          backgroundColor: colors.lime,
        },
        badge: {
          position: "absolute",
          top: 8,
          right: 16,
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.danger,
        },
      }),
    [colors],
  );

  return (
    <View style={[styles.host, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      <View style={styles.shadow}>
        <Glass radius={26}>
          <View style={styles.pill}>
            {state.routes.map((route, index) => {
              const focused = state.index === index;
              const item = tabs[route.name] ?? { label: route.name, Icon: Navigation };
              const color = focused ? colors.limeInk : colors.inkMuted;
              const badge = route.name === "alerts" ? openAlerts : 0;
              return (
                <Pressable
                  key={route.key}
                  testID={`tab-${route.name}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={item.label}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    const event = navigation.emit({
                      type: "tabPress",
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (!focused && !event.defaultPrevented) {
                      navigation.navigate(route.name, route.params);
                    }
                  }}
                  style={[styles.item, focused && styles.active]}
                >
                  <item.Icon color={color} size={18} strokeWidth={1.75} />
                  <AppText variant="caption" style={{ color, fontSize: 11 }}>
                    {item.label}
                  </AppText>
                  {badge > 0 ? <View style={styles.badge} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Glass>
      </View>
    </View>
  );
}

export function useDockOffset() {
  const insets = useSafeAreaInsets();
  return 84 + Math.max(insets.bottom, 10);
}

export function openSettings() {
  router.push("/settings");
}
