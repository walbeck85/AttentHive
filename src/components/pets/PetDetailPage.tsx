// src/components/pets/PetDetailPage.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CareCirclePanel from '@/components/pets/CareCirclePanel';
import PetActivityList from '@/components/pets/PetActivityList';
import PetHeaderCard from '@/components/pets/PetHeaderCard';
import PetPhotoProfileCard from '@/components/pets/PetPhotoProfileCard';
import { type PetCharacteristicId } from '@/lib/petCharacteristics';
import type { ActionType } from '@/components/pets/petActivityUtils';
import {
  Box,
  Container,
  Stack,
  Paper,
  Typography,
  Button,
} from '@mui/material';
import type { CareCircleMember } from './petDetailTypes'; // Route and UI now share this Care Circle view model.

// Re-exporting so existing imports from PetDetailPage keep working without churn.
export type { CareCircleMember } from './petDetailTypes';

// Local view types for the pet detail screen.
// These are deliberately decoupled from Prisma so the UI doesn't break
// every time the DB models or enum names shift.
type PetForDetail = {
  id: string;
  name: string;
  type: string;
  // The UI may read more fields (birthDate, weight, etc.); we allow them via index signature.
  [key: string]: unknown;
};

type CareLogForDetail = {
  id: string;
  recipientId: string;
  createdAt: Date;
  userId: string;
  activityType: string; // underlying enum value, but treated as string here
  notes: string | null;
  user?: { name: string } | null;
  [key: string]: unknown;
};

// Using Prisma model types here keeps this component aligned with the DB schema
// and lets us avoid any while still getting strong typing for the main records.
type PetDetailPageProps = {
  pet: PetForDetail;
  careLogs: CareLogForDetail[];
  careCircleMembers: CareCircleMember[];
  // This is used later in the parameter destructuring as isOwner: isOwnerProp = false
  isOwner?: boolean;
};

export type CareLog = {
  id: string;
  activityType: ActionType;
  createdAt: string;
  notes?: string | null;
  user: { name: string | null };
};

// Slim view to keep this UI independent from the full Prisma models.
export type PetData = {
  id: string;
  name: string;
  type: string;
  breed: string;
  gender: string;
  birthDate: string;
  weight: number;
  careLogs: CareLog[];
  ownerId?: string;
  imageUrl?: string | null;
  characteristics?: PetCharacteristicId[];
};

// Edit form state is intentionally string-based so the inputs
// stay in sync with what the user is typing.
export type EditFormState = {
  name: string;
  type: 'DOG' | 'CAT';
  breed: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  weight: string;
  characteristics: PetCharacteristicId[];
};

export type EditFieldErrors = Partial<Record<keyof EditFormState, string>>;

function validateEditForm(data: EditFormState): EditFieldErrors {
  const errors: EditFieldErrors = {};

  if (!data.name.trim()) {
    errors.name = 'Name is required.';
  }
  if (!data.breed.trim()) {
    errors.breed = 'Breed is required.';
  }
  if (!data.birthDate) {
    errors.birthDate = 'Birth date is required.';
  }
  if (!data.weight.trim()) {
    errors.weight = 'Weight is required.';
  } else {
    const val = parseFloat(data.weight);
    if (Number.isNaN(val) || val <= 0) {
      errors.weight = 'Enter a valid weight greater than 0.';
    }
  }

  return errors;
}

