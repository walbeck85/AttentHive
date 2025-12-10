// src/config/appMeta.ts

// Core branding
export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME ?? "AttentHive";

export const APP_TAGLINE =
  "Your Hive for the Ones You Care For";

// Primary domain & canonical URL
export const APP_PRIMARY_DOMAIN =
  process.env.NEXT_PUBLIC_APP_PRIMARY_DOMAIN ?? "attenthive.com";

export const APP_CANONICAL_URL =
  process.env.NEXT_PUBLIC_APP_CANONICAL_URL ??
  `https://${APP_PRIMARY_DOMAIN}`;

// Support contact — safe to swap later if you change addresses
export const APP_SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_APP_SUPPORT_EMAIL ?? "support@attenthive.com";

// Phase 3 will flip APP_NAME to "AttentHive" and may update the tagline.
