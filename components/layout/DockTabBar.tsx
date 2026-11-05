import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Bell, Navigation, Route, Users, Video } from "@/components/ui/icons";
import { router } from "expo-router";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { hasAlertClip } from "@/utils/alerts";
import { selectionFeedback } from "@/utils/haptics";

import { AppText } from "@/components/ui/AppText";
import { Glass } from "@/components/ui/Glass";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";

const tabs: Record<string, { label: string; Icon: typeof Navigation }> = {
  index: { label: "Live", Icon: Navigation },
  trips: { label: "Trips", Icon: Route },
  cabin: { label: "Cabin", Icon: Video },
  alerts: { label: "Alerts", Icon: Bell },
  guardians: { label: "Family", Icon: Users },
};

function TabItem({
  focused,
  label,
  Icon,
  badge,
  onPress,
  testID,
}: {
  focused: boolean;
  label: string;
  Icon: typeof Navigation;
  badge: number;
  onPress: () => void;
  testID: string;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPressIn={() => {
        scale.value = withSpring(0.92, { damping: 18, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 280 });
      }}
      onPress={onPress}
      style={styles.item}
    >
      <Animated.View style={[styles.itemInner, anim]}>
        {focused ? (
          <View style={[styles.activeHalo, { backgroundColor: colors.bgSoft }]} />
        ) : null}
        <Icon
          color={focused ? colors.ink : colors.inkFaint}
          size={20}
          strokeWidth={focused ? 2.1 : 1.6}
        />
        <AppText
          variant="caption"
          style={{
            color: focused ? colors.ink : colors.inkFaint,
            fontSize: 10,
            letterSpacing: 0.15,
          }}
        >
          {label}
        </AppText>
        {badge > 0 ? <View style={[styles.badge, { backgroundColor: colors.danger }]} /> : null}
      </Animated.View>
    </Pressable>
  );
}

export function DockTabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const liveMode = useRideStore((store) => store.liveMode);
  const openAlerts = useRideStore((store) =>
    store.alerts.filter((alert) => !alert.acknowledged && (!liveMode || hasAlertClip(alert))).length,
  );

  return (
    <View style={[styles.host, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      <Glass variant="float" radius={30} intensity={56}>
        <View style={styles.pill}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const item = tabs[route.name] ?? { label: route.name, Icon: Navigation };
            const badge = route.name === "alerts" ? openAlerts : 0;
            return (
              <TabItem
                key={route.key}
                testID={`tab-${route.name}`}
                focused={focused}
                label={item.label}
                Icon={item.Icon}
                badge={badge}
                onPress={() => {
                  void selectionFeedback();
                  const event = emitter.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented) {
                    navigateToTab(route.key);
                  }
                }}
              />
            );
          })}
        </View>
      </Glass>
    </View>
  );
}

export function useDockOffset() {
  const insets = useSafeAreaInsets();
  return 86 + Math.max(insets.bottom, 10);
}

export function openSettings() {
  router.push("/settings");
}

const styles = StyleSheet.create({
  host: {
    paddingHorizontal: 18,
    paddingTop: 4,
  },
  pill: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  itemInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    width: "100%",
    paddingVertical: 6,
    borderRadius: 18,
  },
  activeHalo: {
    ...StyleSheet.absoluteFill,
    borderRadius: 18,
    opacity: 0.85,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: "28%",
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
