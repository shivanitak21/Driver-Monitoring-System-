import { useMemo, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/providers/ThemeProvider";
import { buildLiveKitWatchHtml } from "@/services/media/livekitWatchHtml";
import type { VideoSession } from "@/types/domain";

type Props = {
  session: VideoSession;
  listen: boolean;
  height?: number;
};

export function CabinWatchPlayer({ session, listen, height = 240 }: Props) {
  const { colors } = useTheme();
  const [status, setStatus] = useState("Connecting…");

  const html = useMemo(() => {
    if (session.mode !== "livekit" || !session.url || !session.token) return null;
    return buildLiveKitWatchHtml({
      url: session.url,
      token: session.token,
      listen,
    });
  }, [listen, session.mode, session.token, session.url]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          height,
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: "#0a0a0a",
        },
        web: { flex: 1, backgroundColor: "#0a0a0a" },
        preview: { width: "100%", height: "100%" },
        fallback: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          gap: 6,
        },
        caption: { marginTop: 8 },
      }),
    [colors.line, height],
  );

  if (session.mode === "dummy") {
    return (
      <View>
        <View style={styles.wrap}>
          {session.previewUrl ? (
            <Image source={{ uri: `${session.previewUrl}?track=cabin` }} style={styles.preview} resizeMode="contain" />
          ) : (
            <View style={styles.fallback}>
              <AppText variant="caption">Dummy mode — no LiveKit stream</AppText>
            </View>
          )}
        </View>
        <AppText variant="caption" style={styles.caption}>
          Watch fallback JPEG (dummy mode)
        </AppText>
      </View>
    );
  }

  if (session.mode === "local") {
    return (
      <View style={styles.wrap}>
        <View style={styles.fallback}>
          <AppText variant="strong">Local sample mode</AppText>
          <AppText variant="caption">Not the production LiveKit player.</AppText>
        </View>
      </View>
    );
  }

  if (!html) {
    return (
      <View style={styles.wrap}>
        <View style={styles.fallback}>
          <AppText variant="caption">Missing LiveKit url or token</AppText>
        </View>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.wrap}>
        <WebView
          key={`${session.room}-${session.token.slice(0, 12)}-${listen ? "listen" : "mute"}`}
          originWhitelist={["*"]}
          source={{ html, baseUrl: "https://localhost" }}
          style={styles.web}
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          mixedContentMode="always"
          setSupportMultipleWindows={false}
          onMessage={(event) => {
            try {
              const message = JSON.parse(event.nativeEvent.data) as {
                type?: string;
                message?: string;
              };
              if (message.type === "status" && message.message) setStatus(message.message);
              if (message.type === "error" && message.message) setStatus(message.message);
              if (message.type === "connected") setStatus(listen ? "Connected · cabin listen on" : "Connected · watching");
            } catch {
              // ignore page noise
            }
          }}
        />
      </View>
      <AppText variant="caption" style={styles.caption}>
        {status}
      </AppText>
    </View>
  );
}
