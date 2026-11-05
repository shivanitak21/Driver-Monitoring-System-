import { useMemo, useState } from "react";
import { StyleSheet, Switch, TextInput, View } from "react-native";
import { Settings } from "@/components/ui/icons";
import { router } from "expo-router";

import { Page } from "@/components/layout/Page";
import { ApiStatusBanner } from "@/components/system/ApiStatusBanner";
import { AppText } from "@/components/ui/AppText";
import { Button, IconButton } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { ScreenState } from "@/components/ui/ScreenState";
import { typeface } from "@/constants/theme";
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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        summary: { gap: 12, marginBottom: 14, padding: 16 },
        profile: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          padding: 14,
        },
        avatar: {
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bgSoft,
        },
        flex: { flex: 1, gap: 3 },
        invite: { marginTop: 12 },
        form: { marginTop: 12, gap: 10, padding: 14 },
        notices: { marginTop: 22, gap: 10 },
        notice: { padding: 14, gap: 4 },
        cardGap: { marginBottom: 10 },
      }),
    [colors],
  );

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
        <IconButton
          testID="open-settings"
          label="Settings"
          onPress={() => router.push("/settings")}
          glass={false}
        >
          <Settings size={18} color={colors.ink} strokeWidth={1.75} />
        </IconButton>
      }
    >
      <View style={{ marginBottom: 10 }}>
        <ApiStatusBanner onRetry={() => void refreshAll()} />
      </View>

      <Glass variant="card" radius={22} style={styles.cardGap}>
        <View style={styles.summary}>
          <AppText variant="label">Share link</AppText>
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
      </Glass>

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
          <Glass key={guardian.id} variant="card" radius={22} style={styles.cardGap}>
            <View style={styles.profile}>
              <View style={styles.avatar}>
                <AppText variant="strong" style={{ color: colors.ink }}>
                  {initials(guardian.name)}
                </AppText>
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
                  <AppText
                    variant="caption"
                    style={{ color: colors.danger, marginTop: 2 }}
                    onPress={() => removeGuardian(guardian.id)}
                  >
                    Remove
                  </AppText>
                ) : null}
              </View>
              <Switch
                value={guardian.sharing}
                onValueChange={() => {
                  void toggleSharing(guardian.id).catch((error: Error) => setFormError(error.message));
                }}
                trackColor={{ true: colors.primary, false: colors.bgSoft }}
                thumbColor={guardian.sharing ? colors.onPrimary : colors.bgRaised}
              />
            </View>
          </Glass>
        ))
      )}

      <View style={styles.invite}>
        <Button label={invite ? "Close" : "Add guardian"} tone="ghost" onPress={() => setInvite((open) => !open)} />
      </View>

      {invite ? (
        <Glass variant="card" radius={22}>
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
        </Glass>
      ) : null}

      <View style={styles.notices}>
        <AppText variant="strong" style={{ marginBottom: 4, marginLeft: 4 }}>
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
            <Glass key={notice.id} variant="card" radius={20}>
              <View style={styles.notice}>
                <AppText variant="strong">{notice.title}</AppText>
                <AppText variant="caption">{notice.body}</AppText>
                <AppText variant="caption" style={{ color: colors.inkFaint }}>
                  {timeAgo(notice.at)} · {notice.guardianNames.join(", ") || "No recipients"}
                </AppText>
              </View>
            </Glass>
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
        height: 50,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.line,
        paddingHorizontal: 14,
        color: colors.ink,
        ...typeface("body"),
        backgroundColor: colors.bgSoft,
        fontSize: 15,
      }}
    />
  );
}
