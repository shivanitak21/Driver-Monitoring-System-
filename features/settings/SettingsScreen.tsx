import { useState } from "react";
import { StyleSheet, Switch, View } from "react-native";
import { useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { useForegroundPermissions } from "expo-location";
import * as Linking from "expo-linking";

import { Page } from "@/components/layout/Page";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { theme } from "@/constants/theme";
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
  const [locationDenied, setLocationDenied] = useState(false);

  return (
    <Page kicker="Phone" title="Settings" back>
      <View style={styles.card}>
        <AppText variant="strong">Simulated ride</AppText>
        <AppText variant="caption">
          The car, cabin, alerts, and guardian notices are generated on this phone. They are not a vehicle connection.
        </AppText>
      </View>

      <PermissionRow
        title="Location"
        body="Optional phone dot. When allowed, the simulated loop is placed on this fix."
        granted={Boolean(location?.granted)}
        denied={locationDenied || location?.status === "denied"}
        onRequest={() => {
          void requestLocation().then((result) => {
            setLocationDenied(!result.granted);
            if (result.granted) setShowDevice(true);
          });
        }}
      />
      <View style={styles.toggleRow}>
        <AppText variant="body">Show my location dot</AppText>
        <Switch
          value={showDevice}
          disabled={!location?.granted}
          onValueChange={setShowDevice}
          trackColor={{ true: theme.lime, false: theme.bgSoft }}
          thumbColor={theme.ink}
        />
      </View>

      <PermissionRow
        title="Camera"
        body="Only if you start a video call."
        granted={Boolean(camera?.granted)}
        denied={camera?.status === "denied"}
        onRequest={() => void requestCamera()}
      />
      <PermissionRow
        title="Microphone"
        body="Only if you start a call."
        granted={Boolean(microphone?.granted)}
        denied={microphone?.status === "denied"}
        onRequest={() => void requestMicrophone()}
      />

      <View style={styles.card}>
        <AppText variant="body">Cabin monitoring for this ride.</AppText>
        <View style={styles.toggleRow}>
          <AppText variant="strong">{consent ? "Allowed for this ride" : "Not allowed"}</AppText>
          <Switch
            testID="cabin-consent"
            value={consent}
            onValueChange={setConsent}
            trackColor={{ true: theme.lime, false: theme.bgSoft }}
            thumbColor={theme.ink}
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <AppText variant="body">Show offline state</AppText>
          <Switch
            testID="offline-override"
            value={offline}
            onValueChange={setOffline}
            trackColor={{ true: theme.amber, false: theme.bgSoft }}
            thumbColor={theme.ink}
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
  onRequest,
}: {
  title: string;
  body: string;
  granted: boolean;
  denied: boolean;
  onRequest: () => void;
}) {
  return (
    <View style={styles.card}>
      <AppText variant="strong">{title}</AppText>
      <AppText variant="body">{body}</AppText>
      <AppText variant="caption">{granted ? "Granted" : denied ? "Denied" : "Not requested"}</AppText>
      {denied && !granted ? (
        <Button label="Open settings" tone="ghost" onPress={() => void Linking.openSettings()} />
      ) : (
        <Button label={granted ? "Granted" : `Allow ${title.toLowerCase()}`} tone={granted ? "quiet" : "lime"} disabled={granted} onPress={onRequest} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    padding: 16,
    borderRadius: 22,
    backgroundColor: theme.bgRaised,
    borderWidth: 1,
    borderColor: theme.line,
    gap: 8,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
});
