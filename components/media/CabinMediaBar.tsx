import { useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";

import { CabinWatchPlayer } from "@/components/media/CabinWatchPlayer";
import { AppText } from "@/components/ui/AppText";
import { Camera, Ear, Mic, Video } from "@/components/ui/icons";
import { bustMediaUrl } from "@/services/api/media";
import { saveRemoteImageToGallery } from "@/services/media/gallery";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";
import type { MediaChannel } from "@/types/domain";

type Props = {
  channel: MediaChannel;
};

export function CabinMediaBar({ channel }: Props) {
  const { colors } = useTheme();
  const videoSession = useRideStore((state) => state.videoSession);
  const startWatch = useRideStore((state) => state.startWatch);
  const stopWatch = useRideStore((state) => state.stopWatch);
  const refreshFrames = useRideStore((state) => state.refreshFrames);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [listening, setListening] = useState(false);

  const watching = Boolean(videoSession);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { gap: 10 },
        row: { flexDirection: "row", gap: 8 },
        item: {
          flex: 1,
          minHeight: 64,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.bgRaised,
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          paddingHorizontal: 4,
        },
        itemOn: {
          borderColor: colors.signal,
          backgroundColor: colors.limeSoft,
        },
      }),
    [colors],
  );

  const run = async (key: string, work: () => Promise<void>) => {
    setBusy(key);
    setNote(null);
    try {
      await work();
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const onWatch = () =>
    run("watch", async () => {
      if (watching) {
        await stopWatch();
        setListening(false);
        setNote("Watch stopped.");
        return;
      }
      await startWatch();
      setNote("Watching cabin LiveKit (video + mic tracks named cabin).");
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

  const onSnap = () =>
    run("snap", async () => {
      await refreshFrames();
      const frame =
        channel === "cms" ? useRideStore.getState().frameCms : useRideStore.getState().frameDms;
      if (!frame?.imageUrl) throw new Error("No live still yet.");
      await saveRemoteImageToGallery(bustMediaUrl(frame.imageUrl, frame.at), `vms-${channel}-${Date.now()}.jpg`);
      setNote(`Snapshot saved (${channel === "cms" ? "cabin" : "driver"}).`);
    });

  const onSpeak = () =>
    run("speak", async () => {
      setNote("Speak blocked: Watch token is viewer-only. Backend must add a talk/publish-audio token.");
    });

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <MediaButton
          label={watching ? "Stop" : "Watch"}
          busy={busy === "watch"}
          active={watching}
          styles={styles}
          colors={colors}
          onPress={onWatch}
          icon={<Video size={18} color={colors.ink} strokeWidth={1.75} />}
        />
        <MediaButton
          label={listening ? "Mute" : "Listen"}
          busy={busy === "listen"}
          active={listening}
          styles={styles}
          colors={colors}
          onPress={onListen}
          icon={<Ear size={18} color={colors.ink} strokeWidth={1.75} />}
        />
        <MediaButton
          label="Snap"
          busy={busy === "snap"}
          active={false}
          styles={styles}
          colors={colors}
          onPress={onSnap}
          icon={<Camera size={18} color={colors.ink} strokeWidth={1.75} />}
        />
        <MediaButton
          label="Speak"
          busy={busy === "speak"}
          active={false}
          styles={styles}
          colors={colors}
          onPress={onSpeak}
          icon={<Mic size={18} color={colors.ink} strokeWidth={1.75} />}
        />
      </View>

      {watching && videoSession ? <CabinWatchPlayer session={videoSession} listen={listening} /> : null}

      {note ? <AppText variant="caption">{note}</AppText> : null}
    </View>
  );
}

function MediaButton({
  label,
  icon,
  onPress,
  busy,
  active,
  styles,
  colors,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  busy: boolean;
  active: boolean;
  styles: {
    item: object;
    itemOn: object;
  };
  colors: { ink: string };
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={busy}
      style={[styles.item, active && styles.itemOn, busy && { opacity: 0.55 }]}
    >
      {busy ? <ActivityIndicator color={colors.ink} /> : icon}
      <AppText variant="caption">{label}</AppText>
    </Pressable>
  );
}
