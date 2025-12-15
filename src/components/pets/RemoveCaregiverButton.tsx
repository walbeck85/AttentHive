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
  const theme = useTheme(); // Pull palette tokens so colors track light and dark modes automatically
  const [isSubmitting, setIsSubmitting] = useState(false); // Disable interactions while the removal request runs
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Show API errors inline without changing the page
  const router = useRouter(); // Refresh server components after removal to keep lists in sync

  const dangerBorder = alpha(theme.palette.error.main, 0.35); // Soft error border so the button matches the theme divider weight
  const dangerBg = alpha(theme.palette.error.main, 0.12); // Subtle background tint that reads correctly in both modes
  const dangerHoverBg = alpha(theme.palette.error.main, 0.2); // Slightly stronger hover tint to show affordance without changing behavior
  const dangerText = theme.palette.error.dark ?? theme.palette.error.main; // Use semantic error text color with a darker fallback for contrast

  async function handleClick() {
    // Simple confirmation to prevent accidental caregiver removal
    const confirmed = window.confirm(
      `Remove this person from ${petName}'s Hive? They will lose access immediately.`
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(
        `/api/hives/members?membershipId=${encodeURIComponent(
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
      /* Keep layout responsive so the warning label aligns with the button without changing copy or spacing */
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-end", sm: "center" },
        gap: { xs: 0.5, sm: 1 },
      }}
    >
      <Button
        /* Use an outlined error style that leans on theme tokens for consistent light and dark rendering */
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
          /* Pair the error text color with the button styling so feedback reads as one unit */
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
