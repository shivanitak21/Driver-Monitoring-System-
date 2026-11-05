import { Camera } from "expo-camera";
import { Platform } from "react-native";

/** Ask OS for microphone before Speak opens the LiveKit WebView. */
export async function ensureMicrophonePermission(): Promise<void> {
  const current = await Camera.getMicrophonePermissionsAsync();
  if (current.granted) return;
  

  const next = await Camera.requestMicrophonePermissionsAsync();
  if (next.granted) return;

  const hint =
    Platform.OS === "android"
      ? "Enable Microphone for VMS in Android Settings, then try Speak again."
      : "Allow Microphone for VMS, then try Speak again.";
  throw new Error(hint);
}
