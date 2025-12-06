"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { DEFAULT_AUTH_REDIRECT, getSafeCallbackUrl } from "@/lib/authRedirect";

type LoginPageClientProps = {
  rawCallback: string | null;
  safeCallbackUrl: string;
};

// Client-only login component:
// - Server wrapper sanitizes callbackUrl and passes it in
// - This component owns all NextAuth + router behavior
export default function LoginPageClient({
  rawCallback,
  safeCallbackUrl,
}: LoginPageClientProps) {
  const router = useRouter();
  const { status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the user is already authenticated, don't render the login form at all.
  // Instead, send them to their safe target (or /dashboard as a sane default).
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

      // NextAuth uses `result.error` for bad credentials and similar issues.
      if (!result || result.error) {
        setError("Invalid email or password.");
        setIsSubmitting(false);
        return;
      }

      // Even if NextAuth hands us back a URL, run it through our safety net.
      const target = getSafeCallbackUrl(result.url ?? safeCallbackUrl);
      router.push(target);
    } catch (err) {
      // Keep the user-facing message generic but log details for debugging.
      console.error("Unexpected error during login:", err);
      setError("Something went wrong while logging in. Please try again.");
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    setError(null);

    try {
      await signIn("google", { callbackUrl: safeCallbackUrl });
      // With redirect: true (default), NextAuth will navigate for us.
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setError("Google sign-in failed. Please try again.");
      setIsGoogleLoading(false);
    }
  }

  // While we're resolving the session state, give a minimal loading view.
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

  // This is effectively the old login form you had, now living in a client
  // component instead of the route file.
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