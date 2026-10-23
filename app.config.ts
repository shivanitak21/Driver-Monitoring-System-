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
      locationWhenInUsePermission: "VMS shows your location on the map next to the ride.",
    },
  ],
  [
    "expo-camera",
    {
      cameraPermission: "VMS uses the camera when you start a video call.",
      microphonePermission: "VMS uses the microphone when you start a call.",
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
  slug: "vms",
  scheme: "vms",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  backgroundColor: "#07080A",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.vms.safety",
    infoPlist: {
      NSLocationWhenInUseUsageDescription: "VMS shows your location on the map next to the ride.",
      NSCameraUsageDescription: "VMS uses the camera when you start a video call.",
      NSMicrophoneUsageDescription: "VMS uses the microphone when you start a call.",
    },
  },
  android: {
    package: "com.vms.safety",
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
    googleMapsApiKey: mapsKey ?? "",
  },
};

export default config;
