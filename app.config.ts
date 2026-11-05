import type { ExpoConfig } from "expo/config";

const mapboxToken =
  (process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || "").trim();

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
  [
    "expo-media-library",
    {
      photosPermission: "VMS saves cabin snaps to your photo library.",
      savePhotosPermission: "VMS saves cabin snaps to your photo library.",
      // Photo only. Asking for audio rejects on Android because it is not in the manifest.
      granularPermissions: ["photo"],
    },
  ],
  [
    "expo-build-properties",
    {
      android: {
        // R8 strips WorkManager's Room database (pulled in by react-native-maps),
        // and the release APK dies before the first screen.
        enableMinifyInReleaseBuilds: false,
        enableShrinkResourcesInReleaseBuilds: false,
      },
    },
  ],
];

const config: ExpoConfig = {
  name: "VMS",
  slug: "vms",
  scheme: "vms",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  backgroundColor: "#000000",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.vms.safety",
    infoPlist: {
      NSLocationWhenInUseUsageDescription: "VMS shows your location on the map next to the ride.",
      NSCameraUsageDescription: "VMS uses the camera when you start a video call.",
      NSMicrophoneUsageDescription: "VMS uses the microphone when you start a call.",
      // Guardian API + LiveKit are plain HTTP/WS on the demo VPS.
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
      },
    },
  },
  android: {
    package: "com.vms.safety",
    predictiveBackGestureEnabled: false,
    // Allow http:// stills + ws:// LiveKit on the demo VPS.
    usesCleartextTraffic: true,
    permissions: [
      "android.permission.RECORD_AUDIO",
      "android.permission.MODIFY_AUDIO_SETTINGS",
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE",
    ],
    adaptiveIcon: {
      backgroundColor: "#000000",
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
    eas: {
      projectId: "159d8219-a7cd-482f-82fb-300c764c115d",
    },
    // Demo guardian API. Override with EXPO_PUBLIC_TELEMETRY_URL when needed.
    telemetryUrl: (process.env.EXPO_PUBLIC_TELEMETRY_URL || "http://51.81.81.118:8000").trim(),
    mqttUrl: (process.env.EXPO_PUBLIC_MQTT_URL ?? "").trim(),
    mapboxAccessToken: mapboxToken,
    defaultRideId: process.env.EXPO_PUBLIC_RIDE_ID || "ride-1842",
    defaultDeviceId: process.env.EXPO_PUBLIC_DEVICE_ID || "orin-nano-01",
  },
};

export default config;
