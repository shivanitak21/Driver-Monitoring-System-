import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/providers/ThemeProvider";
import { bustMediaUrl } from "@/services/api/media";
import { saveBase64File, saveBase64ToGallery } from "@/services/media/gallery";
import { buildLiveKitWatchHtml } from "@/services/media/livekitWatchHtml";
import type { LiveFrame, VideoSession } from "@/types/domain";

function shortStatus(message: string) {
  if (/requestPermissionsAsync|AndroidManifest|AUDIO permission|ExpoMediaLibrary/i.test(message)) {
    return "Couldn’t save to Photos.";
  }
  return message.length > 90 ? `${message.slice(0, 87)}…` : message;
}

export type CabinWatchPlayerHandle = {
  /** Resolves once the live video track is actually recording. */
  startLocalRecord: () => Promise<void>;
  stopLocalRecord: () => Promise<string>;
};

type Props = {
  session: VideoSession;
  listen: boolean;
  /** Shown under the player while LiveKit has no video yet. */
  fallbackFrame?: LiveFrame | null;
  height?: number;
  /** Edge-to-edge picture. Hides the caption under the frame. */
  broad?: boolean;
  onLocalRecordingChange?: (active: boolean) => void;
};

export const CabinWatchPlayer = forwardRef<CabinWatchPlayerHandle, Props>(
  function CabinWatchPlayer(
    { session, listen, fallbackFrame, height = 280, broad = false, onLocalRecordingChange },
    ref,
  ) {
    const { colors } = useTheme();
    const webRef = useRef<WebView>(null);
    const [status, setStatus] = useState("Connecting…");
    const [hasTrack, setHasTrack] = useState(false);
    const chunkBuf = useRef<{ total: number; parts: string[]; mime: string } | null>(null);
    const startWaiters = useRef<
      Array<{
        resolve: () => void;
        reject: (error: Error) => void;
      }>
    >([]);
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
      startLocalRecord: () =>
        new Promise<void>((resolve, reject) => {
          if (!webRef.current) {
            reject(new Error("Live video isn’t open yet."));
            return;
          }
          startWaiters.current.push({ resolve, reject });
          webRef.current.injectJavaScript(
            "try{window.__vmsStartLocalRecord&&window.__vmsStartLocalRecord()}catch(e){};true;",
          );
          setTimeout(() => {
            const pending = startWaiters.current.find((waiter) => waiter.resolve === resolve);
            if (!pending) return;
            startWaiters.current = startWaiters.current.filter((waiter) => waiter.resolve !== resolve);
            reject(new Error("Live video isn’t ready. Wait until the cabin picture is moving, then Record."));
          }, 6000);
        }),
      stopLocalRecord: () =>
        new Promise<string>((resolve, reject) => {
          stopWaiters.current.push({ resolve, reject });
          webRef.current?.injectJavaScript(
            "try{window.__vmsStopLocalRecord&&window.__vmsStopLocalRecord()}catch(e){};true;",
          );
          setTimeout(() => {
            if (stopWaiters.current.length) {
              rejectWaiters("Timed out saving the live recording");
            }
          }, 45000);
        }),
    }));

    const styles = useMemo(
      () =>
        StyleSheet.create({
          wrap: {
            height,
            borderRadius: broad ? 0 : 24,
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
      [broad, colors.amber, colors.bgSoft, hasTrack, height],
    );

    if (session.mode === "dummy") {
      return (
        <View>
          <View style={styles.wrap}>
            {fallbackUri || session.previewUrl ? (
              <Image
                source={{ uri: fallbackUri || `${session.previewUrl}?track=cabin` }}
                style={styles.preview}
                resizeMode="cover"
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
            <Image source={{ uri: fallbackUri }} style={styles.preview} resizeMode="cover" />
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

                if (message.type === "status" && message.message) setStatus(shortStatus(message.message));
                if (message.type === "track" && message.kind === "video") setHasTrack(true);
                if (message.type === "error" && message.message) setStatus(shortStatus(message.message));
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
                  setStatus("Recording live video…");
                  startWaiters.current.splice(0).forEach((waiter) => waiter.resolve());
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
                      if (!b64) throw new Error("The live recording was empty.");
                      const filename = `vms-cabin-${Date.now()}.${ext}`;
                      const fileUri = await saveBase64File(b64, filename);
                      try {
                        await saveBase64ToGallery(b64, filename, mime);
                      } catch {
                        // The clip is already in app storage. Photos is optional.
                      }
                      setStatus("Live recording saved.");
                      stopWaiters.current.splice(0).forEach((waiter) => waiter.resolve(fileUri));
                    } catch (error) {
                      const msg = error instanceof Error ? error.message : "Save failed";
                      setStatus(shortStatus(msg));
                      rejectWaiters(msg);
                    }
                  })();
                }
                if (message.type === "recording-error") {
                  onLocalRecordingChange?.(false);
                  const msg = shortStatus(message.message || "Recording failed");
                  setStatus(msg);
                  if (startWaiters.current.length) {
                    const err = new Error(msg);
                    startWaiters.current.splice(0).forEach((waiter) => waiter.reject(err));
                  } else {
                    rejectWaiters(msg);
                  }
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
        {broad ? null : (
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
        )}
      </View>
    );
  },
);
