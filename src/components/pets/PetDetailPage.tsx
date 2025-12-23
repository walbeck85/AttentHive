// src/components/pets/PetDetailPage.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PetType, ActivityType } from '@prisma/client';
import PetDetailShell from '@/components/pets/PetDetailShell';
import PetDetailHeaderSection from '@/components/pets/PetDetailHeaderSection';
import PetDetailActivitySection from '@/components/pets/PetDetailActivitySection';
import PetDetailHiveSection from '@/components/pets/PetDetailHiveSection';
import PetDetailProfileSection from '@/components/pets/PetDetailProfileSection';
import QuickActions from './QuickActions';
import ConfirmActionModal from './ConfirmActionModal';
import WalkTimerModal from './WalkTimerModal';
import BathroomModal, { type BathroomMetadata } from './BathroomModal';
import AccidentModal, { type AccidentMetadata } from './AccidentModal';
import {
  Box,
  Typography,
  Button,
} from '@mui/material';
import { type PetCharacteristicId } from '@/lib/petCharacteristics';
import type { HiveMember, CareLog, PetData } from './petDetailTypes';
import type { WalkMetadata } from './petActivityUtils';
import { type ActivityConfig, getActivityLabel } from '@/config/activityTypes';

// Re-exporting these so other components can keep importing view types from here if needed.
export type { HiveMember, CareCircleMember, CareLog, PetData } from './petDetailTypes';

// Edit form state is intentionally string-based so the inputs
// stay in sync with what the user is typing.
export type EditFormState = {
  name: string;
  type: 'DOG' | 'CAT';
  breed: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  weight: string;
  description: string;
  specialNotes: string;
  characteristics: PetCharacteristicId[];
};

export type EditFieldErrors = Partial<Record<keyof EditFormState, string>>;

// Props are now based on the view models defined in petDetailTypes.
// This keeps the UI focused on rendering instead of reshaping server data.
type PetDetailPageProps = {
  pet: PetData;
  hiveMembers: HiveMember[];
  // This flags whether the current user owns the pet so we can gate owner-only actions.
  isOwner?: boolean;
  // The current user's role determines which actions they can perform.
  currentUserRole: 'OWNER' | 'CAREGIVER' | 'VIEWER';
};

