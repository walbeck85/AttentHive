'use client';

import React from 'react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { formatDateTime, formatActivityDisplay } from '@/components/pets/petActivityUtils';
import type { CareLog } from '@/components/pets/petDetailTypes';

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
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* Activity label leans on typography weight and the primary text token so it stays prominent in both modes */}
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: (theme) => theme.palette.text.primary,
                  }}
                >
                  {formatActivityDisplay(log.activityType, log.metadata)}
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
                {/* Photo thumbnail */}
                {log.photoUrl && (
                  <Box
                    sx={{
                      mt: 1,
                      width: 80,
                      height: 60,
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={log.photoUrl}
                      alt="Activity photo"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </Box>
                )}
              </Box>
              {/* Timestamp and edited badge */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, ml: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    whiteSpace: 'nowrap',
                    color: 'text.secondary',
                  }}
                >
                  {formatDateTime(log.createdAt)}
                </Typography>
                {log.editedAt && (
                  <Tooltip title={`Edited ${formatDateTime(log.editedAt)}`} arrow>
                    <Chip
                      icon={<EditIcon sx={{ fontSize: 12 }} />}
                      label="edited"
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 20,
                        fontSize: 10,
                        '& .MuiChip-icon': { ml: 0.5 },
                        '& .MuiChip-label': { px: 0.5 },
                      }}
                    />
                  </Tooltip>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </>
  );
}
