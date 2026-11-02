import { useMemo, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { CabinTalkPublisher } from "@/components/media/CabinTalkPublisher";
import {
  CabinWatchPlayer,
  type CabinWatchPlayerHandle,
} from "@/components/media/CabinWatchPlayer";
import { AppText } from "@/components/ui/AppText";
import { Camera, CircleDot, Ear, Mic, Video } from "@/components/ui/icons";
import { ApiError } from "@/services/api/http";
import { bustMediaUrl } from "@/services/api/media";
import { saveRemoteImageToGallery } from "@/services/media/gallery";
import { ensureMicrophonePermission } from "@/services/media/micPermission";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";
import type { MediaChannel } from "@/types/domain";
import { selectionFeedback } from "@/utils/haptics";

type Props = {
  channel: MediaChannel;
};

export function CabinMediaBar({ channel }: Props) {
  const { colors } = useTheme();
  const videoSession = useRideStore((state) => state.videoSession);
  const talkSession = useRideStore((state) => state.talkSession);
  const frameCms = useRideStore((state) => state.frameCms);
  const frameDms = useRideStore((state) => state.frameDms);
  const publisherOnline = useRideStore((state) => state.publisherOnline);
  const deviceState = useRideStore((state) => state.deviceState);
  const startWatch = useRideStore((state) => state.startWatch);
  const stopWatch = useRideStore((state) => state.stopWatch);
  const startTalk = useRideStore((state) => state.startTalk);
  const stopTalk = useRideStore((state) => state.stopTalk);
  const refreshFrames = useRideStore((state) => state.refreshFrames);

  const playerRef = useRef<CabinWatchPlayerHandle>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [localRecording, setLocalRecording] = useState(false);
  const [speakBlocked, setSpeakBlocked] = useState<string | null>(null);

  const watching = Boolean(videoSession);
  const speaking = Boolean(talkSession);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { gap: 14 },
        stage: { gap: 8 },
        grid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
        },
        item: {
          width: "47.5%",
          minHeight: 76,
          borderRadius: 18,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.line,
          backgroundColor: colors.bgRaised,
          paddingHorizontal: 14,
          paddingVertical: 12,
          justifyContent: "space-between",
        },
        itemOn: {
          borderColor: colors.signal,
          backgroundColor: colors.limeSoft,
        },
        itemSpeak: {
          borderColor: colors.danger,
          backgroundColor: colors.dangerSoft + "18",
        },
        itemTop: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        hint: {
          marginTop: -2,
        },
      }),
    [colors],
  );

  const run = async (key: string, work: () => Promise<void>) => {
    setBusy(key);
    setNote(null);
    try {
      await work();
      void selectionFeedback();
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const onWatch = () =>
    run("watch", async () => {
      if (watching) {
        if (localRecording) {
          try {
            await playerRef.current?.stopLocalRecord();
          } catch {
            // still stop watch
          }
          setLocalRecording(false);
        }
        await stopWatch();
        setListening(false);
        setNote("Watch stopped. Stills keep updating.");
        return;
      }
      await startWatch();
      const online = useRideStore.getState().publisherOnline;
      const device = useRideStore.getState().deviceState;
      setNote(
        online
          ? "Cabin LiveKit · tracks named cabin (video + mic)."
          : `Watch started · vehicle ${device || "offline"} — waiting for cabin publisher.`,
      );
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
      setNote("Listening to cabin microphone.");
    });

  const onRecord = () =>
    run("record", async () => {
      if (localRecording) {
        const uri = await playerRef.current?.stopLocalRecord();
        setLocalRecording(false);
        setNote(uri ? "Recording saved to Photos on this phone." : "Recording stopped.");
        return;
      }
      if (!watching) await startWatch();
      // Give LiveKit a moment to attach tracks after first Watch.
      await new Promise((resolve) => setTimeout(resolve, watching ? 200 : 1200));
      if (!playerRef.current) {
        throw new Error("Open Watch first, wait for LIVE, then Record.");
      }
      setLocalRecording(true);
      playerRef.current.startLocalRecord();
      setNote("Recording cabin on this phone (not uploaded). Tap Stop rec when done.");
    });

  const onSnap = () =>
    run("snap", async () => {
      await refreshFrames();
      const frame =
        channel === "cms" ? useRideStore.getState().frameCms : useRideStore.getState().frameDms;
      if (!frame?.imageUrl) throw new Error("No live still yet — wait for frames, then Snap.");
      await saveRemoteImageToGallery(
        bustMediaUrl(frame.imageUrl, Date.now()),
        `vms-${channel}-${Date.now()}.jpg`,
      );
      setNote(
        `Snap saved to Photos (${channel === "cms" ? "cabin" : "driver"}). Not uploaded to the server.`,
      );
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
        setNote("Speak ready — tap the red bar once to start the cabin mic.");
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          const msg = "Speak endpoint missing (404).";
          setSpeakBlocked(msg);
          throw new Error(msg);
        }
        if (error instanceof ApiError && error.status === 409) {
          const msg = "Speak needs LiveKit mode on the server (409).";
          setSpeakBlocked(msg);
          throw new Error(msg);
        }
        if (error instanceof ApiError && error.status === 403) {
          throw new Error("Sharing is off — Speak is blocked.");
        }
        throw error;
      }
    });

  return (
    <View style={styles.wrap}>
      {watching && videoSession ? (
        <View style={styles.stage}>
          <CabinWatchPlayer
            ref={playerRef}
            session={videoSession}
            listen={listening}
            fallbackFrame={frameCms ?? frameDms}
            onLocalRecordingChange={setLocalRecording}
          />
          {!publisherOnline || deviceState === "offline" ? (
            <AppText variant="caption" style={{ color: colors.amber }}>
              Device {deviceState || "unknown"} · publisher {publisherOnline ? "on" : "off"}. Local Record
              needs LIVE cabin video.
            </AppText>
          ) : null}
        </View>
      ) : (
        <View
          style={{
            height: 180,
            borderRadius: 24,
            backgroundColor: colors.bgSoft,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.line,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            gap: 6,
          }}
        >
          <AppText variant="strong">Cabin stream</AppText>
          <AppText variant="caption" style={{ textAlign: "center" }}>
            Tap Watch for live video. Snap saves stills to Photos. Record saves cabin video on this phone.
          </AppText>
        </View>
      )}

      <View style={styles.grid}>
        <MediaTile
          title={watching ? "Stop" : "Watch"}
          subtitle="Live cabin"
          busy={busy === "watch"}
          active={watching}
          styles={styles}
          colors={colors}
          onPress={onWatch}
          icon={<Video size={20} color={watching ? colors.signal : colors.ink} strokeWidth={1.75} />}
        />
        <MediaTile
          title={listening ? "Mute" : "Listen"}
          subtitle="Cabin mic"
          busy={busy === "listen"}
          active={listening}
          styles={styles}
          colors={colors}
          onPress={onListen}
          icon={<Ear size={20} color={listening ? colors.signal : colors.ink} strokeWidth={1.75} />}
        />
        <MediaTile
          title={localRecording ? "Stop rec" : "Record"}
          subtitle={localRecording ? "Saving to Photos…" : "On this phone"}
          busy={busy === "record"}
          active={localRecording}
          styles={styles}
          colors={colors}
          onPress={onRecord}
          icon={<CircleDot size={20} color={localRecording ? colors.danger : colors.ink} strokeWidth={1.75} />}
        />
        <MediaTile
          title="Snap"
          subtitle="To Photos"
          busy={busy === "snap"}
          active={false}
          styles={styles}
          colors={colors}
          onPress={onSnap}
          icon={<Camera size={20} color={colors.ink} strokeWidth={1.75} />}
        />
        <MediaTile
          title={speaking ? "End speak" : "Speak"}
          subtitle={speakBlocked ? "Needs API deploy" : "Phone mic → cabin speaker"}
          busy={busy === "speak"}
          active={speaking}
          speak
          wide
          styles={styles}
          colors={colors}
          onPress={onSpeak}
          icon={<Mic size={20} color={speaking ? colors.danger : colors.ink} strokeWidth={1.75} />}
        />
      </View>

      {speaking && talkSession ? <CabinTalkPublisher session={talkSession} /> : null}

      {speakBlocked && !note ? (
        <AppText variant="caption" style={[styles.hint, { color: colors.amber }]}>
          {speakBlocked}
        </AppText>
      ) : null}

      {note ? (
        <AppText variant="caption" style={styles.hint}>
          {note}
        </AppText>
      ) : null}
    </View>
  );
}

function MediaTile({
  title,
  subtitle,
  icon,
  onPress,
  busy,
  active,
  speak,
  wide,
  styles,
  colors,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  onPress: () => void;
  busy: boolean;
  active: boolean;
  speak?: boolean;
  wide?: boolean;
  styles: {
    item: object;
    itemOn: object;
    itemSpeak: object;
    itemTop: object;
  };
  colors: { ink: string };
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      disabled={busy}
      style={[
        styles.item,
        wide && { width: "100%" },
        active && !speak && styles.itemOn,
        active && speak && styles.itemSpeak,
        busy && { opacity: 0.55 },
      ]}
    >
      <View style={styles.itemTop}>
        {busy ? <ActivityIndicator color={colors.ink} /> : icon}
      </View>
      <View>
        <AppText variant="strong">{title}</AppText>
        <AppText variant="caption">{subtitle}</AppText>
      </View>
    </Pressable>
  );
}
