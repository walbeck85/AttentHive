'use client';

import { Box, Typography } from '@mui/material';
import PetCard, { type PetData } from './PetCard';

type Props = {
  // Callers (account/dashboard) can pass their own pet shapes;
  // we normalize to PetData inside this component.
  pets: unknown[];
  currentUserName?: string | null;
};

export default function PetList({ pets, currentUserName }: Props) {
  // Internally, we treat pets as PetData because PetCard expects that shape.
  const typedPets = pets as PetData[];

  // PetCard expects a string, so we normalize null/undefined to an empty string.
  const safeCurrentUserName = currentUserName ?? '';

  // Simple empty state so the section doesn't just vanish
  if (!typedPets || typedPets.length === 0) {
    return (
      <Box
        component="section"
        sx={{
          mt: 2,
          px: { xs: 2, sm: 3 },
          pb: { xs: 2, sm: 3 },
        }}
      >
        <Typography variant="body1" color="text.secondary" align="center">
          No pets found.
        </Typography>
      </Box>
    );
  }

  return (
    // Wrapping the list in a Box makes it easy to adjust dashboard spacing later
    // without hunting through every caller; this Box uses a CSS grid so we still
    // get a responsive layout that aligns with the shell without fighting Grid's TS surface.
    <Box
      component="section"
      sx={{
        mt: 2,
        px: { xs: 2, sm: 3 },
        pb: { xs: 2, sm: 3 },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, sm: 2.5 },
          gridTemplateColumns: {
            xs: '1fr',                                   // 1 per row on mobile
            sm: 'repeat(2, minmax(0, 1fr))',            // 2-up on small screens
            md: 'repeat(3, minmax(0, 1fr))',            // 3-up on larger screens
          },
        }}
      >
        {typedPets.map((pet) => (
          <Box key={pet.id}>
            <PetCard
              pet={pet}
              currentUserName={safeCurrentUserName}
              // onQuickAction is required in PetCard's props.
              // Right now the card handles the logging itself, so we pass a no-op to satisfy TS.
              onQuickAction={() => {}}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}