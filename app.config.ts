import type { ExpoConfig } from "expo/config";

const mapsKey = process.env.GOOGLE_MAPS_API_KEY;

const plugins: ExpoConfig["plugins"] = [
  "expo-router",
  "expo-font",
  "expo-image",
  "expo-status-bar",
  [
    "expo-location",
    {
      locationWhenInUsePermission:
        "VMS uses your location only to show this phone beside the ride. The vehicle marker stays on the simulated route until a vehicle feed is connected.",
    },
  ],
  [
    "expo-camera",
    {
      cameraPermission:
        "VMS uses the camera only after you allow a video call or a cabin check from this phone.",
      microphonePermission:
        "VMS uses the microphone only after you allow a call or cabin listening from this phone.",
      recordAudioAndroid: true,
    },
  ],
];

if (mapsKey) {
  plugins.push([
    "react-native-maps",
    {
      androidGoogleMapsApiKey: mapsKey,
      iosGoogleMapsApiKey: mapsKey,
    },
  ]);
}

const config: ExpoConfig = {
  name: "VMS",
  slug: "VMS",
  scheme: "VMS",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  backgroundColor: "#07080A",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.VMS.safety",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "VMS uses your location only to show this phone beside the ride.",
      NSCameraUsageDescription:
        "VMS uses the camera only after you allow a video call or a cabin check from this phone.",
      NSMicrophoneUsageDescription:
        "VMS uses the microphone only after you allow a call or cabin listening from this phone.",
    },
  },
  android: {
    package: "com.VMS.safety",
    predictiveBackGestureEnabled: false,
    adaptiveIcon: {
      backgroundColor: "#07080A",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins,
  experiments: {
    typedRoutes: false,
  },
  extra: {
    telemetryUrl: process.env.EXPO_PUBLIC_TELEMETRY_URL ?? "",
    mqttUrl: process.env.EXPO_PUBLIC_MQTT_URL ?? "",
    dataMode: "simulated",
    googleMapsApiKey: mapsKey ?? "",
  },
};

export default config;
