"use client";

import { useState } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";

type VerificationBannerProps = {
  email: string;
};

export default function VerificationBanner({ email }: VerificationBannerProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleResend() {
    setStatus("sending");

    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Alert
      severity="warning"
      sx={{
        borderRadius: 2,
        "& .MuiAlert-message": { width: "100%" },
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        spacing={1}
      >
        <Typography variant="body2">
          {status === "sent"
            ? "Verification email sent! Check your inbox."
            : "Please verify your email address. Check your inbox for a verification link."}
        </Typography>

        {status !== "sent" && (
          <Button
            size="small"
            variant="outlined"
            color="warning"
            onClick={handleResend}
            disabled={status === "sending"}
            sx={{ textTransform: "none", flexShrink: 0 }}
          >
            {status === "sending" ? "Sending..." : "Resend email"}
          </Button>
        )}

        {status === "error" && (
          <Typography variant="caption" color="error">
            Failed to send. Try again later.
          </Typography>
        )}
      </Stack>
    </Alert>
  );
}
