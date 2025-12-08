// src/components/pets/PetCard.tsx
'use client';

// Imports ------------------------------------------------------
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ConfirmActionModal from './ConfirmActionModal';
import PetAvatar from './PetAvatar';
import {
  PET_CHARACTERISTICS,
  type PetCharacteristicId,
} from '@/lib/petCharacteristics';
import { alpha, type Theme, useTheme } from '@mui/material/styles';

// MUI imports --------------------------------------------------
// I’m using MUI here for the structural shell (Card, Box, Stack, Typography)
// so dashboard cards can share theme-based spacing/shape, while keeping
// existing Tailwind tokens like mm-card/mm-chip as visual scaffolding for now.
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Stack,
  Typography,
} from '@mui/material';

// Types --------------------------------------------------------
type ActionType = 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';

// CareLog represents a single activity entry for a pet
type CareLog = {
  id: string;
  activityType: ActionType;
  createdAt: string;
  user: { name: string };
};

// PetData represents the main pet information along with care logs
export type PetData = {
  id: string;
  name: string;
  type: string;
  breed: string;
  gender: string;
  birthDate: string;
  weight: number;
  careLogs: CareLog[];
  imageUrl?: string | null; // Let the card render photos when available without forcing every caller to provide one.
  // Optional behavior/needs badges surfaced on the card so handlers
  // can see safety/accessibility context at a glance.
  characteristics?: PetCharacteristicId[];
};

// Component Props ----------------------------------------------
// onQuickAction is still required so existing parents don't break.
type Props = {
  pet: PetData;
  currentUserName?: string | null;
  onQuickAction: (petId: string, petName: string, action: ActionType) => void;
};

// Helpers ------------------------------------------------------
// Calculates age in years from birth date
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const m = today.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

// Formats a date string into a human-readable "time ago" format
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSecs < 60) return 'just now';
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// Returns the appropriate noun for an activity type
function getActivityNoun(type: ActionType): string {
  switch (type) {
    case 'FEED':
      return 'a meal';
    case 'WALK':
      return 'a walk';
    case 'MEDICATE':
      return 'medication';
    case 'ACCIDENT':
      return 'an accident';
    default:
      return 'care';
  }
}

// Describes an activity log entry in human-readable form
function describeActivity(
  log: CareLog,
  currentUserName?: string | null
): string {
  const actor =
    log.user?.name && log.user.name === currentUserName
      ? 'You'
      : log.user?.name || 'Someone';

  const noun = getActivityNoun(log.activityType);
  return `${actor} logged ${noun}`;
}

// Map for nicer labels in the modal + buttons
const ACTION_LABELS: Record<ActionType, string> = {
  FEED: 'Feed',
  WALK: 'Walk',
  MEDICATE: 'Medicate',
  ACCIDENT: 'Accident',
};

// Helper: look up a human-readable label for a characteristic ID.
// This keeps rendering logic simple and resilient to future list changes.
function getCharacteristicLabel(id: PetCharacteristicId | string): string {
  const match = PET_CHARACTERISTICS.find((c) => c.id === id);
  return match?.label ?? id;
}

// Helper: map each characteristic to a distinct visual style so the most
// important safety flags stand out without overwhelming the card.
function getCharacteristicStyles(theme: Theme, id: PetCharacteristicId | string) {
  switch (id) {
    case 'AGGRESSIVE':
      // High-alert flag: strong red pill.
      return {
        borderColor: alpha(theme.palette.error.main, 0.55),
        backgroundColor: alpha(theme.palette.error.main, 0.14),
        color: theme.palette.error.dark ?? theme.palette.error.main,
      };
    case 'REACTIVE':
      // Medium-alert flag: warm amber pill.
      return {
        borderColor: alpha(theme.palette.warning.main, 0.6),
        backgroundColor: alpha(theme.palette.warning.light, 0.22),
        color: theme.palette.warning.dark ?? theme.palette.warning.main,
      };
    case 'MOBILITY_ISSUES':
      // Accessibility-related: calming teal pill.
      return {
        borderColor: alpha(theme.palette.success.main, 0.6),
        backgroundColor: alpha(theme.palette.success.main, 0.18),
        color: theme.palette.success.dark ?? theme.palette.success.main,
      };
    case 'BLIND':
      // Sensory note: cool indigo pill.
      return {
        borderColor: alpha(theme.palette.info.main, 0.6),
        backgroundColor: alpha(theme.palette.info.light, 0.18),
        color: theme.palette.info.dark ?? theme.palette.info.main,
      };
    case 'DEAF':
      // Sensory note: soft blue pill.
      return {
        borderColor: alpha(theme.palette.info.main, 0.45),
        backgroundColor: alpha(theme.palette.info.main, 0.12),
        color: theme.palette.info.main,
      };
    case 'SHY':
      // Temperament note: gentle mauve pill.
      return {
        borderColor: alpha(theme.palette.secondary.main, 0.55),
        backgroundColor: alpha(theme.palette.secondary.main, 0.2),
        color: theme.palette.text.primary,
      };
    default:
      // Fallback for any future flags we add.
      return {
        borderColor: theme.palette.divider,
        backgroundColor: alpha(theme.palette.text.secondary, 0.06),
        color: theme.palette.text.secondary,
      };
  }
}

