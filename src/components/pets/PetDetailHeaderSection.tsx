// src/components/pets/PetDetailHeaderSection.tsx
import React from 'react';
import { Box, Button } from '@mui/material';
import PetHeaderCard from '@/components/pets/PetHeaderCard';
import type { PetData } from '@/components/pets/petDetailTypes';

type PetDetailHeaderSectionProps = {
  pet: PetData | null;
  onBack: () => void;
};

// This header section centralizes the back action and high-level pet summary
// so the main detail page component can stay focused on orchestration instead of layout.
export default function PetDetailHeaderSection({
  pet,
  onBack,
}: PetDetailHeaderSectionProps) {
  return (
    <Box component="section" className="mm-section">
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
          fontSize: 13,
        }}
      >
        
        
        
        ← Back
      </Button>

      <PetHeaderCard pet={pet} />
    </Box>
  );
}
