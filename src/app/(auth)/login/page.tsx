"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

import { getSafeCallbackUrl, DEFAULT_AUTH_REDIRECT } from "@/lib/authRedirect";

// Login keeps the same UX as before, but now:
// - We normalize callbackUrl for safety.
// - We send already-authenticated users directly to their target page.
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const rawCallback = searchParams.get("callbackUrl");
  const safeCallbackUrl = getSafeCallbackUrl(rawCallback);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // We keep a single generic error string to avoid leaking auth details.
  const [error, setError] = useState<string | null>(null);

  // If a signed-in user hits /login manually, just send them on their way.
  // This matches the existing intent (redirect to dashboard) but respects
  // any *safe* callbackUrl we were given.
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(safeCallbackUrl || DEFAULT_AUTH_REDIRECT);
    }
  }, [status, router, safeCallbackUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: safeCallbackUrl,
      });

      // NextAuth will set result.error on invalid credentials, etc.
      if (!result || result.error) {
        setError("Invalid email or password.");
        setIsSubmitting(false);
        return;
      }

      // Prefer the URL from NextAuth if present, but run it through the
      // same safety net again.
      const target = getSafeCallbackUrl(result.url ?? safeCallbackUrl);
      router.push(target);
    } catch (err) {
      // We don't surface the raw error to the user; just let them know
      // something went wrong and log in the console for debugging.
      console.error("Unexpected error during login:", err);
      setError("Something went wrong while logging in. Please try again.");
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    setError(null);

    try {
      // Keep the same Google OAuth semantics, but make sure we only ever
      // redirect to an internal route.
      await signIn("google", {
        callbackUrl: safeCallbackUrl,
      });
      // Note: with redirect: true (default), NextAuth will handle navigation.
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setError("Google sign-in failed. Please try again.");
      setIsGoogleLoading(false);
    }
  }

  // If we're still resolving the session, just show a basic loading state.
  if (status === "loading") {
    return (
      <div className="mm-page">
        <div className="mm-shell">
          <div className="mm-card">
            <p className="mm-muted">Checking your login status…</p>
          </div>
        </div>
      </div>
    );
  }

  // Normal login form. Feel free to re-wrap this with your existing visual
  // shell; the important parts are the handlers and state above.
  return (
    <div className="mm-page">
      <div className="mm-shell max-w-md mx-auto">
        <div className="mm-card">
          <h1 className="mm-h1 mb-4">Log in</h1>

          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mm-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="mm-input mt-1 w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mm-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="mm-input mt-1 w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="mm-button w-full"
              disabled={isSubmitting || isGoogleLoading}
            >
              {isSubmitting ? "Logging in…" : "Log in"}
            </button>
          </form>

          <div className="mt-6">
            <button
              type="button"
              className="mm-button-secondary w-full"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || isGoogleLoading}
            >
              {isGoogleLoading ? "Connecting to Google…" : "Continue with Google"}
            </button>
          </div>

          <p className="mm-meta mt-4 text-center">
            Don&apos;t have an account?{" "}
            <a
              href={
                rawCallback
                  ? `/signup?callbackUrl=${encodeURIComponent(rawCallback)}`
                  : "/signup"
              }
              className="mm-link"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}