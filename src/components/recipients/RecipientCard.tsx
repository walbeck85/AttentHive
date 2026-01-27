'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RecipientCategory } from '@prisma/client';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Stack,
  Typography,
  Button,
  Chip,
} from '@mui/material';
import PetAvatar from '../pets/PetAvatar';
import QuickActions from '../pets/QuickActions';
import ConfirmActionModal from '../pets/ConfirmActionModal';
import { VetVisitModal, DoctorModal, MedicateModal, AppointmentModal, WaterModal, GroomingModal } from '../activity';
import { type ActivityConfig, getActivityLabel } from '@/config/activityTypes';

// Type for recipients from the database
export type RecipientData = {
  id: string;
  name: string;
  category: RecipientCategory;
  // Pet fields
  subtype?: string | null;
  breed?: string | null;
  // Plant fields
  plantSpecies?: string | null;
  // Person fields
  relationship?: string | null;
  // Common fields
  imageUrl?: string | null;
  _accessType?: 'owner' | 'shared';
};

type Props = {
  recipient: RecipientData;
};

// Helper to format the category label
function getCategoryLabel(category: RecipientCategory): string {
  switch (category) {
    case 'PET':
      return 'Pet';
    case 'PLANT':
      return 'Plant';
    case 'PERSON':
      return 'Person';
    default:
      return 'Unknown';
  }
}

// Helper to get category color
function getCategoryColor(category: RecipientCategory): 'primary' | 'success' | 'secondary' {
  switch (category) {
    case 'PET':
      return 'primary';
    case 'PLANT':
      return 'success';
    case 'PERSON':
      return 'secondary';
    default:
      return 'primary';
  }
}

