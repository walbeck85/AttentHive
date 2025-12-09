// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Brand-aware semantic colors for AttentHive, derived from the Option 3 style guide.
      // These are intentionally flat HEX values (no CSS variables yet) so we keep the
      // system simple while we rebuild the UI.
      colors: {
        // App background + card canvas
        "mima-bg": "#FCFCFC", // Soft White

        // Primary CTAs, key actions, and highlights
        "mima-primary": "#FF9165", // Vibrant Orange

        // Secondary emphasis surfaces (chips, badges, subtle banners)
        "mima-secondary": "#FFEFB5", // Lemon Yellow

        // Positive / success states
        "mima-success": "#50DBAE", // Spring Green

        // Default text and headings
        "mima-text": "#1A2340", // Deep Navy

        // Neutral borders, dividers, and subtle outlines
        "mima-border": "#E0E0E0", // Cool Gray
      },

      // Keep Nunito wired into Tailwind's `font-sans` utility so existing components
      // can continue to rely on it while we progressively align headings/body sizes
      // to the style guide.
      fontFamily: {
        sans: [
          "var(--font-nunito)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;