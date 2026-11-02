import * as Haptics from "expo-haptics";

/**
 * expo-haptics can throw UnavailabilityError on Android / Expo Go
 * when the native module is not linked. Never let that reject UI presses.
 */
async function safe(run: () => Promise<unknown>) {
  try {
    await run();
  } catch {
    // Native haptics unavailable — ignore.
  }
}

export function selectionFeedback() {
  return safe(() => Haptics.selectionAsync());
}

export function impactFeedback(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) {
  return safe(() => Haptics.impactAsync(style));
}

export function notificationFeedback(
  type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success,
) {
  return safe(() => Haptics.notificationAsync(type));
}

export { Haptics };
