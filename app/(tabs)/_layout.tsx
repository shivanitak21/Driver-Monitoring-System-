import { Tabs } from "expo-router";

import { DockTabBar } from "@/components/layout/DockTabBar";
import { theme } from "@/constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <DockTabBar state={props.state} navigation={props.navigation} />
      )}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 64,
          backgroundColor: theme.bg,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Live" }} />
      <Tabs.Screen name="trips" options={{ title: "Trips" }} />
      <Tabs.Screen name="cabin" options={{ title: "Cabin" }} />
      <Tabs.Screen name="alerts" options={{ title: "Alerts" }} />
      <Tabs.Screen name="guardians" options={{ title: "Family" }} />
    </Tabs>
  );
}
