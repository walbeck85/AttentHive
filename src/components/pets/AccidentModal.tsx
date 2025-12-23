// src/components/pets/AccidentModal.tsx
'use client';

import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { AccidentSubtype } from '@/config/activityTypes';

export type AccidentMetadata = {
  subtype: AccidentSubtype;
};

interface AccidentModalProps {
  open: boolean;
  petName: string;
  onConfirm: (metadata: AccidentMetadata) => void;
  onClose: () => void;
}

export default function AccidentModal({
  open,
  petName,
  onConfirm,
  onClose,
}: AccidentModalProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!open) return null;

  const handleSelect = (subtype: AccidentSubtype) => {
    onConfirm({ subtype });
  };

  const overlayColor = alpha(theme.palette.common.black, isDark ? 0.65 : 0.4);
  const cardBg = theme.palette.background.paper;
  const cardBorder = theme.palette.divider;
  const cardShadow = isDark
    ? `0 28px 70px ${alpha(theme.palette.common.black, 0.7)}`
    : `0 20px 50px ${alpha(theme.palette.common.black, 0.35)}`;

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-labelledby="accident-modal-title"
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
      onClick={onClose}
    >
      <Paper
        onClick={(e) => e.stopPropagation()}
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
        <Stack spacing={2} alignItems="center">
          {/* Title */}
          <Typography
            id="accident-modal-title"
            variant="h6"
            sx={{ fontWeight: 700 }}
          >
            Report accident for {petName}
          </Typography>

          <Typography variant="body2" color="text.secondary" textAlign="center">
            What type of accident?
          </Typography>

          {/* Selection Buttons - 3 options */}
          <Stack spacing={1.5} width="100%">
            <Stack direction="row" spacing={2} width="100%">
              <Button
                variant="outlined"
                fullWidth
                onClick={() => handleSelect('pee')}
                sx={{
                  py: 2,
                  fontSize: '1.1rem',
                  borderColor: theme.palette.info.main,
                  color: theme.palette.info.main,
                  '&:hover': {
                    borderColor: theme.palette.info.dark,
                    backgroundColor: alpha(theme.palette.info.main, 0.08),
                  },
                }}
              >
                💧 Pee
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => handleSelect('poo')}
                sx={{
                  py: 2,
                  fontSize: '1.1rem',
                  borderColor: theme.palette.warning.main,
                  color: theme.palette.warning.main,
                  '&:hover': {
                    borderColor: theme.palette.warning.dark,
                    backgroundColor: alpha(theme.palette.warning.main, 0.08),
                  },
                }}
              >
                💩 Poo
              </Button>
            </Stack>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleSelect('vomit')}
              sx={{
                py: 2,
                fontSize: '1.1rem',
                borderColor: theme.palette.error.main,
                color: theme.palette.error.main,
                '&:hover': {
                  borderColor: theme.palette.error.dark,
                  backgroundColor: alpha(theme.palette.error.main, 0.08),
                },
              }}
            >
              🤮 Vomit
            </Button>
          </Stack>

          {/* Cancel Button */}
          <Button
            variant="outlined"
            color="inherit"
            onClick={onClose}
            fullWidth
            sx={{
              mt: 1,
              borderColor: isDark
                ? alpha(theme.palette.common.white, 0.25)
                : theme.palette.divider,
              color: theme.palette.text.primary,
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
