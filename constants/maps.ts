import Constants from "expo-constants";

type Extra = {
  googleMapsApiKey?: string;
};

export function googleMapsApiKey() {
  const extra = (Constants.expoConfig?.extra ?? {}) as Extra;
  return extra.googleMapsApiKey?.trim() ?? "";
}
