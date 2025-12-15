// src/components/pets/PetDetailPage.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PetDetailShell from '@/components/pets/PetDetailShell';
import PetDetailHeaderSection from '@/components/pets/PetDetailHeaderSection';
import PetDetailActivitySection from '@/components/pets/PetDetailActivitySection';
import PetDetailHiveSection from '@/components/pets/PetDetailHiveSection';
import PetDetailProfileSection from '@/components/pets/PetDetailProfileSection';
import {
  Box,
  Typography,
  Button,
} from '@mui/material';
import { type PetCharacteristicId } from '@/lib/petCharacteristics';
import type { HiveMember, PetData } from './petDetailTypes'; // The detail page now consumes a fully-shaped view model instead of raw Prisma data.

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
  careCircleMembers: HiveMember[];
  // This flags whether the current user owns the pet so we can gate owner-only actions.
  isOwner?: boolean;
};

// page --------------------------------------------------------
export default function PetDetailPage({
  pet: petProp,
  careCircleMembers: careCircleMembersProp,
  isOwner: isOwnerProp = false,
}: PetDetailPageProps) {
  const router = useRouter();

  // Pet state now starts from a normalized view model coming from the server loader.
  // This keeps all Prisma-specific quirks on the server side.
  const [pet, setPet] = useState<PetData | null>(petProp ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [careCircleMembers, setCareCircleMembers] = useState<HiveMember[]>(
    Array.isArray(careCircleMembersProp) ? careCircleMembersProp : [],
  );
  const [isOwner, setIsOwner] = useState<boolean>(Boolean(isOwnerProp));

  useEffect(() => {
    // Whenever the server sends updated pet data, we trust that as the source of truth.
    setPet(petProp ?? null);
    setError(null);
    setLoading(false);
  }, [petProp]);

  useEffect(() => {
    setCareCircleMembers(
      Array.isArray(careCircleMembersProp) ? careCircleMembersProp : [],
    );
  }, [careCircleMembersProp]);

  useEffect(() => {
    setIsOwner(Boolean(isOwnerProp));
  }, [isOwnerProp]);

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
    <PetDetailShell>
      {/* Header section stays separate so navigation and primary pet summary remain isolated from detail areas. */}
      <PetDetailHeaderSection
        pet={pet}
        onBack={() => router.back()}
      />

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
        initialMembers={careCircleMembers}
      />
    </PetDetailShell>
  );
}
