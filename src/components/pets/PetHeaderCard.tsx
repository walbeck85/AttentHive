'use client';

import React from 'react';
import PetAvatar from '@/components/pets/PetAvatar';
import {
  PET_CHARACTERISTICS,
  type PetCharacteristicId,
} from '@/lib/petCharacteristics';
import { Box, Paper, Stack, Typography } from '@mui/material';

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

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getCharacteristicLabel(id: PetCharacteristicId): string {
  const meta = PET_CHARACTERISTICS.find((item) => item.id === id);
  return meta ? meta.label : id.toLowerCase().replace(/_/g, ' ');
}

function getCharacteristicClasses(id: PetCharacteristicId): string {
  switch (id) {
    case 'AGGRESSIVE':
      return 'border-[#F97373] bg-[#FEF2F2] text-[#B91C1C]';
    case 'REACTIVE':
      return 'border-[#FB923C] bg-[#FFF7ED] text-[#C05621]';
    case 'SHY':
      return 'border-[#A78BFA] bg-[#F5F3FF] text-[#5B21B6]';
    case 'MOBILITY_ISSUES':
      return 'border-[#2DD4BF] bg-[#ECFEFF] text-[#0F766E]';
    case 'BLIND':
      return 'border-[#9CA3AF] bg-[#F3F4F6] text-[#374151]';
    case 'DEAF':
      return 'border-[#38BDF8] bg-[#EFF6FF] text-[#1D4ED8]';
    default:
      return 'border-[#D0C1AC] bg-[#FDF7EE] text-[#6A5740]';
  }
}

type PetHeaderCardProps = {
  pet: PetData;
};

export default function PetHeaderCard({ pet }: PetHeaderCardProps) {
  return (
    <Paper
      elevation={0}
      className="mm-card"
      sx={{
        mt: 2,
        px: { xs: 2.5, md: 3 },
        py: 2.5,
        // Match the rest of the dashboard cards so the border renders cleanly.
        borderRadius: (theme) => theme.shape.borderRadius,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3,
        alignItems: { md: 'center' },
        justifyContent: { md: 'space-between' },
      }}
    >
      <Stack spacing={2.25}>
        {Array.isArray(pet.characteristics) &&
          pet.characteristics.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {pet.characteristics.map((id) => (
                <Box
                  key={id}
                  component="span"
                  className={[
                    'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]',
                    getCharacteristicClasses(id),
                  ].join(' ')}
                >
                  {getCharacteristicLabel(id)}
                </Box>
              ))}
            </Box>
          )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box
            sx={{
              height: { xs: 80, md: 96 },
              width: { xs: 80, md: 96 },
              flexShrink: 0,
              borderRadius: '999px',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: '#FDF7EE',
            }}
          >
            <PetAvatar
              name={pet.name}
              imageUrl={pet.imageUrl ?? null}
              size="lg"
            />
          </Box>

          <Box>
            <Typography component="h1" variant="h5" className="mm-h2">
              {pet.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 500,
                mt: 0.5,
                color: '#A08C72',
                fontSize: 12,
              }}
            >
              {pet.breed}
            </Typography>
          </Box>
        </Box>
      </Stack>

      <Box
        sx={{
          fontSize: 13,
          color: '#A08C72',
          textAlign: { xs: 'left', md: 'right' },
        }}
      >
        <Box>
          {calculateAge(pet.birthDate)} yrs • {pet.weight} lbs
        </Box>
        <Box>{pet.gender === 'MALE' ? 'Male' : 'Female'}</Box>
      </Box>
    </Paper>
  );
}
