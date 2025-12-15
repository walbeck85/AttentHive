// src/lib/authRedirect.ts

// Central place for redirect defaults so we don't scatter strings everywhere.
export const DEFAULT_AUTH_REDIRECT = "/dashboard";

// Keep this very small and boring on purpose: it only allows internal,
// app-relative paths and falls back to /dashboard on anything weird.
// This prevents open redirects while still letting us support things like
// /pets/:id and /hive.
export function getSafeCallbackUrl(
  raw?: string | null
): string {
  if (!raw) {
    return DEFAULT_AUTH_REDIRECT;
  }

  let value = raw.trim();

  // Decode once so we don't get tricked by encoded "http://" etc.
  try {
    value = decodeURIComponent(value);
  } catch {
    // If decoding explodes, just carry on with the original string.
  }

  // Block obvious absolute / protocol-relative URLs.
  if (/^https?:\/\//i.test(value) || /^\/\//.test(value)) {
    return DEFAULT_AUTH_REDIRECT;
  }

  // Require a leading slash so we don't treat random strings or relative
  // paths as navigation targets.
  if (!value.startsWith("/")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  // Avoid sending users back into the auth funnel or auth APIs – that tends
  // to create confusing loops in practice.
  if (
    value.startsWith("/login") ||
    value.startsWith("/signup") ||
    value.startsWith("/api/auth")
  ) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return value;
}