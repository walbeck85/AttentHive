// src/components/pets/PetDetailCareCircleSection.tsx
import React from 'react';
import { Box } from '@mui/material';
import CareCirclePanel from '@/components/pets/CareCirclePanel';
import type { CareCircleMember } from '@/components/pets/petDetailTypes';

type PetDetailCareCircleSectionProps = {
  recipientId: string;
  isOwner: boolean;
  initialMembers: CareCircleMember[];
};

// This section wraps the CareCirclePanel so the main detail page stays focused
// on wiring data and permissions instead of repeating layout markup.
export default function PetDetailCareCircleSection({
  recipientId,
  isOwner,
  initialMembers,
}: PetDetailCareCircleSectionProps) {
  return (
    <Box component="section" id="care-circle" className="mm-section">
      <CareCirclePanel
        recipientId={recipientId}
        isOwner={isOwner}
        initialMembers={initialMembers}
      />
    </Box>
  );
}