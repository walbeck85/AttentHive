// src/components/ThemeModeProvider.tsx
"use client";

import React from "react";
import { useMediaQuery } from "@mui/material";
import type { PaletteMode } from "@mui/material";
import type { Theme } from "@mui/material/styles";

import { createAppTheme, type ThemePreference } from "@/theme";

type ThemeMode = ThemePreference;

const THEME_STORAGE_KEY = "attenthive-theme-mode";
const LEGACY_THEME_STORAGE_KEY = "mimamori-theme-mode";

function readStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  const current = window.localStorage.getItem(THEME_STORAGE_KEY);
  const legacy = window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);

  if (current) {
    return current as ThemeMode;
  }

  if (!current && legacy) {
    window.localStorage.setItem(THEME_STORAGE_KEY, legacy);
    window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
    return legacy as ThemeMode;
  }

  return null;
}

type ThemeModeContextValue = {
  /** User preference: light, dark, or system */
  mode: ThemePreference;
  /** Concrete palette mode MUI is currently using */
  resolvedMode: PaletteMode;
  /** Set new preference (persists to localStorage) */
  setMode: (next: ThemePreference) => void;
  /** Active MUI theme (light/dark aware) */
  theme: Theme;
};

export const ThemeModeContext = React.createContext<
  ThemeModeContextValue | undefined
>(undefined);

export function useThemeModeController(): ThemeModeContextValue {
  // Respect OS-level preference when in "system" mode.
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)", {
    noSsr: true,
  });

  const [mode, setModeState] = React.useState<ThemePreference>("system");
  const [hasHydrated, setHasHydrated] = React.useState(false);

  // Compute actual palette mode based on preference + OS preference.
  const resolvedMode: PaletteMode = React.useMemo(() => {
    // During SSR and the very first client render, force light mode so the
    // server HTML matches the initial client markup. This avoids hydration
    // mismatches when the user prefers dark mode.
    if (!hasHydrated) return "light";

    return mode === "system" ? (prefersDark ? "dark" : "light") : mode;
  }, [hasHydrated, mode, prefersDark]);

  // On first client render, hydrate from localStorage.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setHasHydrated(true);

    const stored = readStoredTheme();

    if (stored === "light" || stored === "dark" || stored === "system") {
      setModeState(stored);
    }
  }, []);

  const handleSetMode = React.useCallback((next: ThemePreference) => {
    setModeState(next);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    }
  }, []);

  const theme = React.useMemo(() => createAppTheme(resolvedMode), [resolvedMode]);

  return React.useMemo<ThemeModeContextValue>(
    () => ({ mode, resolvedMode, setMode: handleSetMode, theme }),
    [mode, resolvedMode, handleSetMode, theme]
  );
}

export function ThemeModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const contextValue = useThemeModeController();

  return (
    <ThemeModeContext.Provider value={contextValue}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode(): ThemeModeContextValue {
  const ctx = React.useContext(ThemeModeContext);
  if (!ctx) {
    throw new Error("useThemeMode must be used within ThemeModeProvider");
  }
  return ctx;
}
