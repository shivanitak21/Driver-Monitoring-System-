import { Pressable, StyleSheet, View } from "react-native";
import { Bell, Navigation, Route, Users, Video } from "@/components/ui/icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { AppText } from "@/components/ui/AppText";
import { theme } from "@/constants/theme";
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
  const openAlerts = useRideStore(
    (store) => store.alerts.filter((alert) => !alert.acknowledged).length,
  );

  return (
    <View style={styles.host} pointerEvents="box-none">
      <View style={styles.pill}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const item = tabs[route.name] ?? { label: route.name, Icon: Navigation };
          const color = focused ? theme.ink : theme.inkFaint;
          const badge = route.name === "alerts" ? openAlerts : 0;
          return (
            <Pressable
              key={route.key}
              testID={`tab-${route.name}`}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
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
              style={styles.item}
            >
              <item.Icon color={focused ? theme.lime : color} size={18} strokeWidth={1.75} />
              <AppText variant="caption" style={{ color, fontSize: 10 }}>
                {item.label}
              </AppText>
              {badge > 0 ? <View style={styles.badge} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function useDockOffset() {
  return 12;
}

export function openSettings() {
  router.push("/settings");
}

const styles = StyleSheet.create({
  host: {
    height: 64,
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 6,
    backgroundColor: theme.bg,
  },
  pill: {
    height: 54,
    borderRadius: 20,
    backgroundColor: theme.bgRaised,
    borderWidth: 1,
    borderColor: theme.line,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minHeight: 44,
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 14,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.danger,
  },
});