export default function PetDetailPage({
  pet: petProp,
  hiveMembers: hiveMembersProp,
  isOwner: isOwnerProp = false,
  currentUserRole,
}: PetDetailPageProps) {
  const router = useRouter();

  // Pet state now starts from a normalized view model coming from the server loader.
  // This keeps all Prisma-specific quirks on the server side.
  const [pet, setPet] = useState<PetData | null>(petProp ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hiveMembers, setHiveMembers] = useState<HiveMember[]>(
    Array.isArray(hiveMembersProp) ? hiveMembersProp : [],
  );
  const [isOwner, setIsOwner] = useState<boolean>(Boolean(isOwnerProp));

  // Modal state - now tracks which modal type to show
  const [pendingConfig, setPendingConfig] = useState<ActivityConfig | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isWalkTimerOpen, setIsWalkTimerOpen] = useState(false);
  const [isBathroomOpen, setIsBathroomOpen] = useState(false);
  const [isAccidentOpen, setIsAccidentOpen] = useState(false);

  // Only OWNER and CAREGIVER can log care actions
  const canLogCareActions = currentUserRole === 'OWNER' || currentUserRole === 'CAREGIVER';

  // Derive pet type for QuickActions filtering
  const petType: PetType = (pet?.type as PetType) ?? 'DOG';

  useEffect(() => {
    // Whenever the server sends updated pet data, we trust that as the source of truth.
    setPet(petProp ?? null);
    setError(null);
    setLoading(false);
  }, [petProp]);

  useEffect(() => {
    setHiveMembers(
      Array.isArray(hiveMembersProp) ? hiveMembersProp : [],
    );
  }, [hiveMembersProp]);

  useEffect(() => {
    setIsOwner(Boolean(isOwnerProp));
  }, [isOwnerProp]);

  // Route action to the correct modal based on modalType
  const handleQuickAction = (config: ActivityConfig) => {
    setPendingConfig(config);

    switch (config.modalType) {
      case 'timer':
        setIsWalkTimerOpen(true);
        break;
      case 'bathroom':
        setIsBathroomOpen(true);
        break;
      case 'accident':
        setIsAccidentOpen(true);
        break;
      case 'confirm':
      default:
        setIsConfirmOpen(true);
        break;
    }
  };

  // Generic function to log activity with optional metadata
  const logActivity = async (
    activityType: ActivityType,
    metadata?: Record<string, unknown> | null
  ) => {
    if (!pet) return;

    try {
      const res = await fetch('/api/care-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: pet.id,
          activityType,
          metadata: metadata ?? undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Failed to log care activity', data);
        return;
      }

      // Add the new care log to the local state so UI updates immediately
      const newCareLog: CareLog = {
        id: data.log?.id ?? crypto.randomUUID(),
        activityType: activityType as CareLog['activityType'],
        createdAt: new Date().toISOString(),
        notes: null,
        metadata: metadata as CareLog['metadata'],
        user: { name: data.log?.user?.name ?? null },
      };
      setPet((prev) =>
        prev ? { ...prev, careLogs: [newCareLog, ...prev.careLogs] } : prev
      );
    } catch (err) {
      console.error('Error while logging care activity', err);
    }
  };

  // Confirm modal handler (FEED, MEDICATE, LITTER_BOX, WELLNESS_CHECK)
  const handleConfirmAction = async () => {
    if (!pendingConfig || !pet) return;

    await logActivity(pendingConfig.type);
    setIsConfirmOpen(false);
    setPendingConfig(null);
  };

  const handleCancelConfirm = () => {
    setIsConfirmOpen(false);
    setPendingConfig(null);
  };

  // Walk timer handler
  const handleWalkComplete = async (metadata: WalkMetadata) => {
    await logActivity('WALK', metadata);
    setIsWalkTimerOpen(false);
    setPendingConfig(null);
  };

  const handleWalkCancel = () => {
    setIsWalkTimerOpen(false);
    setPendingConfig(null);
  };

  // Bathroom modal handler
  const handleBathroomConfirm = async (metadata: BathroomMetadata) => {
    await logActivity('BATHROOM', metadata);
    setIsBathroomOpen(false);
    setPendingConfig(null);
  };

  const handleBathroomClose = () => {
    setIsBathroomOpen(false);
    setPendingConfig(null);
  };

  // Accident modal handler
  const handleAccidentConfirm = async (metadata: AccidentMetadata) => {
    await logActivity('ACCIDENT', metadata);
    setIsAccidentOpen(false);
    setPendingConfig(null);
  };

  const handleAccidentClose = () => {
    setIsAccidentOpen(false);
    setPendingConfig(null);
  };

  // Modal content for confirmation dialog
  const pendingLabel = pendingConfig ? getActivityLabel(pendingConfig.type) : '';
  const modalTitle = pendingConfig && pet
    ? `Log ${pendingLabel.toLowerCase()} for ${pet.name}?`
    : '';
  const modalBody = pendingConfig && pet
    ? `This will add a "${pendingLabel}" entry to ${pet.name}'s activity log.`
    : '';

  if (loading) {
    return (
      <Box
        component="main"
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Loading pet details…
        </Typography>
      </Box>
    );
  }

  if (error || !pet) {
    return (
      <Box
        component="main"
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          px: 2,
        }}
      >
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
          Failed to load pet details
        </Typography>
        {error && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center' }}
          >
            {error}
          </Typography>
        )}
        <Button
          type="button"
          onClick={() => router.push('/dashboard')}
          variant="contained"
          size="small"
          sx={{
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontWeight: 600,
          }}
        >
          Back to dashboard
        </Button>
      </Box>
    );
  }

  return (
    <>
      <PetDetailShell>
        <PetDetailHeaderSection
          pet={pet}
          onBack={() => router.back()}
        />

        {/* QuickActions for logging care activities - filtered by pet type */}
        {canLogCareActions && (
          <Box sx={{ px: { xs: 2, sm: 0 }, mb: 2 }}>
            <QuickActions petType={petType} onAction={handleQuickAction} />
          </Box>
        )}

        <PetDetailProfileSection
          pet={pet}
          setPet={setPet}
        />

        <PetDetailActivitySection careLogs={pet.careLogs} />

        <PetDetailHiveSection
          recipientId={pet.id}
          isOwner={isOwner}
          initialMembers={hiveMembers}
        />
      </PetDetailShell>

      {/* Confirmation modal for simple actions (FEED, MEDICATE, LITTER_BOX, WELLNESS_CHECK) */}
      <ConfirmActionModal
        open={isConfirmOpen}
        title={modalTitle}
        body={modalBody}
        confirmLabel="Log Activity"
        onConfirm={handleConfirmAction}
        onCancel={handleCancelConfirm}
      />

      {/* Walk timer modal with bathroom event tracking */}
      <WalkTimerModal
        isOpen={isWalkTimerOpen}
        petId={pet.id}
        petName={pet.name}
        onComplete={handleWalkComplete}
        onCancel={handleWalkCancel}
      />

      {/* Bathroom modal with pee/poo selection */}
      <BathroomModal
        open={isBathroomOpen}
        petName={pet.name}
        onConfirm={handleBathroomConfirm}
        onClose={handleBathroomClose}
      />

      {/* Accident modal with pee/poo/vomit selection */}
      <AccidentModal
        open={isAccidentOpen}
        petName={pet.name}
        onConfirm={handleAccidentConfirm}
        onClose={handleAccidentClose}
      />
    </>
  );
}