// Component -----------------------------------------------------
// Renders a card displaying pet information and quick actions
export default function PetCard({ pet, currentUserName, onQuickAction }: Props) {
  const theme = useTheme();
  const lastLog = pet.careLogs?.[0];

  // Modal state: which action is waiting for confirmation?
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // We gate time-based formatting behind a "mounted" flag so the server and
  // client don't disagree about relative times and trigger hydration warnings.
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Centralized handler that *actually* logs the activity
  const persistQuickAction = async (action: ActionType) => {
    try {
      const res = await fetch('/api/care-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: pet.id,
          activityType: action,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Failed to log care activity', data);
        throw new Error(data.error || 'Failed to log care activity');
      }

      // Let the parent react if it wants to (toasts, optimistic UI, etc.).
      if (onQuickAction) {
        onQuickAction(pet.id, pet.name, action);
      }
    } catch (err) {
      console.error('Error while logging care activity', err);
    }
  };

  // When a button is clicked, we *open the modal* instead of logging immediately.
  const handleRequestQuickAction = (action: ActionType) => {
    setPendingAction(action);
    setIsConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    await persistQuickAction(pendingAction);
    setIsConfirmOpen(false);
    setPendingAction(null);
  };

  const handleCancelAction = () => {
    setIsConfirmOpen(false);
    setPendingAction(null);
  };

  const pendingLabel = pendingAction ? ACTION_LABELS[pendingAction] : '';
  const modalTitle = pendingAction
    ? `Log ${pendingLabel.toLowerCase()} for ${pet.name}?`
    : '';
  const modalBody = pendingAction
    ? `This will add a “${pendingLabel}” entry to ${pet.name}'s activity log.`
    : '';

  // Render the pet card + modal
  return (
    <>
      {/* Card wraps the entire pet block so we can lean on theme radius, background,
          and spacing instead of hand-tuning each dashboard card. */}
      <Card
        component="article"
        className="group"
        sx={{
          // Force a rectangular shell on all breakpoints.
          borderRadius: 0,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          // Keep children clipped so the border shows cleanly at the corners.
          overflow: 'hidden',
          // Give the card a subtle border and remove elevation so we are not
          // re-introducing any circular mask or heavy drop shadow.
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
        }}
      >
        {/* HEADER */}
        {/* Using Box + Stack here gives us responsive padding and gap control,
            while still leaving typography + color close to your existing brand. */}
        <Box
          component="header"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            px: 2.5,
            py: 2,
          }}
        >
          <Stack spacing={2}>
            {/* Characteristics badges – surfaced at the top so safety / behavior
                flags are visible before anything else. */}
            {pet.characteristics && pet.characteristics.length > 0 && (
              <Box className="flex flex-wrap gap-2">
                {pet.characteristics.map((id) => (
                  <Box
                    key={id}
                    component="span"
                    className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
                    sx={{
                      border: '1px solid',
                      ...getCharacteristicStyles(theme, id),
                    }}
                  >
                    {getCharacteristicLabel(id)}
                  </Box>
                ))}
              </Box>
            )}

            <Stack direction="row" alignItems="center" spacing={2}>
              {/* Bounding the avatar keeps high-resolution photos from stretching the card layout
                  while still reusing shared avatar logic. */}
              <Box
                sx={{
                  height: 40,
                  width: 40,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <PetAvatar
                  name={pet.name}
                  imageUrl={pet.imageUrl ?? null}
                  size="md"
                />
              </Box>

              <Box>
                <Typography
                  variant="h6"
                  component="h3"
                  color="text.primary"
                  sx={{
                    fontFamily: 'serif',
                    fontWeight: 700,
                    lineHeight: 1.1,
                  }}
                >
                  {pet.name}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 500,
                    mt: 0.5,
                    color: 'text.secondary',
                  }}
                >
                  <span>{pet.breed}</span>
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Box>

        {/* BODY */}
        {/* CardContent gives us consistent internal padding and keeps the card
            mobile-first without hard-coded widths. */}
        <CardContent
          sx={{
            px: 2.5,
            py: 2,
          }}
        >
          <Box
            component="dl"
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              rowGap: 1,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'text.secondary',
            }}
          >
            <Box component="div">
              <Typography component="dt" variant="caption">
                Age
              </Typography>
              <Typography
                component="dd"
                variant="body2"
                sx={{ mt: 0.5, fontWeight: 500, textTransform: 'none' }}
                color="text.primary"
              >
                {calculateAge(pet.birthDate)} yrs
              </Typography>
            </Box>

            <Box component="div">
              <Typography component="dt" variant="caption">
                Weight
              </Typography>
              <Typography
                component="dd"
                variant="body2"
                sx={{ mt: 0.5, fontWeight: 500, textTransform: 'none' }}
                color="text.primary"
              >
                {pet.weight} lbs
              </Typography>
            </Box>

            <Box component="div">
              <Typography component="dt" variant="caption">
                Sex
              </Typography>
              <Typography
                component="dd"
                variant="body2"
                sx={{ mt: 0.5, fontWeight: 500, textTransform: 'none' }}
                color="text.primary"
              >
                {pet.gender === 'MALE' ? 'Male' : 'Female'}
              </Typography>
            </Box>
          </Box>

          {/* Last log */}
          {lastLog && (
            <Box
              sx={{
                mt: 2,
                pt: 1.5,
                borderTop: '1px dotted',
                borderColor: 'divider',
                color: 'text.secondary',
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, display: 'inline' }}
                color="text.primary"
              >
                {describeActivity(lastLog, currentUserName)}{' '}
              </Typography>

              {/* Time-ago is client-only to avoid SSR/client drift. */}
              {hasMounted && (
                <Typography
                  variant="body2"
                  component="span"
                  color="text.secondary"
                >
                  {formatTimeAgo(lastLog.createdAt)}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>

        {/* FOOTER */}
        {/* CardActions gives us a predictable action strip; Box wraps it as a semantic footer
            because the CardActions type in this setup doesn't expose a `component` prop. */}
        <Box component="footer">
          <CardActions
            sx={{
              borderTop: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              px: 2.5,
              py: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
            }}
          >
            {/* Quick actions left */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, minmax(0, 1fr))',
                  sm: 'repeat(4, auto)',
                },
                gap: 1,
                width: '100%',
                justifyItems: 'center',
              }}
            >
              <Button
                onClick={() => handleRequestQuickAction('FEED')}
                variant="outlined"
                size="small"
                sx={{
                  textTransform: 'none',
                  width: { xs: '100%', sm: 'auto' },
                  px: { xs: 1, sm: 2 },
                  justifyContent: 'center',
                  minHeight: { xs: 34, sm: 40 },
                  fontSize: { xs: 12, sm: 14 },
                }}
              >
                Feed
              </Button>

              <Button
                onClick={() => handleRequestQuickAction('WALK')}
                variant="outlined"
                size="small"
                sx={{
                  textTransform: 'none',
                  width: { xs: '100%', sm: 'auto' },
                  px: { xs: 1, sm: 2 },
                  justifyContent: 'center',
                  minHeight: { xs: 34, sm: 40 },
                  fontSize: { xs: 12, sm: 14 },
                }}
              >
                Walk
              </Button>

              <Button
                onClick={() => handleRequestQuickAction('MEDICATE')}
                variant="outlined"
                size="small"
                sx={{
                  textTransform: 'none',
                  width: { xs: '100%', sm: 'auto' },
                  px: { xs: 1, sm: 2 },
                  justifyContent: 'center',
                  minHeight: { xs: 34, sm: 40 },
                  fontSize: { xs: 12, sm: 14 },
                }}
              >
                Meds
              </Button>

              <Button
                onClick={() => handleRequestQuickAction('ACCIDENT')}
                variant="outlined"
                size="small"
                color="error"
                sx={{
                  textTransform: 'none',
                  width: { xs: '100%', sm: 'auto' },
                  px: { xs: 1, sm: 2 },
                  justifyContent: 'center',
                  minHeight: { xs: 34, sm: 40 },
                  fontSize: { xs: 12, sm: 14 },
                }}
              >
                Oops
              </Button>
            </Box>

            {/* Details / History */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <Button
                component={Link}
                href={`/pets/${pet.id}`}
                variant="contained"
                size="small"
                sx={{
                  textTransform: 'none',
                  width: { xs: '100%', sm: 'auto' },
                  px: { xs: 1.25, sm: 2.5 },
                  minHeight: { xs: 36, sm: 40 },
                  fontSize: { xs: 12, sm: 14 },
                }}
              >
                + Details
              </Button>

              <Button
                component={Link}
                href={`/pets/${pet.id}/activity`}
                variant="outlined"
                size="small"
                sx={{
                  textTransform: 'none',
                  width: { xs: '100%', sm: 'auto' },
                  px: { xs: 1.25, sm: 2.5 },
                  minHeight: { xs: 36, sm: 40 },
                  fontSize: { xs: 12, sm: 14 },
                }}
              >
                View History
              </Button>
            </Box>
          </CardActions>
        </Box>
      </Card>

      <ConfirmActionModal
        open={isConfirmOpen}
        title={modalTitle}
        body={modalBody}
        confirmLabel={pendingLabel ? `Log ${pendingLabel}` : 'Confirm'}
        cancelLabel="Never mind"
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
    </>
  );
}
