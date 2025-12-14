// src/components/pets/WalkTimerModal.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

type BathroomEventType = 'URINATION' | 'DEFECATION';

type BathroomEvent = {
  type: BathroomEventType;
  occurredAt: string;
  minutesIntoWalk: number;
};

type WalkMetadata = {
  durationSeconds: number;
  bathroomEvents: BathroomEvent[];
};

interface WalkTimerModalProps {
  isOpen: boolean;
  petId: string;
  petName: string;
  onComplete: (metadata: WalkMetadata) => void;
  onCancel: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Inner component that manages timer state - remounted via key when modal opens
function WalkTimerContent({
  petName,
  onComplete,
  onCancel,
}: Omit<WalkTimerModalProps, 'isOpen' | 'petId'>) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [bathroomEvents, setBathroomEvents] = useState<BathroomEvent[]>([]);
  const [walkStartTime] = useState(() => new Date());

  // Ref only used in effect cleanup and event handlers, not during render
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect - only manages the interval
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const handleBathroomEvent = (type: BathroomEventType) => {
    const now = new Date();
    const minutesIntoWalk = Math.floor(
      (now.getTime() - walkStartTime.getTime()) / 60000
    );

    const event: BathroomEvent = {
      type,
      occurredAt: now.toISOString(),
      minutesIntoWalk,
    };

    setBathroomEvents((prev) => [...prev, event]);
  };

  const handleComplete = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const metadata: WalkMetadata = {
      durationSeconds: elapsedSeconds,
      bathroomEvents,
    };

    onComplete(metadata);
  };

  const handleCancel = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    onCancel();
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
      aria-labelledby="walk-timer-title"
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
            id="walk-timer-title"
            variant="h6"
            sx={{ fontWeight: 700 }}
          >
            Walking {petName}
          </Typography>

          {/* Timer Display */}
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              fontFamily: 'monospace',
              fontSize: { xs: '3rem', sm: '4rem' },
            }}
          >
            {formatTime(elapsedSeconds)}
          </Typography>

          {/* Bathroom Buttons */}
          <Stack direction="row" spacing={2} width="100%">
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleBathroomEvent('URINATION')}
              sx={{
                py: 1.5,
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
              onClick={() => handleBathroomEvent('DEFECATION')}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                borderColor: theme.palette.warning.main,
                color: theme.palette.warning.main,
                '&:hover': {
                  borderColor: theme.palette.warning.dark,
                  backgroundColor: alpha(theme.palette.warning.main, 0.08),
                },
              }}
            >
              💩 Poop
            </Button>
          </Stack>

          {/* Event List */}
          {bathroomEvents.length > 0 && (
            <Box
              sx={{
                width: '100%',
                maxHeight: 150,
                overflowY: 'auto',
                borderRadius: 2,
                bgcolor: alpha(theme.palette.divider, 0.1),
                p: 1.5,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, mb: 1, display: 'block' }}
              >
                Bathroom Events
              </Typography>
              <Stack spacing={0.75}>
                {bathroomEvents.map((event, idx) => (
                  <Typography key={idx} variant="body2" color="text.secondary">
                    {event.type === 'URINATION' ? '💧' : '💩'}{' '}
                    {event.type === 'URINATION' ? 'Pee' : 'Poop'} at{' '}
                    {event.minutesIntoWalk} min
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}

          {/* Action Buttons */}
          <Stack
            direction="row"
            spacing={1.5}
            justifyContent="center"
            width="100%"
            pt={1}
          >
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleCancel}
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
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleComplete}
              sx={{
                px: 2.75,
                minWidth: 130,
                fontWeight: 700,
                boxShadow: isDark
                  ? `0 8px 20px ${alpha(theme.palette.primary.main, 0.35)}`
                  : `0 8px 18px ${alpha(theme.palette.primary.main, 0.25)}`,
              }}
            >
              Complete Walk
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}

// Wrapper component that conditionally renders the content
// The inner component is remounted on each open because we only render when isOpen=true
// and unmount when isOpen=false, which resets all state
export default function WalkTimerModal({
  isOpen,
  petName,
  onComplete,
  onCancel,
}: WalkTimerModalProps) {
  if (!isOpen) return null;

  return (
    <WalkTimerContent
      petName={petName}
      onComplete={onComplete}
      onCancel={onCancel}
    />
  );
}
