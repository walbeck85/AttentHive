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
import { formatDateTime, getActivityLabel } from '@/components/pets/petActivityUtils';
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

        <CardContent sx={{ pt: 1, px: 0, pb: 0 }}>
          {careLogs.length === 0 && (
            <Box sx={{ px: 3, py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No activity logged yet.
              </Typography>
            </Box>
          )}

          {careLogs.length > 0 && (
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
                    primary={getActivityLabel(log.activityType)}
                    secondary={
                      <>
                        <Typography
                          variant="body2"
                          className="mm-muted-sm"
                          sx={{ fontSize: 13, mt: 0.25 }}
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
                        color: (theme) =>
                          theme.palette.mode === 'dark'
                            ? theme.palette.text.primary
                            : '#382110',
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
