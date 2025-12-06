// src/app/(auth)/signup/SignupPageClient.tsx
"use client";

import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { DEFAULT_AUTH_REDIRECT, getSafeCallbackUrl } from "@/lib/authRedirect";

import {
  Alert,
  Box,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

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

  // Tracks the in-flight state for the email/password signup path.
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Tracks the in-flight state for the Google OAuth path so we can prevent double-submits.
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  // Shared error surface for both credential and Google flows.
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(safeCallbackUrl || DEFAULT_AUTH_REDIRECT);
    }
  }, [status, router, safeCallbackUrl]);

  async function handleGoogleSignup() {
    // Avoid double-taps while we already have an OAuth request in flight.
    if (isGoogleLoading) {
      return;
    }

    // Reset any previous error so the user gets a clean read on this attempt.
    setError(null);
    setIsGoogleLoading(true);

    try {
      // Delegate to NextAuth's Google provider, using the same safe callback contract
      // that the credentials flow relies on. NextAuth will own the redirect.
      await signIn("google", {
        callbackUrl: safeCallbackUrl,
      });
    } catch (err) {
      console.error("Google signup failed before redirect:", err);
      // If something fails before NextAuth gets a chance to redirect,
      // we clear the loading state and surface a helpful error.
      setIsGoogleLoading(false);
      setError(
        "Unable to connect with Google. Please try again or use email and password."
      );
    }
  }

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
      <AuthShell title="Sign up">
        <Typography variant="body2" color="text.secondary">
          Checking your login status…
        </Typography>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Sign up"
      subtitle="Create your Mimamori account to coordinate care."
    >
      {error && (
        <Alert severity="error">
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Primary Google CTA – matches the login layout for consistency. */}
        <Button
          type="button"
          variant="outlined"
          fullWidth
          onClick={handleGoogleSignup}
          disabled={isGoogleLoading || isSubmitting}
          sx={{
            textTransform: "none",
            borderRadius: 999,
            borderColor: "warning.main",
            color: "warning.main",
            py: 1.1,
          }}
        >
          {isGoogleLoading ? "Connecting to Google…" : "Continue with Google"}
        </Button>

        {/* Divider between OAuth and email/password form. */}
        <Divider sx={{ fontSize: 12, color: "text.secondary" }}>
          or continue with email
        </Divider>

        {/* Email/password signup form – behavior unchanged, now using MUI fields. */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              id="name"
              label="Name"
              type="text"
              autoComplete="name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <TextField
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              id="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSubmitting}
              sx={{ textTransform: "none" }}
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          </Stack>
        </Box>

        {/* Footer link to login, keeping callbackUrl behavior identical. */}
        <Typography variant="body2" align="center">
          Already have an account?{" "}
          <Button
            component={Link}
            href={
              rawCallback
                ? `/login?callbackUrl=${encodeURIComponent(rawCallback)}`
                : "/login"
            }
            variant="text"
            sx={{ textTransform: "none", px: 0.75, minWidth: "auto" }}
          >
            Log in
          </Button>
        </Typography>
      </Stack>
    </AuthShell>
  );
}