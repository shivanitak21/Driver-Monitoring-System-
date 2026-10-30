import { useMemo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { IconButton } from "@/components/ui/Button";
import { AppText } from "@/components/ui/AppText";
import { Camera, Ear, Mic, Video } from "@/components/ui/icons";
import { useTheme } from "@/providers/ThemeProvider";

type Props = {
  watching: boolean;
  listening: boolean;
  speaking: boolean;
  busy?: boolean;
  onWatch: () => void;
  onListen: () => void;
  onSnapshot: () => void;
  onSpeak: () => void;
  note?: string | null;
};

export function MediaActionBar({
  watching,
  listening,
  speaking,
  busy = false,
  onWatch,
  onListen,
  onSnapshot,
  onSpeak,
  note,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 4,
        },
        item: { flex: 1, alignItems: "center", gap: 6 },
        note: { marginTop: 8 },
      }),
    [],
  );

  return (
    <View>
      <View style={styles.row}>
        <Action
          label={watching ? "Stop" : "Watch"}
          active={watching}
          onPress={onWatch}
          disabled={busy}
          icon={<Video size={18} color={watching ? colors.signal : colors.ink} strokeWidth={1.75} />}
        />
        <Action
          label={listening ? "Mute" : "Listen"}
          active={listening}
          onPress={onListen}
          disabled={busy}
          icon={<Ear size={18} color={listening ? colors.signal : colors.ink} strokeWidth={1.75} />}
        />
        <Action
          label="Snap"
          active={false}
          onPress={onSnapshot}
          disabled={busy}
          icon={<Camera size={18} color={colors.ink} strokeWidth={1.75} />}
        />
        <Action
          label={speaking ? "Speaking" : "Speak"}
          active={speaking}
          onPress={onSpeak}
          disabled={busy}
          icon={<Mic size={18} color={speaking ? colors.signal : colors.ink} strokeWidth={1.75} />}
        />
      </View>
      {note ? (
        <AppText variant="caption" style={styles.note}>
          {note}
        </AppText>
      ) : null}
    </View>
  );
}

function Action({
  label,
  icon,
  onPress,
  active,
  disabled,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  active: boolean;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 6, opacity: disabled ? 0.45 : 1 }}>
      <IconButton label={label} onPress={onPress}>
        {icon}
      </IconButton>
      <AppText variant="caption" style={{ color: active ? colors.signal : colors.inkMuted }}>
        {label}
      </AppText>
    </View>
  );
}
