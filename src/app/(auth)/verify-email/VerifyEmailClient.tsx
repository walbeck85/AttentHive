"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type VerifyEmailClientProps = {
  token: string | null;
};

type Status = "verifying" | "success" | "expired" | "error" | "no-token";

export default function VerifyEmailClient({ token }: VerifyEmailClientProps) {
  const [status, setStatus] = useState<Status>(token ? "verifying" : "no-token");
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    if (!token) return;

    async function verify() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          setStatus("success");
        } else {
          const data = await res.json().catch(() => null);
          const msg = data?.error ?? "";
          if (msg.includes("expired") || msg.includes("Invalid")) {
            setStatus("expired");
          } else {
            setStatus("error");
          }
        }
      } catch {
        setStatus("error");
      }
    }

    verify();
  }, [token]);

  async function handleResend() {
    if (!resendEmail.trim()) return;
    setResendStatus("sending");

    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });

      if (res.ok) {
        setResendStatus("sent");
      } else {
        setResendStatus("error");
      }
    } catch {
      setResendStatus("error");
    }
  }

  if (status === "verifying") {
    return (
      <AuthShell title="Verifying your email">
        <Stack alignItems="center" spacing={2} sx={{ py: 3 }}>
          <CircularProgress color="warning" />
          <Typography variant="body2" color="text.secondary">
            Please wait...
          </Typography>
        </Stack>
      </AuthShell>
    );
  }

  if (status === "success") {
    return (
      <AuthShell title="Email verified">
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          Your email has been verified successfully.
        </Alert>
        <Button
          component={Link}
          href="/login"
          variant="contained"
          fullWidth
          sx={{ textTransform: "none" }}
        >
          Continue to login
        </Button>
      </AuthShell>
    );
  }

  if (status === "no-token") {
    return (
      <AuthShell
        title="Verify your email"
        subtitle="No verification token provided. If you need a new verification email, enter your email address below."
      >
        <ResendForm
          email={resendEmail}
          onEmailChange={setResendEmail}
          onSubmit={handleResend}
          status={resendStatus}
        />
        <Typography variant="body2" align="center">
          <Button
            component={Link}
            href="/login"
            variant="text"
            sx={{ textTransform: "none", px: 0.75, minWidth: "auto" }}
          >
            Back to login
          </Button>
        </Typography>
      </AuthShell>
    );
  }

  // expired or error
  return (
    <AuthShell
      title="Verification failed"
      subtitle={
        status === "expired"
          ? "This verification link has expired or is invalid. Request a new one below."
          : "Something went wrong while verifying your email. Please try again."
      }
    >
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        {status === "expired"
          ? "Your verification link has expired or is invalid."
          : "An unexpected error occurred."}
      </Alert>
      <ResendForm
        email={resendEmail}
        onEmailChange={setResendEmail}
        onSubmit={handleResend}
        status={resendStatus}
      />
      <Typography variant="body2" align="center">
        <Button
          component={Link}
          href="/login"
          variant="text"
          sx={{ textTransform: "none", px: 0.75, minWidth: "auto" }}
        >
          Back to login
        </Button>
      </Typography>
    </AuthShell>
  );
}

function ResendForm({
  email,
  onEmailChange,
  onSubmit,
  status,
}: {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  status: "idle" | "sending" | "sent" | "error";
}) {
  if (status === "sent") {
    return (
      <Alert severity="success" sx={{ borderRadius: 2 }}>
        Verification email sent! Check your inbox.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <TextField
        type="email"
        label="Email address"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        size="small"
        fullWidth
      />
      {status === "error" && (
        <Typography variant="caption" color="error">
          Failed to send verification email. Please try again later.
        </Typography>
      )}
      <Button
        variant="contained"
        fullWidth
        onClick={onSubmit}
        disabled={status === "sending" || !email.trim()}
        sx={{ textTransform: "none" }}
      >
        {status === "sending" ? "Sending..." : "Resend verification email"}
      </Button>
    </Stack>
  );
}
