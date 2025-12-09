'use client';

import React from 'react';
import PetAvatar from '@/components/pets/PetAvatar';
import {
  PET_CHARACTERISTICS,
  type PetCharacteristicId,
} from '@/lib/petCharacteristics';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';

type PetData = {
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

type CareLog = {
  id: string;
  activityType: ActionType;
  createdAt: string;
  notes?: string | null;
  user: { name: string | null };
};

type ActionType = 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';

function getCharacteristicLabel(id: PetCharacteristicId): string {
  const meta = PET_CHARACTERISTICS.find((item) => item.id === id);
  return meta ? meta.label : id.toLowerCase().replace(/_/g, ' ');
}

type PetHeaderCardProps = {
  pet: PetData;
};

export default function PetHeaderCard({ pet }: PetHeaderCardProps) {
  // Derives a friendly age label from the birth date while guarding against invalid dates.
  const ageLabel = React.useMemo(() => {
    if (!pet.birthDate) return null;
    const parsed = new Date(pet.birthDate);
    if (Number.isNaN(parsed.getTime())) return null;

    const today = new Date();
    let years = today.getUTCFullYear() - parsed.getUTCFullYear();
    const m = today.getUTCMonth() - parsed.getUTCMonth();
    if (m < 0 || (m === 0 && today.getUTCDate() < parsed.getUTCDate())) {
      years -= 1;
    }
    return `${years} yrs`;
  }, [pet.birthDate]);

  const genderLabel =
    pet.gender?.toLowerCase() === 'male'
      ? 'Male'
      : pet.gender?.toLowerCase() === 'female'
        ? 'Female'
        : null;

  // Collects available metadata into a single line for compact display under the heading.
  const metaLine = [
    pet.breed || null,
    genderLabel,
    ageLabel,
    typeof pet.weight === 'number' && !Number.isNaN(pet.weight)
      ? `${pet.weight} lbs`
      : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <Paper
      elevation={0}
      // MUI Paper handles the card shell styling; Tailwind card class removed to avoid duplication.
      sx={{
        mt: 2,
        p: { xs: 2.5, md: 3 },
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 2.5, md: 3 }}
        alignItems={{ xs: 'center', md: 'flex-start' }}
      >
        {/* Left column keeps avatar and its label aligned with consistent spacing. */}
        <Stack
          spacing={1}
          alignItems={{ xs: 'center', md: 'flex-start' }}
          sx={{ minWidth: { md: 120 } }}
        >
          <PetAvatar
            name={pet.name}
            imageUrl={pet.imageUrl ?? null}
            size="lg"
          />
          <Typography variant="body2" color="text.secondary">
            Pet photo
          </Typography>
        </Stack>

        {/* Right column flows primary pet details and characteristics, stretching to fill space. */}
        <Stack spacing={1.25} flex={1}>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>
            {pet.name}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}
          >
            {pet.breed || pet.type}
          </Typography>

          {metaLine && (
            <Typography variant="body2" color="text.secondary">
              {metaLine}
            </Typography>
          )}

          {Array.isArray(pet.characteristics) &&
            pet.characteristics.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {pet.characteristics.map((id) => (
                  <Chip
                    key={id}
                    label={getCharacteristicLabel(id)}
                    variant="outlined"
                    size="small"
                    sx={{
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontWeight: 700,
                    }}
                  />
                ))}
              </Box>
            )}
        </Stack>
      </Stack>
    </Paper>
  );
}
