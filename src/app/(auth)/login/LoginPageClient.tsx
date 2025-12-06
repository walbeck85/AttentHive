"use client";

import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
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
      <AuthShell title="Log in">
        <Typography variant="body2" color="text.secondary">
          Checking your login status…
        </Typography>
      </AuthShell>
    );
  }

  // This is effectively the old login form you had, now living in a client
  // component instead of the route file, but rendered through the shared MUI AuthShell.
  return (
    <AuthShell
      title="Log in"
      subtitle="Access your Mimamori care circle."
    >
      {error && (
        <Alert severity="error">
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Primary Google CTA – matches the signup layout for consistency. */}
        <Button
          type="button"
          variant="outlined"
          fullWidth
          onClick={handleGoogleSignIn}
          disabled={isSubmitting || isGoogleLoading}
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

        {/* Email/password login form – behavior unchanged, now using MUI fields. */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
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
              autoComplete="current-password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSubmitting || isGoogleLoading}
              sx={{ textTransform: "none" }}
            >
              {isSubmitting ? "Logging in…" : "Log in"}
            </Button>
          </Stack>
        </Box>

        {/* Footer link to signup, keeping callbackUrl behavior identical. */}
        <Typography variant="body2" align="center">
          Don&apos;t have an account?{" "}
          <Button
            component={Link}
            href={
              rawCallback
                ? `/signup?callbackUrl=${encodeURIComponent(rawCallback)}`
                : "/signup"
            }
            variant="text"
            sx={{ textTransform: "none", px: 0.75, minWidth: "auto" }}
          >
            Sign up
          </Button>
        </Typography>
      </Stack>
    </AuthShell>
  );
}