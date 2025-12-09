// src/components/pets/PetDetailHeaderSection.tsx
import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import PetAvatar from '@/components/pets/PetAvatar';
import {
  PET_CHARACTERISTICS,
  type PetCharacteristicId,
} from '@/lib/petCharacteristics';
import type { PetData } from '@/components/pets/petDetailTypes';

type PetDetailHeaderSectionProps = {
  pet: PetData;
  onBack: () => void;
};

// This header section centralizes the back action and high-level pet summary
// so the main detail page component can stay focused on orchestration instead of layout.
export default function PetDetailHeaderSection({
  pet,
  onBack,
}: PetDetailHeaderSectionProps) {
  const ageLabel = calculateAgeLabel(pet.birthDate);
  const metaLine = [
    pet.breed,
    pet.gender === 'MALE' ? 'Male' : 'Female',
    ageLabel,
    `${pet.weight} lbs`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Box component="section">
      <Button
        type="button"
        onClick={onBack}
        variant="text"
        size="small"
        sx={{
          px: 1.5,
          py: 0.5,
          borderRadius: 999,
          textTransform: 'none',
        }}
      >
        ← Back
      </Button>

      <Card
        elevation={0}
        sx={{
          mt: 2,
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            alignItems={{ xs: 'center', sm: 'flex-start' }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <PetAvatar
                name={pet.name}
                imageUrl={pet.imageUrl ?? null}
                size="lg"
              />
              <Typography variant="caption" color="text.secondary">
                Pet photo
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                textAlign: { xs: 'center', sm: 'left' },
              }}
            >
              <Typography variant="h5" component="h1" sx={{ mb: 0.5 }}>
                {pet.name}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1.5 }}
              >
                {metaLine}
              </Typography>

              {Array.isArray(pet.characteristics) &&
                pet.characteristics.length > 0 && (
                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    justifyContent={{ xs: 'center', sm: 'flex-start' }}
                  >
                    {pet.characteristics.map((id) => (
                      <Chip
                        key={id}
                        size="small"
                        variant="outlined"
                        label={getCharacteristicLabel(id)}
                        sx={{ fontWeight: 600, letterSpacing: '0.04em' }}
                      />
                    ))}
                  </Stack>
                )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

function calculateAgeLabel(birthDate: string): string {
  const birth = new Date(birthDate);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate()))
    years--;
  return `${years} ${years === 1 ? 'yr' : 'yrs'}`;
}

function getCharacteristicLabel(id: PetCharacteristicId): string {
  const meta = PET_CHARACTERISTICS.find((item) => item.id === id);
  return meta ? meta.label : id.toLowerCase().replace(/_/g, ' ');
}
