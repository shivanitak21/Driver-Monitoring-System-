import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/providers/ThemeProvider";
import { bustMediaUrl } from "@/services/api/media";
import { saveBase64ToGallery } from "@/services/media/gallery";
import { buildLiveKitWatchHtml } from "@/services/media/livekitWatchHtml";
import type { LiveFrame, VideoSession } from "@/types/domain";

export type CabinWatchPlayerHandle = {
  startLocalRecord: () => void;
  stopLocalRecord: () => Promise<string>;
};

type Props = {
  session: VideoSession;
  listen: boolean;
  /** Shown under the player while LiveKit has no video yet. */
  fallbackFrame?: LiveFrame | null;
  height?: number;
  onLocalRecordingChange?: (active: boolean) => void;
};

export const CabinWatchPlayer = forwardRef<CabinWatchPlayerHandle, Props>(
  function CabinWatchPlayer(
    { session, listen, fallbackFrame, height = 280, onLocalRecordingChange },
    ref,
  ) {
    const { colors } = useTheme();
    const webRef = useRef<WebView>(null);
    const [status, setStatus] = useState("Connecting…");
    const [hasTrack, setHasTrack] = useState(false);
    const chunkBuf = useRef<{ total: number; parts: string[]; mime: string } | null>(null);
    const stopWaiters = useRef<
      Array<{
        resolve: (uri: string) => void;
        reject: (error: Error) => void;
      }>
    >([]);

    const pageBase = "http://localhost";

    const html = useMemo(() => {
      if (session.mode !== "livekit" || !session.url || !session.token) return null;
      return buildLiveKitWatchHtml({
        url: session.url,
        token: session.token,
        listen,
      });
    }, [listen, session.mode, session.token, session.url]);

    const fallbackUri = fallbackFrame
      ? bustMediaUrl(fallbackFrame.imageUrl, fallbackFrame.at)
      : session.previewUrl
        ? bustMediaUrl(`${session.previewUrl}?track=cabin`, Date.now())
        : "";

    const rejectWaiters = (message: string) => {
      const err = new Error(message);
      stopWaiters.current.splice(0).forEach((waiter) => waiter.reject(err));
    };

    useImperativeHandle(ref, () => ({
      startLocalRecord: () => {
        webRef.current?.injectJavaScript(
          "try{window.__vmsStartLocalRecord&&window.__vmsStartLocalRecord()}catch(e){};true;",
        );
      },
      stopLocalRecord: () =>
        new Promise<string>((resolve, reject) => {
          stopWaiters.current.push({ resolve, reject });
          webRef.current?.injectJavaScript(
            "try{window.__vmsStopLocalRecord&&window.__vmsStopLocalRecord()}catch(e){};true;",
          );
          setTimeout(() => {
            if (stopWaiters.current.length) {
              rejectWaiters("Timed out saving local recording");
            }
          }, 45000);
        }),
    }));

    const styles = useMemo(
      () =>
        StyleSheet.create({
          wrap: {
            height,
            borderRadius: 24,
            overflow: "hidden",
            backgroundColor: "#000",
          },
          web: { flex: 1, backgroundColor: "transparent" },
          preview: {
            ...StyleSheet.absoluteFillObject,
            width: "100%",
            height: "100%",
          },
          fallback: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            gap: 6,
            backgroundColor: colors.bgSoft,
          },
          badgeRow: {
            position: "absolute",
            top: 14,
            left: 14,
            right: 14,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          },
          badge: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: "rgba(0,0,0,0.55)",
          },
          dot: {
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: hasTrack ? "#FF453A" : colors.amber,
          },
          footer: {
            marginTop: 10,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          },
        }),
      [colors.amber, colors.bgSoft, hasTrack, height],
    );

    if (session.mode === "dummy") {
      return (
        <View>
          <View style={styles.wrap}>
            {fallbackUri || session.previewUrl ? (
              <Image
                source={{ uri: fallbackUri || `${session.previewUrl}?track=cabin` }}
                style={styles.preview}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.fallback}>
                <AppText variant="caption">Dummy mode — no LiveKit stream</AppText>
              </View>
            )}
          </View>
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
          {!hasTrack && fallbackUri ? (
            <Image source={{ uri: fallbackUri }} style={styles.preview} resizeMode="contain" />
          ) : null}
          <WebView
            ref={webRef}
            key={`${session.room}-${session.token.slice(0, 12)}-${listen ? "listen" : "mute"}`}
            originWhitelist={["*", "http://*", "https://*", "ws://*", "wss://*"]}
            source={{ html, baseUrl: pageBase }}
            style={[styles.web, !hasTrack && fallbackUri ? { backgroundColor: "transparent" } : null]}
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
                  kind?: string;
                  index?: number;
                  total?: number;
                  data?: string;
                  mime?: string;
                };

                if (message.type === "status" && message.message) setStatus(message.message);
                if (message.type === "track" && message.kind === "video") setHasTrack(true);
                if (message.type === "error" && message.message) setStatus(message.message);
                if (message.type === "connected") {
                  setStatus(
                    session.publisherOnline
                      ? listen
                        ? "Live · listening"
                        : "Live · watching"
                      : "In room · car camera offline",
                  );
                }
                if (message.type === "disconnected") {
                  setHasTrack(false);
                  setStatus("Disconnected");
                }

                if (message.type === "recording-started") {
                  onLocalRecordingChange?.(true);
                  setStatus("Recording cabin on phone…");
                }
                if (message.type === "recording-begin") {
                  chunkBuf.current = {
                    total: message.total || 1,
                    parts: new Array(message.total || 1).fill(""),
                    mime: message.mime || "video/webm",
                  };
                }
                if (message.type === "recording-chunk" && chunkBuf.current && typeof message.index === "number") {
                  chunkBuf.current.parts[message.index] = message.data || "";
                }
                if (message.type === "recording-done") {
                  onLocalRecordingChange?.(false);
                  const buf = chunkBuf.current;
                  chunkBuf.current = null;
                  const b64 = buf?.parts.join("") || "";
                  const mime = buf?.mime || message.mime || "video/webm";
                  const ext = mime.includes("mp4") ? "mp4" : "webm";
                  void (async () => {
                    try {
                      if (!b64) throw new Error("Empty recording");
                      const asset = await saveBase64ToGallery(
                        b64,
                        `vms-cabin-${Date.now()}.${ext}`,
                        mime,
                      );
                      setStatus("Recording saved to Photos");
                      stopWaiters.current.splice(0).forEach((waiter) => waiter.resolve(asset.uri));
                    } catch (error) {
                      const msg = error instanceof Error ? error.message : "Save failed";
                      setStatus(msg);
                      rejectWaiters(msg);
                    }
                  })();
                }
                if (message.type === "recording-error") {
                  onLocalRecordingChange?.(false);
                  const msg = message.message || "Recording failed";
                  setStatus(msg);
                  rejectWaiters(msg);
                }
              } catch {
                // ignore
              }
            }}
          />
          <View style={styles.badgeRow} pointerEvents="none">
            <View style={styles.badge}>
              <View style={styles.dot} />
              <AppText variant="caption" style={{ color: "#fff" }}>
                {hasTrack ? "LIVE" : session.publisherOnline ? "…" : "OFFLINE"}
              </AppText>
            </View>
            <View style={styles.badge}>
              <AppText variant="caption" style={{ color: "#fff" }}>
                cabin · {listen ? "video + mic" : "video"}
              </AppText>
            </View>
          </View>
        </View>
        <View style={styles.footer}>
          <AppText variant="caption" numberOfLines={2} style={{ flex: 1 }}>
            {status}
          </AppText>
          {!session.publisherOnline ? (
            <AppText variant="caption" style={{ color: colors.amber }}>
              publisher off
            </AppText>
          ) : null}
        </View>
      </View>
    );
  },
);
