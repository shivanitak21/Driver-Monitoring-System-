import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { WebView } from "react-native-webview";

import { AppText } from "@/components/ui/AppText";
import { bustMediaUrl } from "@/services/api/media";
import { services } from "@/services/createServices";
import { buildLiveKitWatchHtml } from "@/services/media/livekitWatchHtml";
import { useRideStore } from "@/stores/useRideStore";
import type { LiveFrame, LocalVideoSample, MediaChannel, VideoSession } from "@/types/domain";

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
  /** Pixel weights so each camera pane matches its picture. */
  driverPane?: number;
  cabinPane?: number;
  onAspect?: (channel: "driver" | "cabin", ratio: number) => void;
};

/**
 * Watch player — three decode paths (docs/GUARDIAN_ANDROID_DECODE.md):
 * 1. livekit → subscribe to remote tracks `driver` / `cabin` (+ cabin audio)
 * 2. dummy → JPEG from preview URL (still Image, not a video player)
 * 3. local → poll `image_b64` and JPEG-decode into Image (not MP4 / LiveKit)
 */
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
  driverPane = 1,
  cabinPane = 1,
  onAspect,
}: Props) {
  const webRef = useRef<WebView>(null);
  const pageBase = "http://localhost";
  const rideId = useRideStore((state) => state.rideId);
  const htmlLayout = layout === "dms" ? "driver" : layout === "cms" ? "cabin" : "both";
  const htmlSelected = selected === "cms" ? "cabin" : "driver";
  const [localSample, setLocalSample] = useState<LocalVideoSample | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

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
      `try{window.__vmsSetLayout&&window.__vmsSetLayout(${JSON.stringify(htmlLayout)});window.__vmsSetSelected&&window.__vmsSetSelected(${JSON.stringify(htmlSelected)});window.__vmsSetPanes&&window.__vmsSetPanes(${driverPane},${cabinPane});}catch(e){};true;`,
    );
  }, [cabinPane, driverPane, htmlLayout, htmlSelected]);

  // Local mode: poll JPEG stills (~2s). Do not treat image_b64 as video.
  useEffect(() => {
    if (session.mode !== "local" || !services.api || !rideId) {
      setLocalSample(null);
      setLocalError(null);
      return;
    }
    let alive = true;
    const pull = () => {
      void services.api
        ?.getVideoLive(rideId)
        .then((sample) => {
          if (!alive) return;
          setLocalSample(sample);
          setLocalError(null);
          if (sample.width > 1 && sample.height > 1) {
            onAspect?.("driver", sample.width / sample.height);
            onAspect?.("cabin", sample.width / sample.height);
          }
        })
        .catch((err: unknown) => {
          if (!alive) return;
          setLocalError(err instanceof Error ? err.message : "Local still failed");
        });
    };
    pull();
    const id = setInterval(pull, 2000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [onAspect, rideId, session.mode]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          height,
          borderRadius: broad ? 0 : 24,
          overflow: "hidden",
          backgroundColor: "#000",
        },
        web: { height, backgroundColor: "#000" },
        fallback: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          backgroundColor: "#0C0D10",
        },
        stack: { flex: 1, gap: 4 },
        pane: { flex: 1, minHeight: 0, backgroundColor: "#000", overflow: "hidden" },
        paneSelected: { borderWidth: 2, borderColor: "#F5F5F7" },
        image: { width: "100%", height: "100%" },
        tag: {
          position: "absolute",
          left: 10,
          top: 10,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: "rgba(0,0,0,0.55)",
        },
      }),
    [broad, height],
  );

  const showDriver = layout !== "cms";
  const showCabin = layout !== "dms";

  if (session.mode === "dummy") {
    const driverUri = posterFor(driverFrame, session.previewUrl, "driver");
    const cabinUri = posterFor(cabinFrame, session.previewUrl, "cabin");
    return (
      <View style={styles.wrap}>
        <View style={styles.stack}>
          {showDriver ? (
            <Pressable
              style={[styles.pane, selected === "dms" && styles.paneSelected]}
              onPress={() => onSelect("dms")}
            >
              {driverUri ? (
                <Image source={{ uri: driverUri }} style={styles.image} contentFit="contain" />
              ) : (
                <View style={styles.fallback}>
                  <AppText variant="caption" style={{ color: "#F5F6F7" }}>
                    Waiting for driver JPEG
                  </AppText>
                </View>
              )}
              <View style={styles.tag} pointerEvents="none">
                <AppText variant="caption" style={{ color: "#F5F6F7" }}>
                  Driver
                </AppText>
              </View>
            </Pressable>
          ) : null}
          {showCabin ? (
            <Pressable
              style={[styles.pane, selected === "cms" && styles.paneSelected]}
              onPress={() => onSelect("cms")}
            >
              {cabinUri ? (
                <Image source={{ uri: cabinUri }} style={styles.image} contentFit="contain" />
              ) : (
                <View style={styles.fallback}>
                  <AppText variant="caption" style={{ color: "#F5F6F7" }}>
                    Waiting for cabin JPEG
                  </AppText>
                </View>
              )}
              <View style={styles.tag} pointerEvents="none">
                <AppText variant="caption" style={{ color: "#F5F6F7" }}>
                  Cabin
                </AppText>
              </View>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  if (session.mode === "local") {
    const uri = localSample?.imageUri || "";
    return (
      <View style={styles.wrap}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} contentFit="contain" cachePolicy="none" />
        ) : (
          <View style={styles.fallback}>
            <AppText variant="caption" style={{ color: "#F5F6F7" }}>
              {localError || "Waiting for local JPEG still…"}
            </AppText>
          </View>
        )}
        <View style={styles.tag} pointerEvents="none">
          <AppText variant="caption" style={{ color: "#F5F6F7" }}>
            Local still · JPEG
          </AppText>
        </View>
      </View>
    );
  }

  if (!html) {
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
              channel?: MediaChannel | "driver" | "cabin";
              width?: number;
              height?: number;
            };
            if (message.type === "select" && (message.channel === "dms" || message.channel === "cms")) {
              onSelect(message.channel);
            }
            if (
              message.type === "aspect" &&
              (message.channel === "driver" || message.channel === "cabin") &&
              message.width &&
              message.height &&
              message.height > 0
            ) {
              onAspect?.(message.channel, message.width / message.height);
            }
          } catch {
            // Ignore malformed player messages.
          }
        }}
      />
    </View>
  );
}
