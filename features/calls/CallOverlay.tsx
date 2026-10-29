import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";

export function CallOverlay() {
  const call = useRideStore((state) => state.call);
  const patchCall = useRideStore((state) => state.patchCall);
  const endCall = useRideStore((state) => state.endCall);
  const passengerName = useRideStore((state) => state.passengerName);
  const deviceId = useRideStore((state) => state.deviceId);
  const rideId = useRideStore((state) => state.rideId);
  const [cameraPermission, requestCamera] = useCameraPermissions();
  const [micPermission, requestMic] = useMicrophonePermissions();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (call?.phase !== "live" || !call.startedAt) return;
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - (call.startedAt ?? Date.now())) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [call?.phase, call?.startedAt]);

  useEffect(() => {
    if (call?.phase !== "ringing") return;
    const id = setTimeout(() => {
      patchCall({ phase: "live", startedAt: Date.now() });
    }, 1200);
    return () => clearTimeout(id);
  }, [call?.phase, patchCall]);

  if (!call) return null;

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const allowHardware = async () => {
    if (call.mode === "video") {
      const camera = cameraPermission?.granted ? cameraPermission : await requestCamera();
      const mic = micPermission?.granted ? micPermission : await requestMic();
      if (!camera.granted || !mic.granted) {
        patchCall({ phase: "denied", hardware: false });
        return;
      }
    } else {
      const mic = micPermission?.granted ? micPermission : await requestMic();
      if (!mic.granted) {
        patchCall({ phase: "denied", hardware: false });
        return;
      }
    }
    patchCall({ phase: "ringing", hardware: true });
  };

  return (
    <View style={[styles.overlay, { paddingTop: insets.top + 12, backgroundColor: colors.bg }]} testID="call-overlay">
      <View style={styles.remote}>
        {call.mode === "video" ? (
          <View style={[StyleSheet.absoluteFill, styles.audioField, { backgroundColor: colors.bgSoft }]} />
        ) : (
          <View style={styles.audioField} />
        )}
        <View style={styles.scrim} />
        <AppText variant="label" style={{ color: colors.signal }}>
          {call.mode === "audio" ? "Audio" : "Video"} · {passengerName || rideId}
        </AppText>
        <AppText variant="display">{call.phase === "live" ? clock : call.phase}</AppText>
        <AppText variant="body" style={styles.note}>
          {deviceId} · {call.hardware ? "Using this phone on the call." : "Allow mic/camera to continue."}
        </AppText>
        {call.mode === "video" && call.hardware && call.phase === "live" ? (
          <View style={[styles.local, { borderColor: colors.line }]}>
            <CameraView style={styles.camera} facing="front" />
          </View>
        ) : null}
      </View>

      {call.phase === "requesting" ? (
        <Glass style={styles.panel} padded>
          <AppText variant="strong">Allow {call.mode === "video" ? "camera and microphone" : "microphone"}</AppText>
          <AppText variant="body">You can use this phone, or continue without it.</AppText>
          <Button testID="call-allow" label="Allow and connect" onPress={() => void allowHardware()} />
          <Button
            label="Continue without it"
            tone="ghost"
            onPress={() => patchCall({ phase: "ringing", hardware: false })}
          />
        </Glass>
      ) : null}

      {call.phase === "denied" ? (
        <Glass style={styles.panel} padded>
          <AppText variant="title">Permission denied</AppText>
          <AppText variant="body">
            The {call.mode === "video" ? "camera or microphone" : "microphone"} stayed off. You can continue without it.
          </AppText>
          <Button label="Continue without it" onPress={() => patchCall({ phase: "ringing", hardware: false })} />
          <Button label="Close" tone="ghost" onPress={endCall} />
        </Glass>
      ) : null}

      {call.phase === "ringing" || call.phase === "live" ? (
        <View style={styles.controls}>
          <Pressable
            testID="call-mute"
            onPress={() => patchCall({ muted: !call.muted })}
            style={[styles.round, { backgroundColor: colors.bgRaised, borderColor: colors.line }]}
          >
            <AppText variant="caption">{call.muted ? "Muted" : "Mute"}</AppText>
          </Pressable>
          <Pressable testID="call-end" onPress={endCall} style={[styles.round, styles.end, { backgroundColor: colors.danger, borderColor: colors.danger }]}>
            <AppText variant="strong" style={{ color: colors.onDanger }}>
              End
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {call.phase === "ended" ? (
        <AppText variant="body" style={styles.ended}>
          Call ended
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 40,
    padding: 16,
    gap: 16,
  },
  remote: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#14171B",
    padding: 20,
    justifyContent: "flex-end",
    gap: 8,
  },
  audioField: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#121418",
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(7,8,10,0.45)",
  },
  note: {
    maxWidth: 320,
  },
  local: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 96,
    height: 140,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
  },
  camera: {
    flex: 1,
  },
  panel: {
    gap: 10,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 12,
  },
  round: {
    minWidth: 84,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  end: {
    borderWidth: 0,
  },
  ended: {
    textAlign: "center",
    marginBottom: 24,
  },
});
