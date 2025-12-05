// src/components/pets/PetList.tsx
'use client';

import type { Recipient } from '@prisma/client';
import PetCard, { PetData } from './PetCard';
import type { PetCharacteristicId } from '@/lib/petCharacteristics';
// MUI layout primitives give the dashboard a consistent, theme-aware layout
// without forcing us to rewrite every Tailwind utility in one go.
import { Box, Typography } from '@mui/material';

type PetListProps = {
  // The dashboard hands us raw Prisma Recipient records; we keep this type tight so any
  // future query drift shows up here instead of randomly in the UI.
  pets?: Recipient[] | null;
  // Optional name of the current user so cards can personalize activity descriptions.
  currentUserName?: string | null;
};

export default function PetList({ pets, currentUserName }: PetListProps) {
  // Treat undefined, null, and empty arrays the same so the UI does not show a half-broken state.
  if (!pets || pets.length === 0) {
    // Empty state uses MUI here so spacing and typography stay in sync with the rest
    // of the dashboard shell, even though the message itself is simple.
    return (
      <Box sx={{ py: 3 }} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          No pets added yet. Use the Add New Pet form above to get started.
        </Typography>
      </Box>
    );
  }

  // Map Prisma's Recipient shape into the more flexible PetData shape that the card expects.
  // Doing the mapping here keeps the rest of the UI agnostic about where pets came from.
  const mappedPets: PetData[] = pets.map((pet) => ({
    id: pet.id,
    name: pet.name,
    type: pet.type,
    breed: pet.breed,
    gender: pet.gender,
    // PetData.birthDate is a string, but Prisma gives us a Date.
    // Converting to ISO keeps it unambiguous and easy to parse in the card.
    birthDate: pet.birthDate.toISOString(),
    weight: pet.weight,
    imageUrl: pet.imageUrl ?? null,
    // Surface any stored behavior/needs flags so the card can render
    // badges without needing to know about Prisma's Recipient shape.
    characteristics: (pet.characteristics ?? []) as PetCharacteristicId[],
    // The dashboard query is not loading logs yet; starting with an empty array
    // avoids null checks everywhere else.
    careLogs: [],
  }));

  return (
    // Wrapping the list in a Box makes it easy to adjust dashboard spacing later
    // without hunting through every caller; this Box uses a CSS grid so we still
    // get a responsive layout without fighting the Grid v2 TypeScript surface.
    <Box component="section" sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(3, minmax(0, 1fr))',
          },
        }}
      >
        {mappedPets.map((pet) => (
          // The inner Box keeps each card at a sane max width and recenters it,
          // so we avoid the hyper-wide "stadium" look from the original mm-card radius
          // while we gradually standardize card geometry in the theme.
          <Box
            key={pet.id}
            sx={{
              maxWidth: 360,
              mx: 'auto',
              width: '100%',
              borderRadius: 3,
              overflow: 'hidden',
              height: '100%',
            }}
          >
            <PetCard
              pet={pet}
              currentUserName={currentUserName}
              // onQuickAction is required in PetCard's Props type.
              // Right now the card handles the logging itself, so we pass a no-op to satisfy TS.
              onQuickAction={() => {}}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}