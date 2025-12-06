// src/components/pets/PetDetailActivitySection.tsx
import React from 'react';
import { Box, Paper } from '@mui/material';
import PetActivityList from '@/components/pets/PetActivityList';
import type { CareLog } from '@/components/pets/petDetailTypes';

type PetDetailActivitySectionProps = {
  careLogs: CareLog[];
};

// This section owns the recent activity card so the main detail page
// doesn't have to repeat Paper/Box layout every time we tweak styling.
export default function PetDetailActivitySection({
  careLogs,
}: PetDetailActivitySectionProps) {
  return (
    <Box component="section" className="mm-section">
      <Paper
        elevation={0}
        className="mm-card"
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <PetActivityList careLogs={careLogs} />
      </Paper>
    </Box>
  );
}
