import { useState } from "react";
import { Pressable, StyleSheet, Switch, TextInput, View } from "react-native";
import { Settings } from "@/components/ui/icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { Page } from "@/components/layout/Page";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { ScreenState } from "@/components/ui/ScreenState";
import { theme } from "@/constants/theme";
import { timeAgo } from "@/constants/format";
import { useRideStore } from "@/stores/useRideStore";

export function GuardiansScreen() {
  const guardians = useRideStore((state) => state.guardians);
  const notices = useRideStore((state) => state.notices);
  const toggleSharing = useRideStore((state) => state.toggleSharing);
  const addGuardian = useRideStore((state) => state.addGuardian);
  const removeGuardian = useRideStore((state) => state.removeGuardian);
  const shareTrip = useRideStore((state) => state.shareTrip);
  const shareLink = useRideStore((state) => state.shareLink);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [invite, setInvite] = useState(false);

  const sharing = guardians.filter((guardian) => guardian.sharing);

  return (
    <Page
      title="Family"
      action={
        <Pressable
          testID="open-settings"
          accessibilityLabel="Settings"
          accessibilityRole="button"
          onPress={() => {
            void Haptics.selectionAsync();
            router.push("/settings");
          }}
          style={styles.settings}
        >
          <Settings size={18} color={theme.ink} strokeWidth={1.75} />
        </Pressable>
      }
    >
      <View style={styles.summary}>
        <AppText variant="title">{sharing.length} sharing</AppText>
        <AppText variant="caption" numberOfLines={1}>
          {shareLink}
        </AppText>
        <Button testID="refresh-share" label="Refresh link" tone="ghost" onPress={() => void shareTrip()} />
      </View>

      {guardians.length === 0 ? (
        <ScreenState
          kind="empty"
          title="No guardians yet"
          body="Add someone who should hear about this ride. Notices stay on this phone."
        />
      ) : (
        guardians.map((guardian) => (
          <View key={guardian.id} style={styles.profile}>
            <View style={styles.avatar}>
              <AppText variant="strong">{initials(guardian.name)}</AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="strong">{guardian.name}</AppText>
              <AppText variant="caption">
                {guardian.relationship}
                {guardian.lastNotifiedAt ? ` · ${timeAgo(guardian.lastNotifiedAt)}` : ""}
              </AppText>
              <Pressable onPress={() => removeGuardian(guardian.id)} accessibilityRole="button">
                <AppText variant="caption">Remove</AppText>
              </Pressable>
            </View>
            <Switch
              value={guardian.sharing}
              onValueChange={() => toggleSharing(guardian.id)}
              trackColor={{ true: theme.lime, false: theme.bgSoft }}
              thumbColor={guardian.sharing ? theme.limeInk : theme.ink}
            />
          </View>
        ))
      )}

      <Button label={invite ? "Close" : "Add guardian"} tone="ghost" onPress={() => setInvite((open) => !open)} />

      {invite ? (
        <View style={styles.form}>
          <Field value={name} placeholder="Name" onChangeText={setName} testID="guardian-name" />
          <Field value={relationship} placeholder="Relationship" onChangeText={setRelationship} />
          <Field value={phone} placeholder="Phone" onChangeText={setPhone} />
          {formError ? (
            <AppText variant="caption" style={styles.error}>
              {formError}
            </AppText>
          ) : null}
          <Button
            testID="add-guardian"
            label="Save"
            onPress={() => {
              if (!name.trim() || !relationship.trim() || !phone.trim()) {
                setFormError("Name, relationship, and phone are required.");
                return;
              }
              addGuardian({ name, relationship, phone });
              setName("");
              setRelationship("");
              setPhone("");
              setFormError("");
              setInvite(false);
            }}
          />
        </View>
      ) : null}

      {notices.length === 0 ? null : (
        <View style={styles.notices}>
          {notices.map((notice) => (
            <View key={notice.id} style={styles.notice}>
              <AppText variant="strong">{notice.title}</AppText>
              <AppText variant="caption">
                {timeAgo(notice.at)} · {notice.guardianNames.join(", ") || "No recipients"}
              </AppText>
            </View>
          ))}
        </View>
      )}
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
  return (
    <TextInput
      testID={testID}
      value={value}
      placeholder={placeholder}
      placeholderTextColor={theme.inkFaint}
      onChangeText={onChangeText}
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  summary: {
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.line,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.bgRaised,
    borderWidth: 1,
    borderColor: theme.line,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  settings: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    marginTop: 12,
    gap: 8,
  },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    paddingHorizontal: 14,
    color: theme.ink,
    fontFamily: "Manrope_400Regular",
    backgroundColor: theme.bgRaised,
  },
  error: {
    color: theme.dangerSoft,
  },
  notices: {
    marginTop: 18,
  },
  notice: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    gap: 4,
  },
});
