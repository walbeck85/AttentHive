"use client";

import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validate form
  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit =
    password.length >= 8 &&
    confirmPassword.length > 0 &&
    password === confirmPassword &&
    !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Network error. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  }

  // No token in URL
  if (!token) {
    return (
      <AuthShell title="Invalid link">
        <Stack spacing={3}>
          <Alert severity="error">
            This password reset link is invalid or has expired.
          </Alert>
          <Button
            component={Link}
            href="/auth/forgot-password"
            variant="contained"
            fullWidth
            sx={{ textTransform: "none" }}
          >
            Request a new reset link
          </Button>
        </Stack>
      </AuthShell>
    );
  }

  // Success state
  if (success) {
    return (
      <AuthShell title="Password reset">
        <Stack spacing={3}>
          <Alert severity="success">
            Your password has been reset successfully.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            You can now log in with your new password.
          </Typography>
          <Button
            component={Link}
            href="/login"
            variant="contained"
            fullWidth
            sx={{ textTransform: "none" }}
          >
            Go to login
          </Button>
        </Stack>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter your new password below."
    >
      {error && <Alert severity="error">{error}</Alert>}

      <Stack spacing={3}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              id="password"
              label="New password"
              type="password"
              autoComplete="new-password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              error={passwordTooShort}
              helperText={
                passwordTooShort ? "Password must be at least 8 characters" : ""
              }
            />
            <TextField
              id="confirmPassword"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              error={passwordsMismatch}
              helperText={passwordsMismatch ? "Passwords do not match" : ""}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={!canSubmit}
              sx={{ textTransform: "none" }}
            >
              {isSubmitting ? "Resetting…" : "Reset password"}
            </Button>
          </Stack>
        </Box>

        <Typography variant="body2" align="center">
          Remember your password?{" "}
          <Button
            component={Link}
            href="/login"
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

function ResetPasswordLoading() {
  return (
    <AuthShell title="Reset password">
      <Stack spacing={3} alignItems="center">
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Stack>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
