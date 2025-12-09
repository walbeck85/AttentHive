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
      <Typography
        component="h2"
        variant="subtitle1"
        className="mm-h3"
        sx={{ mb: 1.5 }}
      >
        Recent activity
      </Typography>

      {careLogs.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          className="mm-muted-sm"
        >
          No activity logged yet.
        </Typography>
      )}

      {careLogs.length > 0 && (
        <Box
          component="ul"
          sx={{ listStyle: 'none', p: 0, m: 0 }}
          className="space-y-3"
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
              <Box>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    // In light mode, keep the warm brand brown. In dark mode, switch to
                    // the primary text color so activity labels remain clearly legible
                    // against the navy background.
                    color: (theme) =>
                      theme.palette.mode === 'dark'
                        ? theme.palette.common.white
                        : '#382110',
                  }}
                >
                  {getActivityLabel(log.activityType)}
                </Typography>
                <Typography
                  variant="body2"
                  className="mm-muted-sm"
                  sx={{ mt: 0.25 }}
                >
                  by{' '}
                  <Box
                    component="span"
                    sx={{ color: '#D17D45', fontWeight: 500 }}
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
              <Typography
                variant="caption"
                className="mm-meta"
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
