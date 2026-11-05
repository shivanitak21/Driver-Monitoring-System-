import { useState } from "react";
import { StyleSheet, Switch, View } from "react-native";
import { useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { useForegroundPermissions } from "expo-location";
import * as Linking from "expo-linking";

import { Page } from "@/components/layout/Page";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { Segmented } from "@/components/ui/Segmented";
import { useTheme, type Appearance } from "@/providers/ThemeProvider";
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
  const { colors, appearance, setAppearance } = useTheme();
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
    <Page title="Settings" subtitle="Appearance · permissions · cabin" back>
      <Glass variant="card" radius={22} style={{ marginBottom: 14 }}>
        <View style={styles.block}>
          <AppText variant="strong">Appearance</AppText>
          <AppText variant="caption">Light and dark are equally polished.</AppText>
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
      </Glass>

      <Glass variant="card" radius={24} style={{ marginBottom: 14 }}>
        <View style={styles.group}>
          <PermissionRow
            title="Location"
            body="Shows your phone on the map."
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
            <AppText variant="body" style={[styles.flex, { color: colors.ink }]}>
              Show my location dot
            </AppText>
            <Switch
              value={showDevice}
              disabled={!location?.granted}
              onValueChange={setShowDevice}
              trackColor={{ true: colors.primary, false: colors.bgSoft }}
              thumbColor={colors.onPrimary}
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
      </Glass>

      <Glass variant="card" radius={22} style={{ marginBottom: 14 }}>
        <View style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <View style={styles.flex}>
              <AppText variant="strong">Cabin monitoring</AppText>
              <AppText variant="caption">Driver and cabin camera access</AppText>
            </View>
            <Switch
              testID="cabin-consent"
              value={consent}
              onValueChange={setConsent}
              trackColor={{ true: colors.primary, false: colors.bgSoft }}
              thumbColor={colors.onPrimary}
            />
          </View>
        </View>
      </Glass>

      <Glass variant="card" radius={22} style={{ marginBottom: 14 }}>
        <View style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <View style={styles.flex}>
              <AppText variant="strong">Show offline state</AppText>
              <AppText variant="caption">Force the offline banner for testing</AppText>
            </View>
            <Switch
              testID="offline-override"
              value={offline}
              onValueChange={setOffline}
              trackColor={{ true: colors.inkMuted, false: colors.bgSoft }}
              thumbColor={colors.bgRaised}
            />
          </View>
        </View>
      </Glass>

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
        <AppText variant="caption" style={{ color: granted ? colors.ink : colors.inkFaint }}>
          {granted ? "Granted" : denied ? "Denied" : "Not requested"}
        </AppText>
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
  block: { gap: 12, padding: 16 },
  group: { overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLine: { borderTopWidth: StyleSheet.hairlineWidth },
  flex: { flex: 1, gap: 2 },
  toggleCard: { padding: 16 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
});
