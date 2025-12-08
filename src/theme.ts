// src/theme.ts
// Material UI theme for the Mimamori app, wired to the Option 3 brand palette.
// This centralizes colors, typography, and shape so we can keep the UI consistent
// while supporting both light and dark modes via a small factory.

import { createTheme, type ThemeOptions } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";

// User-facing preference options used by the theme mode context.
export type ThemePreference = "light" | "dark" | "system";

const baseTypography: ThemeOptions["typography"] = {
  fontFamily:
    "'Nunito', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  h1: { fontWeight: 700, fontSize: "48px", lineHeight: 1.1 },
  h2: { fontWeight: 700, fontSize: "40px", lineHeight: 1.2 },
  h3: { fontWeight: 600, fontSize: "32px", lineHeight: 1.25 },
  h4: { fontWeight: 700, fontSize: "28px", lineHeight: 1.3 },
  h5: { fontWeight: 600, fontSize: "22px", lineHeight: 1.35 },
  h6: { fontWeight: 600, fontSize: "20px", lineHeight: 1.4 },
  subtitle1: { fontWeight: 600, fontSize: "18px", lineHeight: 1.45 },
  subtitle2: { fontWeight: 600, fontSize: "16px", lineHeight: 1.45 },
  body1: { fontWeight: 400, fontSize: "16px", lineHeight: 1.6 },
  body2: { fontWeight: 400, fontSize: "14px", lineHeight: 1.6 },
  caption: { fontWeight: 500, fontSize: "12px", lineHeight: 1.4 },
  overline: {
    fontWeight: 600,
    fontSize: "11px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    lineHeight: 1.6,
  },
  button: {
    fontWeight: 600,
    fontSize: "14px",
    lineHeight: 1.5,
    textTransform: "none",
  },
};

// Design tokens for light and dark modes. These keep the existing Option 3
// palette (warm orange primary, soft yellow secondary, success green, navy text)
// and simply adapt background/text/border values for dark mode.
export function getDesignTokens(mode: PaletteMode): ThemeOptions {
  const isDark = mode === "dark";

  return {
    palette: {
      mode,

      // Brand background tones: soft warm light surface vs deep navy-ish dark.
      background: {
        default: isDark ? "#020617" : "#FCFCFC", // App background
        paper: isDark ? "#020617" : "#FFFFFF", // Card / primary surfaces
      },

      // Primary accent (warm orange) – unchanged from existing light theme.
      primary: {
        main: "#FF9165",
      },

      // Secondary accent (soft yellow) – unchanged from existing light theme.
      secondary: {
        main: "#FFEFB5",
      },

      // Success green (used for positive states / badges).
      success: {
        main: "#50DBAE",
      },

      text: {
        primary: isDark ? "#F9FAFB" : "#1A2340", // Navy in light, near-white in dark
        secondary: isDark ? "#CBD5F5" : "#1A2340", // Softer contrast in dark mode
      },

      divider: isDark ? "#1E293B" : "#E0E0E0", // Subtle borders tuned per mode
    },

    shape: {
      // Default radius – dialed back so cards feel squared-off instead of pill shaped.
      borderRadius: 8,
    },

    typography: baseTypography,

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          "html, body": {
            margin: 0,
            padding: 0,
            minHeight: "100%",
          },
          body: {
            backgroundColor: isDark ? "#020617" : "#FCFCFC",
            color: isDark ? "#F9FAFB" : "#1A2340",
            fontFamily:
              "'Nunito', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          },
          "#__next, body > div:first-of-type": {
            minHeight: "100%",
            display: "flex",
            flexDirection: "column",
          },
        },
      },

      // Preserve existing button styling (pill-shaped CTAs).
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 9999,
          },
        },
      },

      // Preserve existing paper radius so cards/surfaces stay on-brand.
      MuiPaper: {
        styleOverrides: {
          root: {
            // Keep a light rounding for most surfaces.
            borderRadius: 8,
          },
          rounded: {
            // Ensure the "rounded" Paper variant does not multiply the base radius.
            borderRadius: 8,
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            // Cards should be rectangular with gentle rounding and no implicit masking.
            borderRadius: 8,
            overflow: "hidden",
          },
        },
      },

      // Additional component-level overrides for light/dark can be added here
      // as needed (e.g., AppBar, Drawer, Card) without changing call sites.
    },
  };
}

// Factory that returns a concrete MUI theme for the given palette mode.
export function createAppTheme(mode: PaletteMode) {
  return createTheme(getDesignTokens(mode));
}

// Default theme export keeps existing imports working while we gradually
// adopt the mode-aware factory + ThemeModeProvider.
const theme = createAppTheme("light");

export default theme;
