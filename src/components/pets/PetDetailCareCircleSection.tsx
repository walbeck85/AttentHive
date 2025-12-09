// src/components/pets/PetDetailCareCircleSection.tsx
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
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
    <Box component="section" id="care-circle">
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden',
          height: '100%',
        }}
      >
        <CardHeader
          title="Shared with"
          titleTypographyProps={{ variant: 'subtitle1', sx: { fontWeight: 600 } }}
          sx={{
            pb: 0,
          }}
        />
        <CardContent sx={{ pt: 1, px: 0, pb: 0 }}>
          <CareCirclePanel
            recipientId={recipientId}
            isOwner={isOwner}
            initialMembers={initialMembers}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
