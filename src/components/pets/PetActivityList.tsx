'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  formatDateTime,
  getActivityLabel,
} from '@/components/pets/petActivityUtils';
import type { CareLog } from '@/components/pets/PetDetailPage';

type PetActivityListProps = {
  careLogs: CareLog[];
};

export default function PetActivityList({ careLogs }: PetActivityListProps) {
  return (
    <>
      {/* Heading uses MUI typography and spacing so the section title stays consistent with the design system */}
      <Typography
        component="h2"
        variant="h6"
        sx={{ mb: 1.5, fontWeight: 700 }}
      >
        Recent activity
      </Typography>

      {/* Empty state text uses MUI color tokens to keep the muted tone without relying on Tailwind helpers */}
      {careLogs.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No activity logged yet.
        </Typography>
      )}

      {/* List container resets list styles and uses grid row gaps for vertical rhythm instead of Tailwind spacing */}
      {careLogs.length > 0 && (
        <Box
          component="ul"
          sx={{
            listStyle: 'none',
            p: 0,
            m: 0,
            display: 'grid',
            rowGap: 12,
          }}
        >
          {careLogs.map((log) => (
            <Box
              key={log.id}
              component="li"
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                pb: 1,
                borderBottom: '1px solid',
                borderColor: (theme) => theme.palette.divider,
                '&:last-of-type': {
                  borderBottom: 'none',
                  pb: 0,
                },
              }}
            >
              {/* Each item stacks details and timestamp while the divider separates entries for quick scanning */}
              <Box>
                {/* Activity label leans on typography weight and the primary text token so it stays prominent in both modes */}
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: (theme) => theme.palette.text.primary,
                  }}
                >
                  {getActivityLabel(log.activityType)}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mt: 0.25, color: 'text.secondary' }}
                >
                  by{' '}
                  {/* User name leans on the primary accent so it pops while staying mode-aware */}
                  <Box
                    component="span"
                    sx={{
                      color: (theme) => theme.palette.primary.main,
                      fontWeight: 500,
                    }}
                  >
                    {log.user?.name || 'Someone'}
                  </Box>
                </Typography>
                {log.notes && (
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.5,
                      color: 'text.secondary',
                    }}
                  >
                    {log.notes}
                  </Typography>
                )}
              </Box>
              {/* Timestamp uses caption variant with muted color so it aligns visually without overpowering the details */}
              <Typography
                variant="caption"
                sx={{
                  whiteSpace: 'nowrap',
                  color: 'text.secondary',
                }}
              >
                {formatDateTime(log.createdAt)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </>
  );
}
