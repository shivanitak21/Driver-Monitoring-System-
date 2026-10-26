import { router } from "expo-router";
import { View } from "react-native";

import { ScreenState } from "@/components/ui/ScreenState";
import { useTheme } from "@/providers/ThemeProvider";

export default function NotFound() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", paddingHorizontal: 24 }}>
      <ScreenState
        kind="empty"
        title="This screen is not on the map"
        body="The path does not match a VMS screen."
        actionLabel="Back to the ride"
        onAction={() => router.replace("/")}
      />
    </View>
  );
}
