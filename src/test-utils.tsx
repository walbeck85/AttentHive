// src/test-utils.tsx
import React, { ReactElement } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { render, RenderOptions } from "@testing-library/react";

import {
  ThemeModeContext,
  useThemeModeController,
} from "@/components/ThemeModeProvider";

// If you later need NextAuth SessionProvider, theme providers, etc.,
// this wrapper is where we wire them up so tests stay consistent.
function AllTheProviders({ children }: { children: React.ReactNode }) {
  // Central place to wire up shared app providers for tests.
  // Right now we only need theme + mode wiring so components can
  // rely on the same MUI setup used in the app shell.
  const themeMode = useThemeModeController();

  return (
    <ThemeProvider theme={themeMode.theme}>
      <CssBaseline />
      <ThemeModeContext.Provider value={themeMode}>
        {children}
      </ThemeModeContext.Provider>
    </ThemeProvider>
  );
}

type CustomRenderOptions = Omit<RenderOptions, "wrapper">;

// Centralizing render lets future-me add or swap providers in one place
// instead of trekking through a pile of tests changing imports.
export function renderWithProviders(ui: ReactElement, options?: CustomRenderOptions) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from RTL so tests can import from one place.
// This keeps the test surface area small and predictable.
export * from "@testing-library/react";
