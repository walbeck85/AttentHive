// src/components/ThemeModeProvider.tsx
"use client";

import React from "react";
import { CssBaseline, ThemeProvider, useMediaQuery } from "@mui/material";
import type { PaletteMode } from "@mui/material";

import { createAppTheme, type ThemePreference } from "@/theme";

type ThemeModeContextValue = {
  /** User preference: light, dark, or system */
  mode: ThemePreference;
  /** Concrete palette mode MUI is currently using */
  resolvedMode: PaletteMode;
  /** Set new preference (persists to localStorage) */
  setMode: (next: ThemePreference) => void;
};

const ThemeModeContext = React.createContext<ThemeModeContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "mimamori-theme-mode";

export function ThemeModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Respect OS-level preference when in "system" mode.
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)", {
    noSsr: true,
  });

  const [mode, setModeState] = React.useState<ThemePreference>("system");

  // Compute actual palette mode based on preference + OS preference.
  const resolvedMode: PaletteMode =
    mode === "system" ? (prefersDark ? "dark" : "light") : mode;

  // On first client render, hydrate from localStorage.
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem(STORAGE_KEY) as
      | ThemePreference
      | null;

    if (stored === "light" || stored === "dark" || stored === "system") {
      setModeState(stored);
    }
  }, []);

  const handleSetMode = React.useCallback((next: ThemePreference) => {
    setModeState(next);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const theme = React.useMemo(
    () => createAppTheme(resolvedMode),
    [resolvedMode]
  );

  const contextValue = React.useMemo<ThemeModeContextValue>(
    () => ({
      mode,
      resolvedMode,
      setMode: handleSetMode,
    }),
    [mode, resolvedMode, handleSetMode]
  );

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
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