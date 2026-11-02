import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/providers/ThemeProvider";
import { bustMediaUrl } from "@/services/api/media";
import { buildLiveKitWatchHtml } from "@/services/media/livekitWatchHtml";
import type { LiveFrame, MediaChannel, VideoSession } from "@/types/domain";

function shortStatus(message: string) {
  return message.length > 90 ? `${message.slice(0, 87)}…` : message;
}

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
  const { colors } = useTheme();
  const webRef = useRef<WebView>(null);
  const [status, setStatus] = useState("Connecting…");
  const [driverLive, setDriverLive] = useState(false);
  const [cabinLive, setCabinLive] = useState(false);
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
          gap: 6,
          backgroundColor: colors.bgSoft,
        },
        footer: {
          marginTop: 10,
          paddingHorizontal: broad ? 20 : 0,
        },
      }),
    [broad, colors.bgSoft, height],
  );

  if (session.mode === "dummy" || session.mode === "local") {
    return (
      <View style={styles.wrap}>
        <View style={styles.fallback}>
          <AppText variant="strong">{session.mode === "dummy" ? "No live stream" : "Local sample mode"}</AppText>
          <AppText variant="caption">
            {session.mode === "dummy"
              ? "The server is not publishing LiveKit. Driver and cabin stills stay below."
              : "This server has no LiveKit room. Production Watch needs mode livekit."}
          </AppText>
        </View>
      </View>
    );
  }

  if (!html) {
    return (
      <View style={styles.wrap}>
        <View style={styles.fallback}>
          <AppText variant="caption">The video response had no LiveKit url or token.</AppText>
        </View>
      </View>
    );
  }

  const liveLabel = [
    driverLive ? "Driver live" : "Driver waiting",
    cabinLive ? "Cabin live" : "Cabin waiting",
    listen ? "mic on" : "mic off",
  ].join(" · ");

  return (
    <View>
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
                message?: string;
                channel?: MediaChannel;
                driver?: boolean;
                cabin?: boolean;
              };
              if (message.type === "status" && message.message) setStatus(shortStatus(message.message));
              if (message.type === "error" && message.message) setStatus(shortStatus(message.message));
              if (message.type === "tracks") {
                setDriverLive(Boolean(message.driver));
                setCabinLive(Boolean(message.cabin));
              }
              if (message.type === "select" && (message.channel === "dms" || message.channel === "cms")) {
                onSelect(message.channel);
              }
              if (message.type === "disconnected") {
                setDriverLive(false);
                setCabinLive(false);
                setStatus("Disconnected");
              }
            } catch {
              // Ignore malformed player messages.
            }
          }}
        />
      </View>
      <View style={styles.footer}>
        <AppText variant="caption" numberOfLines={2}>
          {liveLabel}
          {status ? ` · ${status}` : ""}
        </AppText>
      </View>
    </View>
  );
}
