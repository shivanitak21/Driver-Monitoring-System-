import Constants from "expo-constants";

type Extra = {
  mapboxAccessToken?: string;
};

/**
 * Mapbox public token (pk.*).
 * Prefer EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env so Expo Go picks it up after restart.
 */
export function mapboxAccessToken() {
  const extra = (Constants.expoConfig?.extra ?? {}) as Extra;
  const fromExtra = extra.mapboxAccessToken?.trim() ?? "";
  if (fromExtra) return fromExtra;
  const fromPublic = (process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || "").trim();
  if (fromPublic) return fromPublic;
  return (process.env.MAPBOX_ACCESS_TOKEN || "").trim();
}

/** @deprecated Use mapboxAccessToken(). */
export function googleMapsApiKey() {
  return mapboxAccessToken();
}
