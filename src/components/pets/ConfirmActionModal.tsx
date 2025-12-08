// src/components/pets/ConfirmActionModal.tsx
'use client';

import React from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

type ConfirmActionModalProps = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Full-screen confirmation modal for quick actions.
 * Styled with the MUI theme so it matches light/dark mode surfaces.
 */
export default function ConfirmActionModal({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!open) return null;

  const overlayColor = alpha(
    theme.palette.common.black,
    isDark ? 0.65 : 0.4
  );

  const cardBg = theme.palette.background.paper;
  const cardBorder = theme.palette.divider;
  const cardShadow = isDark
    ? `0 28px 70px ${alpha(theme.palette.common.black, 0.7)}`
    : `0 20px 50px ${alpha(theme.palette.common.black, 0.35)}`;

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: theme.zIndex.modal,
        backgroundColor: overlayColor,
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 3,
      }}
      onClick={onCancel} // click on backdrop closes
    >
      <Paper
        onClick={(event) => event.stopPropagation()} // don't close when clicking inside
        elevation={0}
        sx={{
          maxWidth: 440,
          width: 'min(440px, 100%)',
          borderRadius: 3,
          bgcolor: cardBg,
          border: `1px solid ${cardBorder}`,
          boxShadow: cardShadow,
          px: { xs: 2.5, sm: 3 },
          py: { xs: 2.25, sm: 2.75 },
          color: theme.palette.text.primary,
        }}
      >
        <Stack spacing={1.5} alignItems="center" textAlign="center">
          <Typography
            id="confirm-dialog-title"
            variant="h6"
            sx={{ fontWeight: 700 }}
          >
            {title}
          </Typography>

          <Typography
            id="confirm-dialog-description"
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 360 }}
          >
            {body}
          </Typography>

          <Stack direction="row" spacing={1.5} justifyContent="center" width="100%" pt={0.5}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={onCancel}
              sx={{
                borderColor: isDark
                  ? alpha(theme.palette.common.white, 0.25)
                  : theme.palette.divider,
                color: theme.palette.text.primary,
                px: 2.5,
                minWidth: 120,
                fontWeight: 600,
              }}
            >
              {cancelLabel}
            </Button>

            <Button
              variant="contained"
              color="primary"
              onClick={onConfirm}
              sx={{
                px: 2.75,
                minWidth: 130,
                fontWeight: 700,
                boxShadow: isDark
                  ? `0 8px 20px ${alpha(theme.palette.primary.main, 0.35)}`
                  : `0 8px 18px ${alpha(theme.palette.primary.main, 0.25)}`,
              }}
            >
              {confirmLabel}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
