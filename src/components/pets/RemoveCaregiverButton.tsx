"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type RemoveCaregiverButtonProps = {
  membershipId: string;
  petName: string;
};

export function RemoveCaregiverButton({
  membershipId,
  petName,
}: RemoveCaregiverButtonProps) {
  const theme = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const dangerBorder = alpha(theme.palette.error.main, 0.35);
  const dangerBg = alpha(theme.palette.error.main, 0.12);
  const dangerHoverBg = alpha(theme.palette.error.main, 0.2);
  const dangerText = theme.palette.error.dark ?? theme.palette.error.main;

  async function handleClick() {
    // Simple confirmation so owners do not accidentally nuke access
    const confirmed = window.confirm(
      `Remove this person from ${petName}'s Care Circle? They will lose access immediately.`
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(
        `/api/care-circles/members?membershipId=${encodeURIComponent(
          membershipId
        )}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message =
          body?.error ?? "Unable to remove caregiver. Please try again.";
        throw new Error(message);
      }

      // Refresh server components so lists stay in sync
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while removing the caregiver.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-end", sm: "center" },
        gap: { xs: 0.5, sm: 1 },
      }}
    >
      <Button
        type="button"
        onClick={handleClick}
        disabled={isSubmitting}
        variant="outlined"
        size="small"
        sx={{
          borderRadius: 9999,
          textTransform: "none",
          px: 1.5,
          py: 0.5,
          fontWeight: 600,
          borderColor: dangerBorder,
          bgcolor: dangerBg,
          color: dangerText,
          "&:hover": {
            bgcolor: dangerHoverBg,
            borderColor: theme.palette.error.main,
          },
          "&:disabled": {
            opacity: 0.65,
          },
        }}
      >
        {isSubmitting ? "Removing..." : "Remove"}
      </Button>
      {errorMessage && (
        <Typography
          variant="caption"
          sx={{
            color: dangerText,
            maxWidth: theme.spacing(40),
            textAlign: "right",
            lineHeight: 1.4,
          }}
        >
          {errorMessage}
        </Typography>
      )}
    </Box>
  );
}
