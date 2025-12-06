"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { CssBaseline, ThemeProvider } from "@mui/material";

import {
  ThemeModeContext,
  useThemeModeController,
} from "@/components/ThemeModeProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const themeMode = useThemeModeController();

  return (
    <SessionProvider>
      <ThemeProvider theme={themeMode.theme}>
        <CssBaseline />
        <ThemeModeContext.Provider value={themeMode}>
          {children}
        </ThemeModeContext.Provider>
      </ThemeProvider>
    </SessionProvider>
  );
}