// page --------------------------------------------------------
export default function PetDetailPage({
  pet: petProp,
  careLogs: careLogsProp,
  careCircleMembers: careCircleMembersProp,
  isOwner: isOwnerProp = false,
}: PetDetailPageProps) {
  const router = useRouter();

  const normalizedCareLogs = Array.isArray(careLogsProp) ? careLogsProp : [];
  const initialPetState = petProp
    ? ({
        ...petProp,
        careLogs:
          normalizedCareLogs.length > 0
            ? normalizedCareLogs
            : petProp.careLogs ?? [],
      } as PetData)
    : null;

  const [pet, setPet] = useState<PetData | null>(initialPetState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [careCircleMembers, setCareCircleMembers] = useState<CareCircleMember[]>(
    Array.isArray(careCircleMembersProp) ? careCircleMembersProp : [],
  );
  const [isOwner, setIsOwner] = useState<boolean>(Boolean(isOwnerProp));

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<EditFieldErrors>({});
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    const normalizedPet = petProp
      ? ({
          ...petProp,
          careLogs:
            Array.isArray(careLogsProp) && careLogsProp.length >= 0
              ? careLogsProp
              : petProp.careLogs ?? [],
        } as PetData)
      : null;

    setPet(normalizedPet);
    setError(null);
    setLoading(false);
  }, [petProp, careLogsProp]);

  useEffect(() => {
    setCareCircleMembers(
      Array.isArray(careCircleMembersProp) ? careCircleMembersProp : [],
    );
  }, [careCircleMembersProp]);

  useEffect(() => {
    setIsOwner(Boolean(isOwnerProp));
  }, [isOwnerProp]);

  const handleStartEditProfile = () => {
    if (!pet) return;

    const birthDate = pet.birthDate ? pet.birthDate.slice(0, 10) : '';

    setEditForm({
      name: pet.name,
      type: (pet.type as 'DOG' | 'CAT') ?? 'DOG',
      breed: pet.breed,
      gender: (pet.gender as 'MALE' | 'FEMALE') ?? 'MALE',
      birthDate,
      weight: pet.weight.toString(),
      characteristics: Array.isArray(pet.characteristics)
        ? pet.characteristics
        : [],
    });
    setEditFieldErrors({});
    setEditError(null);
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    setIsEditingProfile(false);
    setEditForm(null);
    setEditFieldErrors({});
    setEditError(null);
  };

  const updateEditField = <K extends keyof EditFormState>(
    key: K,
    value: EditFormState[K],
  ) => {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setEditFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleToggleCharacteristic = (id: PetCharacteristicId) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      const isSelected = prev.characteristics.includes(id);
      return {
        ...prev,
        characteristics: isSelected
          ? prev.characteristics.filter((existing) => existing !== id)
          : [...prev.characteristics, id],
      };
    });
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pet || !editForm) return;

    setIsSavingProfile(true);
    setEditError(null);

    const errors = validateEditForm(editForm);
    if (Object.keys(errors).length > 0) {
      setEditFieldErrors(errors);
      setIsSavingProfile(false);
      return;
    }

    const numericWeight = parseFloat(editForm.weight);

    try {
      const res = await fetch(`/api/pets/${pet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          type: editForm.type,
          breed: editForm.breed.trim(),
          gender: editForm.gender,
          birthDate: editForm.birthDate,
          weight: numericWeight,
          characteristics: editForm.characteristics,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const fieldErrors: EditFieldErrors = {};
        if (Array.isArray(data.validationErrors)) {
          for (const issue of data.validationErrors) {
            if (issue && issue.field && issue.message) {
              const field = issue.field as keyof EditFormState;
              if (field in editForm) {
                fieldErrors[field] = issue.message as string;
              }
            }
          }
        }
        if (Object.keys(fieldErrors).length > 0) {
          setEditFieldErrors(fieldErrors);
        }

        throw new Error(data.error || 'Failed to update pet');
      }

      setPet((prev) => {
        if (!prev) return data.pet;
        return { ...prev, ...data.pet };
      });

      setIsEditingProfile(false);
      setEditForm(null);
      setEditFieldErrors({});
      setEditError(null);
    } catch (err) {
      console.error('Error updating pet profile', err);
      setEditError(
        err instanceof Error ? err.message : 'Failed to update pet',
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

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
        <Typography variant="body2" color="text.secondary" className="mm-muted">
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
        <Typography variant="h6" sx={{ color: '#382110', fontWeight: 600 }}>
          Failed to load pet details
        </Typography>
        {error && (
          <Typography
            variant="body2"
            color="text.secondary"
            className="mm-muted text-sm"
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
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Back to dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box
      component="main"
      className="mm-page"
      sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        minHeight: '100vh',
        py: { xs: 3, md: 4 },
      }}
    >
      <Container maxWidth="lg" className="mm-shell">
        <Stack spacing={3.5}>
          <Box component="section" className="mm-section">
            <Button
              type="button"
              onClick={() => router.back()}
              variant="text"
              size="small"
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 999,
                textTransform: 'none',
                fontSize: 13,
              }}
            >
              ← Back
            </Button>

            <PetHeaderCard pet={pet} />
          </Box>

          <PetPhotoProfileCard
            pet={pet}
            isEditingProfile={isEditingProfile}
            isSavingProfile={isSavingProfile}
            editForm={editForm}
            editFieldErrors={editFieldErrors}
            editError={editError}
            onStartEditProfile={handleStartEditProfile}
            onCancelEditProfile={handleCancelEditProfile}
            onProfileSave={handleProfileSave}
            onUpdateEditField={updateEditField}
            onToggleCharacteristic={handleToggleCharacteristic}
            onPhotoUploaded={(imageUrl) =>
              setPet((prev) => (prev ? { ...prev, imageUrl } : prev))
            }
          />

          <Box component="section" className="mm-section">
            <Paper
              elevation={0}
              className="mm-card"
              sx={{
                px: { xs: 2.5, md: 3 },
                py: 2.5,
                borderRadius: (theme) => {
                  const radius = theme.shape.borderRadius;
                  // We normalize borderRadius to a number so we can safely scale it without TS complaining.
                  return (typeof radius === 'number'
                    ? radius
                    : parseFloat(radius as string)) * 2;
                },
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <PetActivityList careLogs={pet.careLogs} />
            </Paper>
          </Box>

          <Box component="section" id="care-circle" className="mm-section">
            <CareCirclePanel
              recipientId={pet.id}
              isOwner={isOwner}
              initialMembers={careCircleMembers}
            />
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}