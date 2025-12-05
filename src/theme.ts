// src/theme.ts
// Material UI theme for the Mimamori app, wired to the Option 3 brand palette.
// This centralizes colors, typography, and shape so we can keep the UI consistent.

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light", // Explicitly lock this theme to light mode for now

    // Brand background tones
    background: {
      default: "#FCFCFC", // Soft white app background
      paper: "#FFFFFF",   // Card / surface background
    },
    // Primary accent (warm orange)
    primary: {
      main: "#FF9165",
    },
    // Secondary accent (soft yellow)
    secondary: {
      main: "#FFEFB5",
    },
    // Success green (used for positive states / badges)
    success: {
      main: "#50DBAE",
    },
    text: {
      primary: "#1A2340",   // Navy for headings and primary text
      secondary: "#1A2340", // Same family for secondary text for now
    },
    divider: "#E0E0E0",      // Subtle neutral borders
  },
  shape: {
    borderRadius: 12, // Default radius – matches card rounding in the style guide
  },
  typography: {
    // Nunito is already loaded via next/font in RootLayout; this makes MUI use it.
    fontFamily:
      "'Nunito', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    button: {
      textTransform: "none", // No ALL CAPS buttons
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999, // Pill-shaped CTAs
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

export default theme;