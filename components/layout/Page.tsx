import { useMemo, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ChevronLeft } from "@/components/ui/icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDockOffset } from "@/components/layout/DockTabBar";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/providers/ThemeProvider";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  back?: boolean;
  action?: ReactNode;
};

export function Page({ title, subtitle, children, back = false, action }: Props) {
  const insets = useSafeAreaInsets();
  const dock = useDockOffset();
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        fill: {
          flex: 1,
          backgroundColor: colors.bg,
        },
        header: {
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
        },
        headerText: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          flex: 1,
        },
        flex: {
          flex: 1,
          gap: 2,
        },
        back: {
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bgRaised,
          borderWidth: 1,
          borderColor: colors.line,
        },
      }),
    [colors],
  );

  return (
    <View style={[styles.fill, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          {back ? (
            <Pressable
              accessibilityLabel="Go back"
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
              style={styles.back}
            >
              <ChevronLeft size={18} color={colors.ink} strokeWidth={1.75} />
            </Pressable>
          ) : null}
          <View style={styles.flex}>
            <AppText variant="title">{title}</AppText>
            {subtitle ? <AppText variant="caption">{subtitle}</AppText> : null}
          </View>
        </View>
        {action}
      </View>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: back ? insets.bottom + 28 : dock + 16, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}
