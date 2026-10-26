import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { darkPalette, lightPalette, type Palette } from "@/constants/theme";

export type Appearance = "system" | "light" | "dark";

const STORAGE_KEY = "vms-appearance";

type ThemeValue = {
  appearance: Appearance;
  scheme: "light" | "dark";
  colors: Palette;
  setAppearance: (appearance: Appearance) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

function isAppearance(value: string | null): value is Appearance {
  return value === "system" || value === "light" || value === "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [appearance, setAppearanceState] = useState<Appearance>("dark");

  useEffect(() => {
    let alive = true;
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (!alive || !isAppearance(stored)) return;
      setAppearanceState(stored);
    });
    return () => {
      alive = false;
    };
  }, []);

  const setAppearance = (next: Appearance) => {
    setAppearanceState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const scheme: "light" | "dark" =
    appearance === "system" ? (system === "light" ? "light" : "dark") : appearance;

  const value = useMemo<ThemeValue>(
    () => ({
      appearance,
      scheme,
      colors: scheme === "light" ? lightPalette : darkPalette,
      setAppearance,
    }),
    [appearance, scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ThemeProvider");
  return value;
}
