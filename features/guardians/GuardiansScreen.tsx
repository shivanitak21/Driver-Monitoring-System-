import { useState } from "react";
import { Pressable, StyleSheet, Switch, TextInput, View } from "react-native";
import { Settings } from "@/components/ui/icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { Page } from "@/components/layout/Page";
import { ApiStatusBanner } from "@/components/system/ApiStatusBanner";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { ScreenState } from "@/components/ui/ScreenState";
import { font } from "@/constants/theme";
import { timeAgo } from "@/constants/format";
import { useLiveApiRefresh } from "@/hooks/useLiveApiRefresh";
import { useTheme } from "@/providers/ThemeProvider";
import { useRideStore } from "@/stores/useRideStore";

export function GuardiansScreen() {
  useLiveApiRefresh("guardians");
  const guardians = useRideStore((state) => state.guardians);
  const notices = useRideStore((state) => state.notices);
  const toggleSharing = useRideStore((state) => state.toggleSharing);
  const addGuardian = useRideStore((state) => state.addGuardian);
  const removeGuardian = useRideStore((state) => state.removeGuardian);
  const shareTrip = useRideStore((state) => state.shareTrip);
  const shareLink = useRideStore((state) => state.shareLink);
  const liveMode = useRideStore((state) => state.liveMode);
  const refreshing = useRideStore((state) => state.refreshing);
  const refreshAll = useRideStore((state) => state.refreshAll);
  const refreshGuardians = useRideStore((state) => state.refreshGuardians);
  const refreshNotices = useRideStore((state) => state.refreshNotices);
  const connectionError = useRideStore((state) => state.connectionError);
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [invite, setInvite] = useState(false);
  const [busy, setBusy] = useState(false);
  const sharing = guardians.filter((guardian) => guardian.sharing);

  const onRefresh = () => {
    if (!liveMode) return;
    void Promise.all([refreshGuardians(), refreshNotices()]);
  };

  return (
    <Page
      title="Family"
      subtitle={`${sharing.length} sharing this ride`}
      refreshing={refreshing}
      onRefresh={liveMode ? onRefresh : undefined}
      action={
        <Pressable
          testID="open-settings"
          accessibilityLabel="Settings"
          accessibilityRole="button"
          onPress={() => {
            void Haptics.selectionAsync();
            router.push("/settings");
          }}
          style={[styles.settings, { backgroundColor: colors.bgRaised, borderColor: colors.line }]}
        >
          <Settings size={18} color={colors.ink} strokeWidth={1.75} />
        </Pressable>
      }
    >
      <View style={{ marginBottom: 10 }}>
        <ApiStatusBanner onRetry={() => void refreshAll()} />
      </View>

      <View style={styles.summary}>
        <AppText variant="caption" numberOfLines={2}>
          {shareLink || "No share link yet"}
        </AppText>
        <Button
          testID="refresh-share"
          label="Refresh link"
          tone="ghost"
          onPress={() => {
            setBusy(true);
            void shareTrip()
              .catch((error: Error) => setFormError(error.message))
              .finally(() => setBusy(false));
          }}
        />
      </View>

      {connectionError ? (
        <AppText variant="caption" style={{ color: colors.dangerSoft, marginBottom: 8 }}>
          {connectionError}
        </AppText>
      ) : null}

      {guardians.length === 0 ? (
        <ScreenState
          kind="empty"
          title="No guardians yet"
          body={
            liveMode
              ? "Add someone who should hear about this ride. Notices come from the guardian API."
              : "Add someone who should hear about this ride. Notices stay on this phone."
          }
        />
      ) : (
        guardians.map((guardian) => (
          <View key={guardian.id} style={[styles.profile, { borderTopColor: colors.line }]}>
            <View style={[styles.avatar, { backgroundColor: colors.bgRaised, borderColor: colors.line }]}>
              <AppText variant="strong">{initials(guardian.name)}</AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="strong">{guardian.name}</AppText>
              <AppText variant="caption">
                {guardian.relationship || "Guardian"}
                {guardian.phone ? ` · ${guardian.phone}` : ""}
              </AppText>
              <AppText variant="caption" style={{ color: colors.inkFaint }}>
                {guardian.lastNotifiedAt
                  ? `Last notified ${timeAgo(guardian.lastNotifiedAt)}`
                  : "Not notified yet"}
                {guardian.sharing ? " · Sharing on" : " · Sharing off"}
              </AppText>
              {!liveMode ? (
                <Pressable onPress={() => removeGuardian(guardian.id)} accessibilityRole="button" hitSlop={8}>
                  <AppText variant="caption" style={{ color: colors.danger }}>
                    Remove
                  </AppText>
                </Pressable>
              ) : null}
            </View>
            <Switch
              value={guardian.sharing}
              onValueChange={() => {
                void toggleSharing(guardian.id).catch((error: Error) => setFormError(error.message));
              }}
              trackColor={{ true: colors.lime, false: colors.bgSoft }}
              thumbColor={guardian.sharing ? colors.limeInk : colors.bgRaised}
            />
          </View>
        ))
      )}

      <View style={styles.invite}>
        <Button label={invite ? "Close" : "Add guardian"} tone="ghost" onPress={() => setInvite((open) => !open)} />
      </View>

      {invite ? (
        <View style={styles.form}>
          <Field value={name} placeholder="Name" onChangeText={setName} testID="guardian-name" />
          <Field value={relationship} placeholder="Relationship" onChangeText={setRelationship} />
          <Field value={phone} placeholder="Phone" onChangeText={setPhone} />
          {formError ? (
            <AppText variant="caption" style={{ color: colors.dangerSoft }}>
              {formError}
            </AppText>
          ) : null}
          <Button
            testID="add-guardian"
            label={busy ? "Saving…" : "Save"}
            onPress={() => {
              if (!name.trim()) {
                setFormError("Name is required.");
                return;
              }
              if (!liveMode && (!relationship.trim() || !phone.trim())) {
                setFormError("Name, relationship, and phone are required.");
                return;
              }
              setBusy(true);
              setFormError("");
              void addGuardian({ name, relationship, phone })
                .then(() => {
                  setName("");
                  setRelationship("");
                  setPhone("");
                  setInvite(false);
                })
                .catch((error: Error) => setFormError(error.message))
                .finally(() => setBusy(false));
            }}
          />
        </View>
      ) : null}

      <View style={styles.notices}>
        <AppText variant="strong" style={{ marginBottom: 8 }}>
          Notices
        </AppText>
        {notices.length === 0 ? (
          <ScreenState
            kind="empty"
            title="No notices yet"
            body={
              liveMode
                ? "SOS and share actions will write notices from the guardian API."
                : "Notices stay on this phone."
            }
          />
        ) : (
          notices.map((notice) => (
            <View key={notice.id} style={[styles.notice, { borderTopColor: colors.line }]}>
              <AppText variant="strong">{notice.title}</AppText>
              <AppText variant="caption">{notice.body}</AppText>
              <AppText variant="caption">
                {timeAgo(notice.at)} · {notice.guardianNames.join(", ") || "No recipients"}
              </AppText>
            </View>
          ))
        )}
      </View>
    </Page>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Field({
  value,
  placeholder,
  onChangeText,
  testID,
}: {
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <TextInput
      testID={testID}
      value={value}
      placeholder={placeholder}
      placeholderTextColor={colors.inkFaint}
      onChangeText={onChangeText}
      style={{
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.line,
        paddingHorizontal: 14,
        color: colors.ink,
        fontFamily: font.body,
        backgroundColor: colors.bgRaised,
      }}
    />
  );
}

const styles = StyleSheet.create({
  summary: { gap: 10, marginBottom: 8 },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  flex: { flex: 1, gap: 2 },
  settings: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  invite: { marginTop: 8 },
  form: { marginTop: 12, gap: 8 },
  notices: { marginTop: 22 },
  notice: { paddingVertical: 12, borderTopWidth: 1, gap: 4 },
});
