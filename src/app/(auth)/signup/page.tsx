"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

import { Button, Stack, TextField, Typography } from "@mui/material";
import AuthShell from "@/components/auth/AuthShell";

// Signup stays client-side so I can keep the UX tight: inline validation,
// controlled fields, and a seamless handoff into the same credentials flow.
export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  // I keep callbackUrl flowing through signup so users who were trying to reach
  // a deep link still end up where they intended after creating an account.
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Error + loading states so the user gets clear feedback instead of
  // staring at a frozen button or silent failure.
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status === "authenticated") {
    router.replace(callbackUrl);
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Bare-minimum guardrail before touching the backend — this keeps obviously
    // bad input out and mirrors the validation tone of the rest of the app.
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // I’m assuming the existing API surface already has a signup endpoint at
      // /api/auth/signup; if that ever moves, I only want the path changing here,
      // not the shape of the client-side flow.
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        // I don't expose raw server errors here — the goal is a stable,
        // generic message that doesn't leak implementation details.
        const data = await response.json().catch(() => null);
        const message =
          data?.error ||
          data?.message ||
          "We couldn't create that account. Please try again.";
        setError(message);
        setIsSubmitting(false);
        return;
      }

      // Once the user exists, I hand off to the same credentials flow as login
      // so the rest of the app doesn’t have to care whether they “logged in”
      // or “just signed up.”
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result || result.error) {
        setError(
          "Your account was created, but we couldn't log you in automatically. Please try logging in."
        );
        setIsSubmitting(false);
        return;
      }

      router.push(result.url ?? callbackUrl);
    } catch (err) {
      console.error("Signup failed unexpectedly:", err);
      setError("Something went wrong creating your account. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start coordinating care for your pets, people, and plants."
    >
      <form onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          <TextField
            label="Name"
            name="name"
            autoComplete="name"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <TextField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            label="Password"
            type="password"
            name="password"
            autoComplete="new-password"
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
            {isSubmitting ? "Creating your account..." : "Sign up"}
          </Button>
        </Stack>
      </form>

      <Typography variant="body2" color="text.secondary">
        Already have an account?{" "}
        <Button
          variant="text"
          size="small"
          onClick={() =>
            router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
          }
        >
          Log in
        </Button>
      </Typography>
    </AuthShell>
  );
}