// Helper to format subtype for display
function formatSubtype(subtype: string | null | undefined): string {
  if (!subtype) return '';
  // Convert SMALL_MAMMAL -> Small Mammal, DOG -> Dog, etc.
  return subtype
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper to get the secondary info based on category
function getSecondaryInfo(recipient: RecipientData): string {
  switch (recipient.category) {
    case 'PET':
      if (recipient.breed) {
        return recipient.breed;
      }
      return formatSubtype(recipient.subtype);
    case 'PLANT':
      return recipient.plantSpecies || formatSubtype(recipient.subtype) || 'Plant';
    case 'PERSON':
      return recipient.relationship || formatSubtype(recipient.subtype) || '';
    default:
      return '';
  }
}

// Helper to get the detail page URL
function getDetailUrl(recipient: RecipientData): string {
  // For now, all recipients use the /pets/[id] route
  // This can be updated when separate routes are created
  return `/pets/${recipient.id}`;
}

export default function RecipientCard({ recipient }: Props) {
  const secondaryInfo = getSecondaryInfo(recipient);
  const categoryLabel = getCategoryLabel(recipient.category);
  const categoryColor = getCategoryColor(recipient.category);

  // Modal state for quick actions
  const [pendingAction, setPendingAction] = useState<ActivityConfig | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Specialized modal states
  const [isVetVisitOpen, setIsVetVisitOpen] = useState(false);
  const [isDoctorOpen, setIsDoctorOpen] = useState(false);
  const [isMedicateOpen, setIsMedicateOpen] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isWaterOpen, setIsWaterOpen] = useState(false);
  const [isGroomingOpen, setIsGroomingOpen] = useState(false);

  const handleAction = (config: ActivityConfig) => {
    // Route to specialized modals based on action type
    switch (config.type) {
      case 'VET_VISIT':
        setIsVetVisitOpen(true);
        break;
      case 'DOCTOR_VISIT':
        setIsDoctorOpen(true);
        break;
      case 'MEDICATE':
        setIsMedicateOpen(true);
        break;
      case 'APPOINTMENT':
        setIsAppointmentOpen(true);
        break;
      case 'WATER':
        setIsWaterOpen(true);
        break;
      case 'GROOMING':
        setIsGroomingOpen(true);
        break;
      default:
        // Use generic confirm modal for other actions
        setPendingAction(config);
        setIsConfirmOpen(true);
        break;
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/care-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: recipient.id,
          activityType: pendingAction.type,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error('Failed to log activity', data);
      }
    } catch (err) {
      console.error('Error logging activity', err);
    } finally {
      setIsLoading(false);
      setIsConfirmOpen(false);
      setPendingAction(null);
    }
  };

  const handleCancelAction = () => {
    setIsConfirmOpen(false);
    setPendingAction(null);
  };

  // Success handler for specialized modals (can be used for UI feedback if needed)
  const handleModalSuccess = () => {
    // Could add toast notification or refresh data here
  };

  const pendingLabel = pendingAction ? getActivityLabel(pendingAction.type) : '';
  const modalTitle = pendingAction
    ? `Log ${pendingLabel.toLowerCase()} for ${recipient.name}?`
    : '';
  const modalBody = pendingAction
    ? `This will add a "${pendingLabel}" entry to ${recipient.name}'s activity log.`
    : '';

  return (
    <Card
      component="article"
      elevation={0}
      sx={{
        borderRadius: 2,
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        height: '100%',
      }}
    >
      {/* HEADER */}
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
        <Stack spacing={1.5}>
          {/* Category chip */}
          <Box>
            <Chip
              label={categoryLabel}
              size="small"
              color={categoryColor}
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 22 }}
            />
            {recipient._accessType === 'shared' && (
              <Chip
                label="Shared"
                size="small"
                variant="outlined"
                sx={{ ml: 0.5, fontSize: '0.7rem', height: 22 }}
              />
            )}
          </Box>

          <Stack direction="row" alignItems="center" spacing={2}>
            {/* Avatar */}
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
                name={recipient.name}
                imageUrl={recipient.imageUrl ?? null}
                size="md"
              />
            </Box>

            <Box>
              <Typography
                variant="h6"
                component="h3"
                color="text.primary"
              >
                {recipient.name}
              </Typography>
              {secondaryInfo && (
                <Typography
                  variant="subtitle2"
                  sx={{ mt: 0.5 }}
                  color="text.secondary"
                >
                  {secondaryInfo}
                </Typography>
              )}
            </Box>
          </Stack>
        </Stack>
      </Box>

      {/* BODY - Category-specific info */}
      <CardContent
        sx={{
          px: 2.5,
          py: 2,
          flexGrow: 1,
        }}
      >
        <Box
          component="dl"
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            rowGap: 1,
            color: 'text.secondary',
          }}
        >
          {recipient.category === 'PET' && (
            <>
              <Box component="div">
                <Typography component="dt" variant="overline">
                  Type
                </Typography>
                <Typography
                  component="dd"
                  variant="subtitle2"
                  sx={{ mt: 0.5 }}
                  color="text.primary"
                >
                  {formatSubtype(recipient.subtype) || '—'}
                </Typography>
              </Box>
              <Box component="div">
                <Typography component="dt" variant="overline">
                  Breed
                </Typography>
                <Typography
                  component="dd"
                  variant="subtitle2"
                  sx={{ mt: 0.5 }}
                  color="text.primary"
                >
                  {recipient.breed || '—'}
                </Typography>
              </Box>
            </>
          )}

          {recipient.category === 'PLANT' && (
            <>
              <Box component="div">
                <Typography component="dt" variant="overline">
                  Type
                </Typography>
                <Typography
                  component="dd"
                  variant="subtitle2"
                  sx={{ mt: 0.5 }}
                  color="text.primary"
                >
                  {formatSubtype(recipient.subtype) || '—'}
                </Typography>
              </Box>
              <Box component="div">
                <Typography component="dt" variant="overline">
                  Species
                </Typography>
                <Typography
                  component="dd"
                  variant="subtitle2"
                  sx={{ mt: 0.5 }}
                  color="text.primary"
                >
                  {recipient.plantSpecies || '—'}
                </Typography>
              </Box>
            </>
          )}

          {recipient.category === 'PERSON' && (
            <>
              <Box component="div">
                <Typography component="dt" variant="overline">
                  Type
                </Typography>
                <Typography
                  component="dd"
                  variant="subtitle2"
                  sx={{ mt: 0.5 }}
                  color="text.primary"
                >
                  {formatSubtype(recipient.subtype) || '—'}
                </Typography>
              </Box>
              <Box component="div">
                <Typography component="dt" variant="overline">
                  Relationship
                </Typography>
                <Typography
                  component="dd"
                  variant="subtitle2"
                  sx={{ mt: 0.5 }}
                  color="text.primary"
                >
                  {recipient.relationship || '—'}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </CardContent>

      {/* FOOTER */}
      <Box component="footer">
        <CardActions
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            px: 2.5,
            py: 2,
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {/* Quick Actions - dynamic based on subtype */}
          {recipient.subtype && (
            <QuickActions
              subtype={recipient.subtype}
              onAction={handleAction}
            />
          )}

          <Button
            component={Link}
            href={getDetailUrl(recipient)}
            variant="contained"
            size="small"
            sx={{
              textTransform: 'none',
              px: 2.5,
            }}
          >
            View Details
          </Button>
        </CardActions>
      </Box>

      {/* Generic Confirm Action Modal */}
      <ConfirmActionModal
        open={isConfirmOpen}
        title={modalTitle}
        body={modalBody}
        confirmLabel={pendingLabel ? `Log ${pendingLabel}` : 'Confirm'}
        cancelLabel="Cancel"
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
        isLoading={isLoading}
      />

      {/* Specialized Medical Modals */}
      <VetVisitModal
        open={isVetVisitOpen}
        recipientId={recipient.id}
        recipientName={recipient.name}
        onSuccess={handleModalSuccess}
        onClose={() => setIsVetVisitOpen(false)}
      />

      <DoctorModal
        open={isDoctorOpen}
        recipientId={recipient.id}
        recipientName={recipient.name}
        onSuccess={handleModalSuccess}
        onClose={() => setIsDoctorOpen(false)}
      />

      <MedicateModal
        open={isMedicateOpen}
        recipientId={recipient.id}
        recipientName={recipient.name}
        onSuccess={handleModalSuccess}
        onClose={() => setIsMedicateOpen(false)}
      />

      <AppointmentModal
        open={isAppointmentOpen}
        recipientId={recipient.id}
        recipientName={recipient.name}
        onSuccess={handleModalSuccess}
        onClose={() => setIsAppointmentOpen(false)}
      />

      <WaterModal
        open={isWaterOpen}
        recipientId={recipient.id}
        recipientName={recipient.name}
        onSuccess={handleModalSuccess}
        onClose={() => setIsWaterOpen(false)}
      />

      <GroomingModal
        open={isGroomingOpen}
        recipientId={recipient.id}
        recipientName={recipient.name}
        onSuccess={handleModalSuccess}
        onClose={() => setIsGroomingOpen(false)}
      />
    </Card>
  );
}
