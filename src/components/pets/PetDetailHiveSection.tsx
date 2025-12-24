// src/components/pets/PetDetailHiveSection.tsx
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import HivePanel from '@/components/pets/HivePanel';
import type { HiveMember } from '@/components/pets/petDetailTypes';

type PetDetailHiveSectionProps = {
  recipientId: string;
  isOwner: boolean;
  isPrimaryOwner: boolean;
  initialMembers: HiveMember[];
};

// This section wraps the HivePanel so the main detail page stays focused
// on wiring data and permissions instead of repeating layout markup.
export default function PetDetailHiveSection({
  recipientId,
  isOwner,
  isPrimaryOwner,
  initialMembers,
}: PetDetailHiveSectionProps) {
  return (
    <Box component="section" id="hive">
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
          <HivePanel
            recipientId={recipientId}
            isOwner={isOwner}
            isPrimaryOwner={isPrimaryOwner}
            initialMembers={initialMembers}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
