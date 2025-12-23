// src/components/pets/PetDetailActivitySection.tsx
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import { formatDateTime, formatActivityDisplay } from '@/components/pets/petActivityUtils';
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
    // Semantic section keeps this card grouped logically on the detail page while preserving any page-level spacing utilities.
    <Box component="section">
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        {/* CardHeader handles the title typography and spacing so we do not rely on Tailwind for heading styles. */}
        <CardHeader
          title="Recent activity"
          sx={{
            px: 3,
            pt: 2,
            pb: 0,
            '& .MuiCardHeader-title': {
              fontSize: 16,
              fontWeight: 600,
            },
          }}
        />

        {/* CardContent manages padding; list and empty states sit inside without extra Tailwind wrappers. */}
        <CardContent sx={{ pt: 1, px: 0, pb: 0 }}>
          {careLogs.length === 0 && (
            // Empty state uses muted MUI typography for clarity when no activity exists.
            <Box sx={{ px: 3, py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No activity logged yet.
              </Typography>
            </Box>
          )}

          {careLogs.length > 0 && (
            // Activity list relies on MUI List styling and dividers to align with the rest of the UI kit.
            <List disablePadding>
              {careLogs.map((log) => (
                <ListItem
                  key={log.id}
                  divider
                  alignItems="flex-start"
                  sx={{ px: 3, py: 1.5 }}
                  secondaryAction={
                    <Typography
                      variant="caption"
                      sx={{
                        ml: 2,
                        whiteSpace: 'nowrap',
                        color: 'text.secondary',
                      }}
                    >
                      {formatDateTime(log.createdAt)}
                    </Typography>
                  }
                >
                  <ListItemText
                    primary={formatActivityDisplay(log.activityType, log.metadata)}
                    secondary={
                      <>
                        {/* Attribution line stays small and muted through MUI color tokens instead of Tailwind text classes. */}
                        <Typography
                          variant="body2"
                          sx={{ fontSize: 13, mt: 0.25, color: 'text.secondary' }}
                        >
                          by{' '}
                          <Box
                            component="span"
                            // Accent uses theme primary color so it adapts in light and dark modes without manual checks.
                            sx={{ color: 'primary.main', fontWeight: 500 }}
                          >
                            {log.user?.name || 'Someone'}
                          </Box>
                        </Typography>
                        {log.notes && (
                          <Typography
                            variant="body2"
                            sx={{
                              mt: 0.5,
                              fontSize: 12,
                              color: 'text.secondary',
                            }}
                          >
                            {log.notes}
                          </Typography>
                        )}
                      </>
                    }
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: {
                        fontWeight: 600,
                        // Primary text leverages the palette token so it respects the active theme automatically.
                        color: 'text.primary',
                      },
                    }}
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
