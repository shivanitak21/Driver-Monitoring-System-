import { useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { AppText } from "@/components/ui/AppText";
import { bustMediaUrl } from "@/services/api/media";
import { buildLiveKitWatchHtml } from "@/services/media/livekitWatchHtml";
import type { LiveFrame, MediaChannel, VideoSession } from "@/types/domain";

function posterFor(frame: LiveFrame | null | undefined, previewUrl: string, track: "driver" | "cabin") {
  if (frame?.imageUrl) return bustMediaUrl(frame.imageUrl, frame.at);
  if (!previewUrl) return "";
  const join = previewUrl.includes("?") ? "&" : "?";
  return bustMediaUrl(`${previewUrl}${join}track=${track}`, Date.now());
}

export type WatchLayout = "both" | "dms" | "cms";

type Props = {
  session: VideoSession;
  listen: boolean;
  layout: WatchLayout;
  selected: MediaChannel;
  onSelect: (channel: MediaChannel) => void;
  driverFrame?: LiveFrame | null;
  cabinFrame?: LiveFrame | null;
  height?: number;
  broad?: boolean;
};

export function CabinWatchPlayer({
  session,
  listen,
  layout,
  selected,
  onSelect,
  driverFrame,
  cabinFrame,
  height = 420,
  broad = false,
}: Props) {
  const webRef = useRef<WebView>(null);
  const pageBase = "http://localhost";
  const htmlLayout = layout === "dms" ? "driver" : layout === "cms" ? "cabin" : "both";
  const htmlSelected = selected === "cms" ? "cabin" : "driver";

  const html = useMemo(() => {
    if (session.mode !== "livekit" || !session.url || !session.token) return null;
    return buildLiveKitWatchHtml({
      url: session.url,
      token: session.token,
      listen,
      layout: "both",
      selected: "driver",
      driverPoster: posterFor(driverFrame, session.previewUrl, "driver"),
      cabinPoster: posterFor(cabinFrame, session.previewUrl, "cabin"),
    });
    // Layout, selection, and still refreshes must not reopen the LiveKit room.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listen, session.mode, session.previewUrl, session.token, session.url]);

  useEffect(() => {
    webRef.current?.injectJavaScript(
      `try{window.__vmsSetLayout&&window.__vmsSetLayout(${JSON.stringify(htmlLayout)});window.__vmsSetSelected&&window.__vmsSetSelected(${JSON.stringify(htmlSelected)});}catch(e){};true;`,
    );
  }, [htmlLayout, htmlSelected]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          height,
          borderRadius: broad ? 0 : 24,
          overflow: "hidden",
          backgroundColor: "#000",
        },
        web: { flex: 1, backgroundColor: "#000" },
        fallback: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          backgroundColor: "#0C0D10",
        },
      }),
    [broad, height],
  );

  if (session.mode === "dummy" || session.mode === "local" || !html) {
    return (
      <View style={styles.wrap}>
        <View style={styles.fallback}>
          <AppText variant="caption" style={{ color: "#F5F6F7" }}>
            Cameras offline
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webRef}
        key={`${session.room}-${session.token.slice(0, 16)}-${listen ? "listen" : "mute"}`}
        originWhitelist={["*", "http://*", "https://*", "ws://*", "wss://*"]}
        source={{ html, baseUrl: pageBase }}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs
        mixedContentMode="always"
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        setSupportMultipleWindows={false}
        androidLayerType={Platform.OS === "android" ? "hardware" : undefined}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data) as {
              type?: string;
              channel?: MediaChannel;
            };
            if (message.type === "select" && (message.channel === "dms" || message.channel === "cms")) {
              onSelect(message.channel);
            }
          } catch {
            // Ignore malformed player messages.
          }
        }}
      />
    </View>
  );
}
