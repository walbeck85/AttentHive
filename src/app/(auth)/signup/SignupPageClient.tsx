// src/app/(auth)/signup/SignupPageClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { DEFAULT_AUTH_REDIRECT, getSafeCallbackUrl } from "@/lib/authRedirect";

type SignupPageClientProps = {
  rawCallback: string | null;
  safeCallbackUrl: string;
};

// Client-only signup flow:
// - Handles signup POST
// - Optional auto-login
// - Normalized redirects via safeCallbackUrl
export default function SignupPageClient({
  rawCallback,
  safeCallbackUrl,
}: SignupPageClientProps) {
  const router = useRouter();
  const { status } = useSession();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // 1. Hit your signup API route.
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });

      if (!res.ok) {
        setError(
          "Unable to create account. Please check your details and try again."
        );
        setIsSubmitting(false);
        return;
      }

      // 2. Optional auto-login using credentials.
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: safeCallbackUrl,
      });

      if (!result || result.error) {
        // If auto-login fails, drop them on the login page with callback preserved.
        const loginUrl =
          rawCallback != null
            ? `/login?callbackUrl=${encodeURIComponent(rawCallback)}`
            : "/login";

        router.push(loginUrl);
        return;
      }

      const target = getSafeCallbackUrl(result.url ?? safeCallbackUrl);
      router.push(target);
    } catch (err) {
      console.error("Unexpected error during signup:", err);
      setError(
        "Something went wrong while creating your account. Please try again."
      );
      setIsSubmitting(false);
    }
  }

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

  return (
    <div className="mm-page">
      <div className="mm-shell max-w-md mx-auto">
        <div className="mm-card">
          <h1 className="mm-h1 mb-4">Sign up</h1>

          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mm-label">
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                className="mm-input mt-1 w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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
                autoComplete="new-password"
                className="mm-input mt-1 w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="mm-button w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mm-meta mt-4 text-center">
            Already have an account?{" "}
            <a
              href={
                rawCallback
                  ? `/login?callbackUrl=${encodeURIComponent(rawCallback)}`
                  : "/login"
              }
              className="mm-link"
            >
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}