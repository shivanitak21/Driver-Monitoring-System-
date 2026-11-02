import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";

import { CabinTalkPublisher } from "@/components/media/CabinTalkPublisher";
import { CabinWatchPlayer, type WatchLayout } from "@/components/media/CabinWatchPlayer";
import { StreamReading } from "@/components/media/StreamReading";
import { SnapShotFly, type FlyRect } from "@/components/media/SnapShotFly";
import { AppText } from "@/components/ui/AppText";
import { Segmented } from "@/components/ui/Segmented";
import { Camera, CircleDot, Ear, Mic, Video } from "@/components/ui/icons";
import { ApiError } from "@/services/api/http";
import { bustMediaUrl } from "@/services/api/media";
import { saveRemoteImageToGallery } from "@/services/media/gallery";
import { ensureMicrophonePermission } from "@/services/media/micPermission";
import { useTheme } from "@/providers/ThemeProvider";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useRideStore } from "@/stores/useRideStore";
import type { MediaChannel } from "@/types/domain";
import { friendlyActionError } from "@/utils/errors";
import { notificationFeedback, selectionFeedback } from "@/utils/haptics";

type Props = {
  /** Camera a snapshot will save. Driver or cabin, never both. */
  channel: MediaChannel;
  onChannelChange: (channel: MediaChannel) => void;
};

type Flight = { uri: string; from: FlyRect; to: FlyRect; token: number };

type HostRef = {
  measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void;
};

function measureWindow(node: HostRef): Promise<FlyRect> {
  return new Promise((resolve, reject) => {
    node.measureInWindow((x, y, width, height) => {
      if (width <= 0 || height <= 0) reject(new Error("empty"));
      else resolve({ x, y, width, height });
    });
  });
}

