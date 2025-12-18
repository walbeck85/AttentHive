// src/components/pets/PetDetailPage.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PetDetailShell from '@/components/pets/PetDetailShell';
import PetDetailHeaderSection from '@/components/pets/PetDetailHeaderSection';
import PetDetailActivitySection from '@/components/pets/PetDetailActivitySection';
import PetDetailHiveSection from '@/components/pets/PetDetailHiveSection';
import PetDetailProfileSection from '@/components/pets/PetDetailProfileSection';
import QuickActions from './QuickActions';
import ConfirmActionModal from './ConfirmActionModal';
import WalkTimerModal from './WalkTimerModal';
import {
  Box,
  Typography,
  Button,
} from '@mui/material';
import { type PetCharacteristicId } from '@/lib/petCharacteristics';
import type { HiveMember, CareLog, PetData } from './petDetailTypes'; // The detail page now consumes a fully-shaped view model instead of raw Prisma data.
import type { ActionType, WalkMetadata } from './petActivityUtils';

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

// Map for nicer labels in the modal
const ACTION_LABELS: Record<ActionType, string> = {
  FEED: 'Feed',
  WALK: 'Walk',
  MEDICATE: 'Medicate',
  ACCIDENT: 'Accident',
};

// page --------------------------------------------------------
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

  // QuickActions modal state
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isWalkTimerOpen, setIsWalkTimerOpen] = useState(false);

  // Only OWNER and CAREGIVER can log care actions
  const canLogCareActions = currentUserRole === 'OWNER' || currentUserRole === 'CAREGIVER';

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

  // QuickActions handlers
  const handleQuickAction = (action: ActionType) => {
    if (action === 'WALK') {
      setIsWalkTimerOpen(true);
      return;
    }
    setPendingAction(action);
    setIsConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction || !pet) return;

    try {
      const res = await fetch('/api/care-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: pet.id,
          activityType: pendingAction,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Failed to log care activity', data);
        return;
      }

      // Add the new care log to the local state so UI updates immediately
      const newCareLog: CareLog = {
        id: data.id ?? crypto.randomUUID(),
        activityType: pendingAction,
        createdAt: new Date().toISOString(),
        notes: null,
        metadata: null,
        user: { name: data.user?.name ?? null },
      };
      setPet((prev) =>
        prev ? { ...prev, careLogs: [newCareLog, ...prev.careLogs] } : prev
      );
    } catch (err) {
      console.error('Error while logging care activity', err);
    } finally {
      setIsConfirmOpen(false);
      setPendingAction(null);
    }
  };

  const handleCancelAction = () => {
    setIsConfirmOpen(false);
    setPendingAction(null);
  };

  const handleWalkComplete = async (metadata: WalkMetadata) => {
    if (!pet) return;

    try {
      const res = await fetch('/api/care-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId: pet.id,
          activityType: 'WALK',
          metadata,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Failed to log walk', data);
        return;
      }

      // Add the new walk log to the local state
      const newCareLog: CareLog = {
        id: data.id ?? crypto.randomUUID(),
        activityType: 'WALK',
        createdAt: new Date().toISOString(),
        notes: null,
        metadata,
        user: { name: data.user?.name ?? null },
      };
      setPet((prev) =>
        prev ? { ...prev, careLogs: [newCareLog, ...prev.careLogs] } : prev
      );
    } catch (err) {
      console.error('Error while logging walk', err);
    } finally {
      setIsWalkTimerOpen(false);
    }
  };

  const handleWalkCancel = () => {
    setIsWalkTimerOpen(false);
  };

  // Modal content for confirmation dialog
  const pendingLabel = pendingAction ? ACTION_LABELS[pendingAction] : '';
  const modalTitle = pendingAction && pet
    ? `Log ${pendingLabel.toLowerCase()} for ${pet.name}?`
    : '';
  const modalBody = pendingAction && pet
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
        {/* Loading fallback keeps typography consistent via MUI variants while matching the subdued text tone. */}
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
        {/* Error header leans on the theme text color so it adapts automatically in both light and dark palettes. */}
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
        {/* Header section stays separate so navigation and primary pet summary remain isolated from detail areas. */}
        <PetDetailHeaderSection
          pet={pet}
          onBack={() => router.back()}
        />

        {/* QuickActions for logging care activities - only visible to owners and caregivers */}
        {canLogCareActions && (
          <Box sx={{ px: { xs: 2, sm: 0 }, mb: 2 }}>
            <QuickActions onAction={handleQuickAction} />
          </Box>
        )}

        {/* Profile section manages editable pet fields while sharing the same pet state. */}
        <PetDetailProfileSection
          pet={pet}
          setPet={setPet}
        />

        {/* Activity section is read-only; leaving layout to the child keeps this wrapper lightweight. */}
        <PetDetailActivitySection careLogs={pet.careLogs} />

        {/* Hive relies on the latest membership state; keeping it last mirrors the page stacking order. */}
        <PetDetailHiveSection
          recipientId={pet.id}
          isOwner={isOwner}
          initialMembers={hiveMembers}
        />
      </PetDetailShell>

      {/* Confirmation modal for non-walk actions */}
      <ConfirmActionModal
        open={isConfirmOpen}
        title={modalTitle}
        body={modalBody}
        confirmLabel="Log Activity"
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />

      {/* Walk timer modal with bathroom event tracking */}
      <WalkTimerModal
        isOpen={isWalkTimerOpen}
        petId={pet.id}
        petName={pet.name}
        onComplete={handleWalkComplete}
        onCancel={handleWalkCancel}
      />
    </>
  );
}
