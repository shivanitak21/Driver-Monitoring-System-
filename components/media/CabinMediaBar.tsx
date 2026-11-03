import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";

import { CabinTalkPublisher } from "@/components/media/CabinTalkPublisher";
import { CabinWatchPlayer, type WatchLayout } from "@/components/media/CabinWatchPlayer";
import { LiveStill } from "@/components/media/LiveStill";
import { StreamReading } from "@/components/media/StreamReading";
import { SnapShotFly, type FlyRect } from "@/components/media/SnapShotFly";
import { AppText } from "@/components/ui/AppText";
import { Camera, CircleDot, Ear, Mic, Video } from "@/components/ui/icons";
import { ApiError } from "@/services/api/http";
import { bustMediaUrl } from "@/services/api/media";
import { saveRemoteImageToGallery } from "@/services/media/gallery";
import { ensureMicrophonePermission } from "@/services/media/micPermission";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";
import type { MediaChannel } from "@/types/domain";
import { friendlyActionError } from "@/utils/errors";
import { notificationFeedback, selectionFeedback } from "@/utils/haptics";

type Flight = { uri: string; from: FlyRect; to: FlyRect; token: number };

type HostRef = {
  measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void;
};

const INK = "#F5F6F7";
const GLASS = "rgba(9,10,12,0.58)";

function measureWindow(node: HostRef): Promise<FlyRect> {
  return new Promise((resolve, reject) => {
    node.measureInWindow((x, y, width, height) => {
      if (width <= 0 || height <= 0) reject(new Error("empty"));
      else resolve({ x, y, width, height });
    });
  });
}

