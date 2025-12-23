"use client";

import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

import React, { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Something went wrong. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Network error. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <AuthShell title="Check your email">
        <Stack spacing={3}>
          <Alert severity="success">
            If an account exists with this email, you&apos;ll receive a password
            reset link shortly.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            The link will expire in 1 hour. If you don&apos;t see the email,
            check your spam folder.
          </Typography>
          <Button
            component={Link}
            href="/login"
            variant="contained"
            fullWidth
            sx={{ textTransform: "none" }}
          >
            Back to login
          </Button>
        </Stack>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your email and we'll send you a reset link."
    >
      {error && <Alert severity="error">{error}</Alert>}

      <Stack spacing={3}>
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
              autoFocus
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSubmitting || !email}
              sx={{ textTransform: "none" }}
            >
              {isSubmitting ? "Sending…" : "Send reset link"}
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
