import { useState } from "react";
import { StyleSheet, Switch, View } from "react-native";
import { useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { useForegroundPermissions } from "expo-location";
import * as Linking from "expo-linking";

import { Page } from "@/components/layout/Page";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { useTheme, type Appearance } from "@/providers/ThemeProvider";
import { isLiveApiEnabled, apiBaseUrl } from "@/services/api/config";
import { useRideStore } from "@/stores/useRideStore";

export function SettingsScreen() {
  const [location, requestLocation] = useForegroundPermissions();
  const [camera, requestCamera] = useCameraPermissions();
  const [microphone, requestMicrophone] = useMicrophonePermissions();
  const consent = useRideStore((state) => state.cabinConsent);
  const setConsent = useRideStore((state) => state.setCabinConsent);
  const showDevice = useRideStore((state) => state.showDeviceLocation);
  const setShowDevice = useRideStore((state) => state.setShowDeviceLocation);
  const offline = useRideStore((state) => state.offlineOverride);
  const setOffline = useRideStore((state) => state.setOfflineOverride);
  const connection = useRideStore((state) => state.connection);
  const rideId = useRideStore((state) => state.rideId);
  const deviceId = useRideStore((state) => state.deviceId);
  const liveMode = useRideStore((state) => state.liveMode);
  const { colors, appearance, setAppearance } = useTheme();
  const apiEnabled = isLiveApiEnabled();
  const telemetryHost = apiEnabled ? apiBaseUrl().replace(/^https?:\/\//, "") : "";
  const [locationDenied, setLocationDenied] = useState(false);
  const locationGranted = Boolean(location?.granted);
  const cameraGranted = Boolean(camera?.granted);
  const microphoneGranted = Boolean(microphone?.granted);
  const locationIsDenied = locationDenied || location?.status === "denied";
  const cameraIsDenied = camera?.status === "denied";
  const microphoneIsDenied = microphone?.status === "denied";
  const primaryPermission = !locationGranted && !locationIsDenied
    ? "location"
    : !cameraGranted && !cameraIsDenied
      ? "camera"
      : !microphoneGranted && !microphoneIsDenied
        ? "microphone"
        : null;

  return (
    <Page title="Settings" subtitle="On this phone" back>
      <AppText variant="body">
        {apiEnabled
          ? `Guardian API ${telemetryHost}. Ride ${rideId} · device ${deviceId}. REST + live socket. MQTT stays unused on the phone.`
          : "Set EXPO_PUBLIC_TELEMETRY_URL to connect the guardian API. Until then, the ride, cabin, alerts, and family notices stay on this phone."}
      </AppText>
      {apiEnabled ? (
        <AppText variant="caption" style={{ marginTop: 8 }}>
          Link status: {liveMode ? connection : "idle"} · docs at /docs
          {"\n"}Integrated: ride + live socket, telemetry, alerts/ack, analysis, frames, video token, history,
          clips, SOS, cabin, guardians/share, notices. Push-token client ready (no device push UI yet). LiveKit
          moving video needs a native LiveKit client — Expo Go shows JPEG stills.
        </AppText>
      ) : null}

      <View style={styles.block}>
        <AppText variant="strong">Appearance</AppText>
        <Segmented
          value={appearance}
          onChange={(id) => setAppearance(id as Appearance)}
          items={[
            { id: "system", label: "System" },
            { id: "light", label: "Light" },
            { id: "dark", label: "Dark" },
          ]}
        />
      </View>

      <View style={[styles.group, { backgroundColor: colors.bgRaised, borderColor: colors.line }]}>
        <PermissionRow
          title="Location"
          body="Shows this phone on the map and moves the route onto that fix."
          granted={Boolean(location?.granted)}
          denied={locationDenied || location?.status === "denied"}
          primary={primaryPermission === "location"}
          lined={false}
          onRequest={() => {
            void requestLocation().then((result) => {
              setLocationDenied(!result.granted);
              if (result.granted) setShowDevice(true);
            });
          }}
        />
        <View style={[styles.row, styles.rowLine, { borderTopColor: colors.line }]}>
          <AppText variant="body" style={styles.flex}>
            Show my location dot
          </AppText>
          <Switch
            value={showDevice}
            disabled={!location?.granted}
            onValueChange={setShowDevice}
            trackColor={{ true: colors.lime, false: colors.bgSoft }}
            thumbColor={colors.bgRaised}
          />
        </View>
        <PermissionRow
          title="Camera"
          body="Only if you start a video call."
          granted={Boolean(camera?.granted)}
          denied={camera?.status === "denied"}
          primary={primaryPermission === "camera"}
          onRequest={() => void requestCamera()}
        />
        <PermissionRow
          title="Microphone"
          body="Only if you start a call."
          granted={Boolean(microphone?.granted)}
          denied={microphone?.status === "denied"}
          primary={primaryPermission === "microphone"}
          onRequest={() => void requestMicrophone()}
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.bgRaised, borderColor: colors.line }]}>
        <AppText variant="body">Cabin monitoring for this ride.</AppText>
        <View style={styles.toggleRow}>
          <AppText variant="strong">{consent ? "Allowed for this ride" : "Not allowed"}</AppText>
          <Switch
            testID="cabin-consent"
            value={consent}
            onValueChange={setConsent}
            trackColor={{ true: colors.lime, false: colors.bgSoft }}
            thumbColor={colors.bgRaised}
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.bgRaised, borderColor: colors.line }]}>
        <View style={styles.toggleRow}>
          <AppText variant="body">Show offline state</AppText>
          <Switch
            testID="offline-override"
            value={offline}
            onValueChange={setOffline}
            trackColor={{ true: colors.amber, false: colors.bgSoft }}
            thumbColor={colors.bgRaised}
          />
        </View>
      </View>

      {!location?.granted && location?.canAskAgain === false ? (
        <Button label="Open system settings" tone="ghost" onPress={() => void Linking.openSettings()} />
      ) : null}
    </Page>
  );
}

function PermissionRow({
  title,
  body,
  granted,
  denied,
  primary,
  lined = true,
  onRequest,
}: {
  title: string;
  body: string;
  granted: boolean;
  denied: boolean;
  primary: boolean;
  lined?: boolean;
  onRequest: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, lined && styles.rowLine, lined && { borderTopColor: colors.line }]}>
      <View style={styles.flex}>
        <AppText variant="strong">{title}</AppText>
        <AppText variant="caption">{body}</AppText>
        <AppText variant="caption">{granted ? "Granted" : denied ? "Denied" : "Not requested"}</AppText>
      </View>
      {denied && !granted ? (
        <Button label="Settings" tone="ghost" onPress={() => void Linking.openSettings()} />
      ) : (
        <Button
          label={granted ? "Granted" : "Allow"}
          tone={primary && !granted ? "lime" : "quiet"}
          disabled={granted}
          onPress={onRequest}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginTop: 22, gap: 10 },
  group: { marginTop: 14, borderRadius: 22, borderWidth: 1, overflow: "hidden" },
  card: { marginTop: 14, padding: 16, borderRadius: 22, borderWidth: 1, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowLine: { borderTopWidth: 1 },
  flex: { flex: 1, gap: 2 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
});