export function CabinMediaBar({ channel, onChannelChange }: Props) {
  const { colors } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const videoSession = useRideStore((state) => state.videoSession);
  const talkSession = useRideStore((state) => state.talkSession);
  const frameCms = useRideStore((state) => state.frameCms);
  const frameDms = useRideStore((state) => state.frameDms);
  const activeRecording = useRideStore((state) => state.activeRecording);
  const snapshots = useRideStore((state) => state.snapshots);
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
  const [watchLayout, setWatchLayout] = useState<WatchLayout>("both");
  const [speakBlocked, setSpeakBlocked] = useState<string | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [frozen, setFrozen] = useState(false);
  const [frozenUri, setFrozenUri] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const revealUri = useRef<string | null>(null);

  const boxScale = useSharedValue(1);

  const watching = Boolean(videoSession);
  const speaking = Boolean(talkSession);
  const latest = snapshots[0]?.imageUrl ?? null;
  const boxUri = pinned ?? (frozen ? frozenUri : latest);
  const channelLabel = channel === "cms" ? "Cabin" : "Driver";

  useEffect(() => {
    if (pinned && latest === pinned) setPinned(null);
  }, [latest, pinned]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { gap: 16 },
        stage: {
          height: 220,
          borderRadius: 22,
          overflow: "hidden",
          backgroundColor: "#0C0D10",
        },
        idle: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          gap: 6,
          backgroundColor: colors.bgSoft,
        },
        row: {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
        },
        control: {
          flex: 1,
          alignItems: "center",
          gap: 6,
        },
        circle: {
          width: 52,
          height: 52,
          borderRadius: 26,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bgRaised,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.line,
        },
        circleOn: {
          backgroundColor: colors.limeSoft,
          borderColor: "transparent",
        },
        circleDanger: {
          backgroundColor: "rgba(255,59,48,0.14)",
          borderColor: "transparent",
        },
        shelf: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          padding: 10,
          borderRadius: 18,
          backgroundColor: colors.bgRaised,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.line,
        },
        box: {
          width: 72,
          height: 54,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: colors.bgSoft,
          alignItems: "center",
          justifyContent: "center",
        },
        boxImage: { width: "100%", height: "100%" },
        shelfText: { flex: 1, gap: 2 },
        hint: { marginTop: -4 },
      }),
    [colors],
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

  const releaseBox = () => {
    setFrozen(false);
    setFrozenUri(null);
  };

  const pulseBox = () => {
    boxScale.value = withSequence(withTiming(1.06, { duration: 120 }), withSpring(1, { damping: 14, stiffness: 220 }));
  };

  useEffect(() => {
    if (!videoSession || videoSession.mode !== "livekit" || !videoSession.expiresAt) return;
    const delay = videoSession.expiresAt - Date.now() - 60_000;
    const timer = setTimeout(() => {
      void startWatch().catch(() => undefined);
    }, Math.max(5_000, delay));
    return () => clearTimeout(timer);
  }, [startWatch, videoSession]);

  const onWatch = () =>
    run("watch", async () => {
      if (watching) {
        if (activeRecording?.status === "recording") await stopRecording();
        await stopWatch();
        setListening(false);
        setNote("Watch off. Stills keep updating.");
        return;
      }
      await startWatch();
      setNote("Watch is on. Driver and cabin appear when the car publishes them.");
    });

  const onListen = () =>
    run("listen", async () => {
      if (listening) {
        setListening(false);
        setNote("Cabin mic muted.");
        return;
      }
      if (!watching) await startWatch();
      setListening(true);
      setNote("Listening to the cabin.");
    });

  const onRecord = () =>
    run("record", async () => {
      const status = useRideStore.getState().activeRecording?.status;
      if (status === "recording") {
        await stopRecording();
        setNote("Recording stopped. The file appears in the list when the car finishes the upload.");
        return;
      }
      await startRecording();
      const next = useRideStore.getState().activeRecording;
      setNote(
        next?.status === "recording"
          ? "Recording the cabin camera and microphone."
          : "The car accepted the recording. It shows in the list below.",
      );
    });

  const onSnap = () =>
    run("snap", async () => {
      const frame = channel === "cms" ? useRideStore.getState().frameCms : useRideStore.getState().frameDms;
      const preview = frame?.imageUrl ? bustMediaUrl(frame.imageUrl, Date.now()) : latest;
      setFrozen(true);
      setFrozenUri(latest);
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

      try {
        const snap = await takeSnapshot(channel);
        revealUri.current = snap.imageUrl;
        void saveRemoteImageToGallery(snap.imageUrl, `vms-${snap.channel}-${snap.id}.jpg`).catch(() => undefined);
        setNote(`Saved · ${channelLabel}`);
        void notificationFeedback();
        if (!flying) {
          releaseBox();
          setPinned(snap.imageUrl);
          pulseBox();
        }
      } catch (error) {
        setFlight(null);
        revealUri.current = null;
        releaseBox();
        throw error;
      }
    });

  const onSpeak = () =>
    run("speak", async () => {
      if (speaking) {
        await stopTalk();
        setSpeakBlocked(null);
        setNote("Speak ended.");
        return;
      }
      try {
        await ensureMicrophonePermission();
        await startTalk();
        setSpeakBlocked(null);
        setNote("Tap the red bar once to speak into the cabin.");
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          const msg = "Speak isn’t available on this server yet.";
          setSpeakBlocked(msg);
          throw new Error(msg);
        }
        if (error instanceof ApiError && error.status === 409) {
          const msg = "Speak needs the live video service.";
          setSpeakBlocked(msg);
          throw new Error(msg);
        }
        if (error instanceof ApiError && error.status === 403) {
          throw new Error("Sharing is off, so Speak is blocked.");
        }
        throw error;
      }
    });

  const recordingNow = activeRecording?.status === "recording";
  const frameHeight =
    watchLayout === "both"
      ? Math.max(520, Math.round(screenHeight * 0.72))
      : Math.max(280, Math.round(screenHeight * 0.46));

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
        style={watching ? { marginHorizontal: -20, width: screenWidth } : undefined}
      >
        {watching && videoSession ? (
          <CabinWatchPlayer
            session={videoSession}
            listen={listening}
            layout={watchLayout}
            selected={channel}
            onSelect={onChannelChange}
            driverFrame={frameDms}
            cabinFrame={frameCms}
            height={frameHeight}
            broad
          />
        ) : (
          <View style={[styles.stage, styles.idle]}>
            <AppText variant="strong">Cameras</AppText>
            <AppText variant="caption" style={{ textAlign: "center" }}>
              Tap Watch for the driver and cabin cameras. Snap saves the {channelLabel.toLowerCase()} still on the server.
            </AppText>
          </View>
        )}
      </View>

      <StreamReading layout={watching ? watchLayout : "both"} />

      {watching ? (
        <Segmented
          value={watchLayout}
          onChange={(id) => {
            const next = id as WatchLayout;
            setWatchLayout(next);
            if (next === "dms" || next === "cms") onChannelChange(next);
          }}
          items={[
            { id: "both", label: "Both" },
            { id: "dms", label: "Driver" },
            { id: "cms", label: "Cabin" },
          ]}
        />
      ) : null}

      <View style={styles.row}>
        <Control
          label={watching ? "Stop" : "Watch"}
          busy={busy === "watch"}
          active={watching}
          colors={colors}
          styles={styles}
          onPress={onWatch}
          icon={<Video size={20} color={watching ? colors.signal : colors.ink} strokeWidth={1.75} />}
        />
        <Control
          label={listening ? "Mute" : "Listen"}
          busy={busy === "listen"}
          active={listening}
          colors={colors}
          styles={styles}
          onPress={onListen}
          icon={<Ear size={20} color={listening ? colors.signal : colors.ink} strokeWidth={1.75} />}
        />
        <Control
          label={recordingNow ? "Stop" : "Record"}
          busy={busy === "record"}
          active={recordingNow}
          danger
          colors={colors}
          styles={styles}
          onPress={onRecord}
          icon={<CircleDot size={20} color={recordingNow ? colors.danger : colors.ink} strokeWidth={1.75} />}
        />
        <Control
          label="Snap"
          busy={busy === "snap"}
          active={false}
          colors={colors}
          styles={styles}
          onPress={onSnap}
          icon={<Camera size={20} color={colors.ink} strokeWidth={1.75} />}
        />
        <Control
          label={speaking ? "End" : "Speak"}
          busy={busy === "speak"}
          active={speaking}
          danger
          colors={colors}
          styles={styles}
          onPress={onSpeak}
          icon={<Mic size={20} color={speaking ? colors.danger : colors.ink} strokeWidth={1.75} />}
        />
      </View>

      <View style={styles.shelf}>
        <View
          ref={(node) => {
            boxRef.current = node as HostRef | null;
          }}
          style={styles.box}
          collapsable={false}
        >
          <Animated.View style={[StyleSheet.absoluteFill, boxStyle]}>
            {boxUri ? (
              <Image source={{ uri: boxUri }} style={styles.boxImage} contentFit="cover" />
            ) : (
              <View style={styles.box}>
                <Camera size={18} color={colors.inkFaint} strokeWidth={1.75} />
              </View>
            )}
          </Animated.View>
        </View>
        <View style={styles.shelfText}>
          <AppText variant="strong" style={{ fontSize: 15 }}>
            {boxUri ? "Latest snap" : "Snaps"}
          </AppText>
          <AppText variant="caption" numberOfLines={3}>
            {boxUri
              ? `${snapshots[0]?.channel === "cms" ? "Cabin" : "Driver"} still from the server`
              : watching
                ? `Snap saves the server's latest ${channelLabel.toLowerCase()} still. Watch pauses new stills.`
                : `Snap saves the ${channelLabel.toLowerCase()} camera on the server. Tap a picture to choose it.`}
          </AppText>
        </View>
      </View>

      {speaking && talkSession ? <CabinTalkPublisher session={talkSession} /> : null}

      {speakBlocked && !note ? (
        <AppText variant="caption" style={[styles.hint, { color: colors.amber }]} numberOfLines={2}>
          {speakBlocked}
        </AppText>
      ) : null}

      {note ? (
        <AppText variant="caption" style={styles.hint} numberOfLines={2}>
          {note}
        </AppText>
      ) : null}

      {flight ? (
        <SnapShotFly
          key={flight.token}
          uri={flight.uri}
          from={flight.from}
          to={flight.to}
          onDone={() => {
            const next = revealUri.current;
            revealUri.current = null;
            setFlight(null);
            releaseBox();
            if (next) setPinned(next);
            pulseBox();
          }}
        />
      ) : null}
    </View>
  );
}

function Control({
  label,
  icon,
  onPress,
  busy,
  active,
  danger,
  styles,
  colors,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  busy: boolean;
  active: boolean;
  danger?: boolean;
  styles: {
    control: object;
    circle: object;
    circleOn: object;
    circleDanger: object;
  };
  colors: { ink: string };
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [styles.control, pressed && !busy && { opacity: 0.72 }, busy && { opacity: 0.55 }]}
    >
      <View style={[styles.circle, active && !danger && styles.circleOn, active && danger && styles.circleDanger]}>
        {busy ? <ActivityIndicator color={colors.ink} /> : icon}
      </View>
      <AppText variant="caption" numberOfLines={1} style={{ fontSize: 12 }}>
        {label}
      </AppText>
    </Pressable>
  );
}
