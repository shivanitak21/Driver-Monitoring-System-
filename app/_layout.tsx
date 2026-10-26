import "react-native-gesture-handler";

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Sora_500Medium, Sora_600SemiBold } from "@expo-google-fonts/sora";
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold } from "@expo-google-fonts/manrope";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";

import { DeviceLocationBridge, RideClock } from "@/components/system/RideRuntime";
import { theme } from "@/constants/theme";
import { CallOverlay } from "@/features/calls/CallOverlay";
import { SosConfirm } from "@/features/live-map/SosConfirm";
import { ThemeProvider, useTheme } from "@/providers/ThemeProvider";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Sora_500Medium,
    Sora_600SemiBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
  });

  if (!loaded && !error) {
    return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.bg }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppFrame />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppFrame() {
  const { colors } = useTheme();

  return (
    <BottomSheetModalProvider>
      <StatusBar style={colors.statusBar} />
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <RideClock />
        <DeviceLocationBridge />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="trip/[id]" />
          <Stack.Screen name="vehicle/[id]" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="evidence/[id]" />
        </Stack>
        <SosConfirm />
        <CallOverlay />
      </View>
    </BottomSheetModalProvider>
  );
}
