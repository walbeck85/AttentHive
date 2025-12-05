"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

import {
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AuthShell from "@/components/auth/AuthShell";

// Login page kept as a client component so I can lean on next-auth's client helpers
// (signIn/useSession) instead of inventing a fragile server-action auth layer.
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  // If the user somehow lands here while already authenticated, just punt them
  // to the dashboard instead of making them stare at a pointless login form.
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  // If NextAuth bounces us back with an error query param, I want a friendly,
  // non-leaky message rather than surfacing raw error codes.
  const externalErrorCode = searchParams.get("error");
  const externalError =
    externalErrorCode === "CredentialsSignin"
      ? "Invalid email or password."
      : externalErrorCode
      ? "We couldn't log you in. Please try again."
      : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Local error state lets me handle both NextAuth error codes and my own
  // validation issues without bouncing the user all over the place.
  const [error, setError] = useState<string | null>(externalError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If the session is already authenticated on the client, there's no reason
  // to keep the user here — shove them toward where the rest of the app lives.
  if (status === "authenticated") {
    router.replace(callbackUrl);
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Basic guardrail so I don't hammer NextAuth with obviously bad input
    // and can keep the error messaging consistent with the rest of the app.
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // I’m explicitly using redirect: false so I stay in control of client-side
      // navigation and error handling instead of letting NextAuth hard-redirect.
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      // NextAuth returns a result object instead of throwing, so I lean on that
      // contract rather than playing guess-the-exception game.
      if (!result || result.error) {
        setError("Invalid email or password.");
        setIsSubmitting(false);
        return;
      }

      // If NextAuth gives me a URL, I trust it; otherwise I fall back to the
      // callbackUrl that the rest of the app expects.
      router.push(result.url ?? callbackUrl);
    } catch (err) {
      // In case something truly weird happens (network, misconfig, etc.),
      // I still give the user a clear message instead of a stack trace.
      console.error("Login failed unexpectedly:", err);
      setError("Something went wrong logging you in. Please try again.");
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    // I’m clearing any credential-specific error here so the Google path
    // doesn’t inherit stale state from a previous bad password attempt.
    setError(null);
    setIsSubmitting(true);

    try {
      // For OAuth I’m happy to let NextAuth own the redirect, since that’s
      // already the mental model users expect from “Continue with Google”.
      await signIn("google", {
        callbackUrl,
      });
    } catch (err) {
      console.error("Google login failed unexpectedly:", err);
      setError("Something went wrong with Google sign-in. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Pick up where you left off with your care circle."
    >
      <Stack spacing={2.5}>
        {/* Keeping Google as the first option because it's the lowest-friction path,
            but still pairing it with email so people have a clear fallback. */}
        <Button
          variant="outlined"
          fullWidth
          disabled={isSubmitting}
          onClick={handleGoogleSignIn}
        >
          Continue with Google
        </Button>

        <Divider>or</Divider>

        <form onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            <TextField
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // Keeping validation feedback tight on the field so users
              // don't have to hunt around the page to see what's wrong.
              error={Boolean(error) && !password}
            />

            <TextField
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={Boolean(error)}
              helperText={error ?? " "}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing you in..." : "Log in"}
            </Button>
          </Stack>
        </form>

        <Typography variant="body2" color="text.secondary">
          Don&apos;t have an account yet?{" "}
          <Button
            variant="text"
            size="small"
            onClick={() =>
              router.push(
                `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`
              )
            }
          >
            Sign up
          </Button>
        </Typography>
      </Stack>
    </AuthShell>
  );
}