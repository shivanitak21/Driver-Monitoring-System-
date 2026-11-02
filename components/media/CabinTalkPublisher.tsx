import { useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/providers/ThemeProvider";
import { buildLiveKitTalkHtml } from "@/services/media/livekitTalkHtml";
import type { TalkSession } from "@/types/domain";

type Props = {
  session: TalkSession;
};

/**
 * LiveKit publisher for Speak — publishes phone mic as `guardian-mic`.
 * Uses http://localhost as baseUrl so Android WebView exposes mediaDevices (secure context)
 * while still allowing ws:// LiveKit signaling (not mixed-content https→ws).
 */
export function CabinTalkPublisher({ session }: Props) {
  const { colors } = useTheme();
  const [status, setStatus] = useState("Tap the red bar to start the microphone");

  const html = useMemo(
    () => buildLiveKitTalkHtml({ url: session.url, token: session.token }),
    [session.token, session.url],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          height: 72,
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.danger,
          backgroundColor: colors.dangerSoft + "22",
        },
        web: {
          flex: 1,
          backgroundColor: "#2a1010",
        },
        caption: { marginTop: 8 },
      }),
    [colors],
  );

  return (
    <View>
      <View style={styles.wrap}>
        <WebView
          key={`talk-${session.token.slice(0, 12)}`}
          originWhitelist={["*", "http://*", "https://*", "ws://*", "wss://*"]}
          source={{ html, baseUrl: "http://localhost" }}
          style={styles.web}
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          mediaCapturePermissionGrantType="grant"
          mixedContentMode="always"
          allowsFullscreenVideo={false}
          setSupportMultipleWindows={false}
          androidLayerType={Platform.OS === "android" ? "hardware" : undefined}
          onMessage={(event) => {
            try {
              const message = JSON.parse(event.nativeEvent.data) as {
                type?: string;
                message?: string;
              };
              if (message.type === "ready" && message.message) setStatus(message.message);
              if (message.type === "publishing") setStatus("Speaking to cabin…");
              else if (message.type === "connected") setStatus("Connected — publishing mic…");
              else if (message.type === "error" && message.message) setStatus(message.message);
            } catch {
              // ignore
            }
          }}
        />
      </View>
      <AppText variant="caption" style={[styles.caption, { color: colors.danger }]}>
        {status}
      </AppText>
    </View>
  );
}
