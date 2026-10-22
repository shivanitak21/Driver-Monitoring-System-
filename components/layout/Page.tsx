import { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ChevronLeft } from "@/components/ui/icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDockOffset } from "@/components/layout/DockTabBar";
import { AppText } from "@/components/ui/AppText";
import { theme } from "@/constants/theme";

type Props = {
  kicker?: string;
  title: string;
  children: ReactNode;
  back?: boolean;
  action?: ReactNode;
};

export function Page({ kicker, title, children, back = false, action }: Props) {
  const insets = useSafeAreaInsets();
  const dock = useDockOffset();
  const bottomInset = Math.min(insets.bottom, 24);
  return (
    <View style={[styles.fill, { paddingTop: Math.min(insets.top, 48) + 8 }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          {back ? (
            <Pressable
              accessibilityLabel="Go back"
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
              style={styles.back}
            >
              <ChevronLeft size={18} color={theme.ink} strokeWidth={1.75} />
            </Pressable>
          ) : null}
          <View style={styles.flex}>
            {kicker ? <AppText variant="label">{kicker}</AppText> : null}
            <AppText variant="title">{title}</AppText>
          </View>
        </View>
        {action}
      </View>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: back ? bottomInset + 28 : dock + 24, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.bgRaised,
  },
});
