import { useMemo, type ReactNode } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ChevronLeft } from "@/components/ui/icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDockOffset } from "@/components/layout/DockTabBar";
import { AppText } from "@/components/ui/AppText";
import { Glass } from "@/components/ui/Glass";
import { ScreenGradient } from "@/components/ui/ScreenGradient";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useTheme } from "@/providers/ThemeProvider";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  back?: boolean;
  action?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function Page({
  title,
  subtitle,
  children,
  back = false,
  action,
  refreshing = false,
  onRefresh,
}: Props) {
  const insets = useSafeAreaInsets();
  const dock = useDockOffset();
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        fill: {
          flex: 1,
        },
        header: {
          paddingHorizontal: 20,
          paddingBottom: 14,
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
        },
        headerText: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          flex: 1,
        },
        flex: {
          flex: 1,
          gap: 3,
        },
        backHit: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
        },
      }),
    [],
  );

  return (
    <ScreenGradient style={[styles.fill, { paddingTop: insets.top + 6 }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          {back ? (
            <Glass variant="pill" radius={22}>
              <Pressable
                accessibilityLabel="Go back"
                onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
                style={styles.backHit}
              >
                <ChevronLeft size={18} color={colors.ink} strokeWidth={1.85} />
              </Pressable>
            </Glass>
          ) : null}
          <View style={styles.flex}>
            <AppText variant="title" numberOfLines={1}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="caption" numberOfLines={2}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
        </View>
        {action}
      </View>
      <Animated.View
        entering={reduceMotion ? undefined : FadeInDown.duration(360).springify().damping(18)}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            paddingBottom: back ? insets.bottom + 32 : dock + 18,
            paddingHorizontal: 20,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.inkMuted} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </Animated.View>
    </ScreenGradient>
  );
}
