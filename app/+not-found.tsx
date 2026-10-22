import { router } from "expo-router";
import { View } from "react-native";

import { ScreenState } from "@/components/ui/ScreenState";
import { theme } from "@/constants/theme";

export default function NotFound() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: "center" }}>
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