export function CabinMediaBar({ reloadToken }: { reloadToken?: number }) {
  const { colors } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const videoSession = useRideStore((state) => state.videoSession);
  const talkSession = useRideStore((state) => state.talkSession);
  const frameCms = useRideStore((state) => state.frameCms);
  const frameDms = useRideStore((state) => state.frameDms);
  const activeRecording = useRideStore((state) => state.activeRecording);
  const startWatch = useRideStore((state) => state.startWatch);
  const stopWatch = useRideStore((state) => state.stopWatch);
  const startTalk = useRideStore((state) => state.startTalk);
  const stopTalk = useRideStore((state) => state.stopTalk);
  const startRecording = useRideStore((state) => state.startRecording);
  const stopRecording = useRideStore((state) => state.stopRecording);
  const takeSnapshot = useRideStore((state) => state.takeSnapshot);

  const wrapRef = useRef<HostRef | null>(null);
  const stageRef = useRef<HostRef | null>(null);
  const boxRef = useRef<HostRef | null>(null);

  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [layout, setLayout] = useState<WatchLayout>("both");
  const [channel, setChannel] = useState<MediaChannel>("dms");
  const [flight, setFlight] = useState<Flight | null>(null);

  const boxScale = useSharedValue(1);
  const watching = Boolean(videoSession);
  const speaking = Boolean(talkSession);
  const recordingNow = activeRecording?.status === "recording";
  const stageHeight = Math.max(
    layout === "both" ? 440 : 360,
    Math.min(620, Math.round(screenHeight * (layout === "both" ? 0.58 : 0.5))),
  );

  useEffect(() => {
    if (!videoSession || videoSession.mode !== "livekit" || !videoSession.expiresAt) return;
    const delay = videoSession.expiresAt - Date.now() - 60_000;
    const timer = setTimeout(() => {
      void startWatch().catch(() => undefined);
    }, Math.max(5_000, delay));
    return () => clearTimeout(timer);
  }, [startWatch, videoSession]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { gap: 14 },
        stage: {
          marginHorizontal: -20,
          width: screenWidth,
          borderRadius: 0,
          overflow: "hidden",
          backgroundColor: "#0C0D10",
        },
        stills: { flex: 1, gap: 2, backgroundColor: "#0C0D10" },
        switchSlot: {
          position: "absolute",
          top: 12,
          left: 0,
          right: 0,
          alignItems: "center",
        },
        switchTrack: {
          flexDirection: "row",
          width: 232,
          padding: 3,
          borderRadius: 999,
          backgroundColor: GLASS,
        },
        switchItem: {
          flex: 1,
          minHeight: 34,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
        },
        switchOn: { backgroundColor: colors.lime },
        rail: {
          position: "absolute",
          top: 64,
          bottom: 78,
          justifyContent: "center",
          gap: 12,
        },
        railLeft: { left: 12 },
        railRight: { right: 12 },
        orb: {
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: GLASS,
        },
        orbOn: { backgroundColor: colors.lime },
        orbDanger: { backgroundColor: colors.danger },
        watchSlot: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 16,
          alignItems: "center",
        },
        watch: {
          minHeight: 44,
          paddingHorizontal: 16,
          borderRadius: 999,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: GLASS,
        },
        watchOn: { backgroundColor: colors.danger },
      }),
    [colors.danger, colors.lime, screenWidth],
  );

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boxScale.value }],
  }));

  const run = async (key: string, work: () => Promise<void>) => {
    setBusy(key);
    setNote(null);
    try {
      await work();
      void selectionFeedback();
    } catch (error) {
      setNote(friendlyActionError(error));
    } finally {
      setBusy(null);
    }
  };

  const pulseBox = () => {
    boxScale.value = withSequence(withTiming(1.08, { duration: 120 }), withSpring(1, { damping: 14, stiffness: 220 }));
  };

  const onLayout = (next: WatchLayout) => {
    setLayout(next);
    if (next === "dms" || next === "cms") setChannel(next);
  };

  const onWatch = () =>
    run("watch", async () => {
      if (watching) {
        if (useRideStore.getState().activeRecording?.status === "recording") await stopRecording();
        await stopWatch();
        setListening(false);
        return;
      }
      await startWatch();
    });

  const onListen = () =>
    run("listen", async () => {
      if (listening) {
        setListening(false);
        return;
      }
      if (!watching) await startWatch();
      setListening(true);
    });

  const onRecord = () =>
    run("record", async () => {
      if (useRideStore.getState().activeRecording?.status === "recording") {
        await stopRecording();
        return;
      }
      await startRecording();
    });

  const onSnap = () =>
    run("snap", async () => {
      const frame = channel === "cms" ? useRideStore.getState().frameCms : useRideStore.getState().frameDms;
      const preview = frame?.imageUrl ? bustMediaUrl(frame.imageUrl, Date.now()) : null;
      let flying = false;

      if (!reduceMotion && preview && wrapRef.current && stageRef.current && boxRef.current) {
        try {
          const [wrapBox, from, to] = await Promise.all([
            measureWindow(wrapRef.current),
            measureWindow(stageRef.current),
            measureWindow(boxRef.current),
          ]);
          setFlight({
            uri: preview,
            token: Date.now(),
            from: { x: from.x - wrapBox.x, y: from.y - wrapBox.y, width: from.width, height: from.height },
            to: { x: to.x - wrapBox.x, y: to.y - wrapBox.y, width: to.width, height: to.height },
          });
          flying = true;
        } catch {
          // The snap still saves if the preview cannot be measured.
        }
      }

      const snap = await takeSnapshot(channel);
      void saveRemoteImageToGallery(snap.imageUrl, `vms-${snap.channel}-${snap.id}.jpg`).catch(() => undefined);
      void notificationFeedback();
      if (!flying) pulseBox();
    });

  const onSpeak = () =>
    run("speak", async () => {
      if (speaking) {
        await stopTalk();
        return;
      }
      try {
        await ensureMicrophonePermission();
        await startTalk();
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          throw new Error("Speak isn’t available on this server yet.");
        }
        if (error instanceof ApiError && error.status === 409) {
          throw new Error("Speak needs the live video service.");
        }
        if (error instanceof ApiError && error.status === 403) {
          throw new Error("Sharing is off, so Speak is blocked.");
        }
        throw error;
      }
    });

  const showDriver = layout !== "cms";
  const showCabin = layout !== "dms";

  return (
    <View
      ref={(node) => {
        wrapRef.current = node as HostRef | null;
      }}
      style={styles.wrap}
      collapsable={false}
    >
      <View
        ref={(node) => {
          stageRef.current = node as HostRef | null;
        }}
        collapsable={false}
        style={[styles.stage, { height: stageHeight }]}
      >
        {watching && videoSession ? (
          <CabinWatchPlayer
            session={videoSession}
            listen={listening}
            layout={layout}
            selected={channel}
            onSelect={setChannel}
            driverFrame={frameDms}
            cabinFrame={frameCms}
            height={stageHeight}
            broad
          />
        ) : (
          <View style={styles.stills}>
            {showDriver ? (
              <LiveStill
                frame={frameDms}
                label="Driver"
                embedded
                hideTag={layout !== "both"}
                tagClearance={layout === "both" ? 48 : 0}
                reloadToken={reloadToken}
              />
            ) : null}
            {showCabin ? (
              <LiveStill frame={frameCms} label="Cabin" embedded hideTag={layout !== "both"} reloadToken={reloadToken} />
            ) : null}
          </View>
        )}

        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <View pointerEvents="box-none" style={styles.switchSlot}>
            <View style={styles.switchTrack}>
              {(
                [
                  { id: "both", label: "Both" },
                  { id: "cms", label: "Cabin" },
                  { id: "dms", label: "Driver" },
                ] as const
              ).map((item) => {
                const selected = layout === item.id;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={item.label}
                    onPress={() => {
                      void selectionFeedback();
                      onLayout(item.id);
                    }}
                    style={[styles.switchItem, selected && styles.switchOn]}
                  >
                    <AppText
                      variant="caption"
                      style={{ color: selected ? colors.limeInk : INK, fontSize: 13 }}
                    >
                      {item.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View pointerEvents="box-none" style={[styles.rail, styles.railLeft]}>
            <Orb
              label={listening ? "Mute" : "Listen"}
              busy={busy === "listen"}
              active={listening}
              onPress={onListen}
              icon={<Ear size={20} color={listening ? colors.limeInk : INK} strokeWidth={1.75} />}
              styles={styles}
            />
            <Orb
              label={recordingNow ? "Stop recording" : "Record"}
              busy={busy === "record"}
              active={recordingNow}
              danger
              onPress={onRecord}
              icon={<CircleDot size={20} color={recordingNow ? colors.onDanger : INK} strokeWidth={1.75} />}
              styles={styles}
            />
          </View>

          <View pointerEvents="box-none" style={[styles.rail, styles.railRight]}>
            <View
              ref={(node) => {
                boxRef.current = node as HostRef | null;
              }}
              collapsable={false}
            >
              <Animated.View style={boxStyle}>
                <Orb
                  label="Snap"
                  busy={busy === "snap"}
                  onPress={onSnap}
                  icon={<Camera size={20} color={INK} strokeWidth={1.75} />}
                  styles={styles}
                />
              </Animated.View>
            </View>
            <Orb
              label={speaking ? "End speak" : "Speak"}
              busy={busy === "speak"}
              active={speaking}
              danger
              onPress={onSpeak}
              icon={<Mic size={20} color={speaking ? colors.onDanger : INK} strokeWidth={1.75} />}
              styles={styles}
            />
          </View>

          <View pointerEvents="box-none" style={styles.watchSlot}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={watching ? "Stop watch" : "Watch"}
              onPress={onWatch}
              disabled={busy === "watch"}
              style={[styles.watch, watching && styles.watchOn, busy === "watch" && { opacity: 0.55 }]}
            >
              {busy === "watch" ? (
                <ActivityIndicator color={INK} />
              ) : (
                <Video size={18} color={watching ? colors.onDanger : INK} strokeWidth={1.75} />
              )}
              <AppText variant="caption" style={{ color: watching ? colors.onDanger : INK }}>
                {watching ? "Stop" : "Watch"}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>

      {note ? (
        <AppText variant="caption" style={{ color: colors.amber }} numberOfLines={2}>
          {note}
        </AppText>
      ) : null}

      {speaking && talkSession ? <CabinTalkPublisher session={talkSession} /> : null}
      <StreamReading layout={layout} />

      {flight ? (
        <SnapShotFly
          key={flight.token}
          uri={flight.uri}
          from={flight.from}
          to={flight.to}
          onDone={() => {
            setFlight(null);
            pulseBox();
          }}
        />
      ) : null}
    </View>
  );
}

function Orb({
  label,
  icon,
  onPress,
  busy,
  active,
  danger,
  styles,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  busy: boolean;
  active?: boolean;
  danger?: boolean;
  styles: {
    orb: object;
    orbOn: object;
    orbDanger: object;
  };
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: Boolean(active) }}
      onPress={onPress}
      disabled={busy}
      hitSlop={6}
      style={({ pressed }) => [pressed && !busy && { opacity: 0.72 }, busy && { opacity: 0.55 }]}
    >
      <View style={[styles.orb, active && !danger && styles.orbOn, active && danger && styles.orbDanger]}>
        {busy ? <ActivityIndicator color={active ? colors.limeInk : INK} /> : icon}
      </View>
    </Pressable>
  );
}
