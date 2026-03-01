// src/components/pets/PetDetailActivitySection.tsx
'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { ActivityType } from '@prisma/client';
import {
  formatDateTime,
  formatActivityDisplay,
} from '@/components/pets/petActivityUtils';
import { getActionsForSubtype } from '@/lib/action-config';
import { getActivityLabel } from '@/config/activityTypes';
import type { CareLog } from '@/components/pets/petDetailTypes';
import EditActivityModal from './EditActivityModal';

const PAGE_SIZE = 20;

type PetDetailActivitySectionProps = {
  careLogs: CareLog[];
  currentUserId: string;
  canEdit: boolean;
  onCareLogUpdated: (updatedLog: CareLog) => void;
  subtype?: string;
};

export default function PetDetailActivitySection({
  careLogs,
  currentUserId,
  canEdit,
  onCareLogUpdated,
  subtype,
}: PetDetailActivitySectionProps) {
  const [editingLog, setEditingLog] = useState<CareLog | null>(null);
  const [filter, setFilter] = useState<'ALL' | ActivityType>('ALL');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Build the list of valid filter options for this subtype
  const filterOptions = useMemo(() => {
    if (!subtype) return [] as ActivityType[];
    return getActionsForSubtype(subtype);
  }, [subtype]);

  // Apply filter then paginate
  const filteredLogs = useMemo(() => {
    if (filter === 'ALL') return careLogs;
    return careLogs.filter((l) => l.activityType === filter);
  }, [careLogs, filter]);

  const visibleLogs = filteredLogs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredLogs.length;

  const handleFilterChange = (next: 'ALL' | ActivityType) => {
    setFilter(next);
    setVisibleCount(PAGE_SIZE);
  };

  const handleEditClick = (log: CareLog) => {
    setEditingLog(log);
  };

  const handleEditClose = () => {
    setEditingLog(null);
  };

  const handleEditSave = (updatedLog: CareLog) => {
    onCareLogUpdated(updatedLog);
    setEditingLog(null);
  };

  return (
    <>
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
          <CardHeader
            title="Activity history"
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

          <CardContent sx={{ pt: 1.5, px: 3, pb: 2 }}>
            {/* Filter chips */}
            {filterOptions.length > 0 && (
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ mb: 2, flexWrap: 'wrap', gap: 0.75 }}
              >
                <Chip
                  label="All"
                  size="small"
                  variant={filter === 'ALL' ? 'filled' : 'outlined'}
                  color={filter === 'ALL' ? 'primary' : 'default'}
                  onClick={() => handleFilterChange('ALL')}
                  sx={{ fontWeight: 600 }}
                />
                {filterOptions.map((type) => (
                  <Chip
                    key={type}
                    label={getActivityLabel(type)}
                    size="small"
                    variant={filter === type ? 'filled' : 'outlined'}
                    color={filter === type ? 'primary' : 'default'}
                    onClick={() => handleFilterChange(type)}
                  />
                ))}
              </Stack>
            )}

            {filteredLogs.length === 0 && (
              <Box sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {filter === 'ALL'
                    ? 'No activity logged yet.'
                    : `No ${getActivityLabel(filter).toLowerCase()} activity logged yet.`}
                </Typography>
              </Box>
            )}

            {visibleLogs.length > 0 && (
              <List disablePadding>
                {visibleLogs.map((log) => {
                  const canEditThisLog =
                    canEdit && log.user?.id === currentUserId;

                  return (
                    <ListItem
                      key={log.id}
                      divider
                      alignItems="flex-start"
                      sx={{ px: 0, py: 1.5 }}
                      secondaryAction={
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: 0.5,
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            {canEditThisLog && (
                              <Tooltip title="Edit activity" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditClick(log)}
                                  sx={{
                                    color: 'text.secondary',
                                    '&:hover': { color: 'primary.main' },
                                  }}
                                >
                                  <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
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
                          {log.editedAt && (
                            <Tooltip
                              title={`Edited ${formatDateTime(log.editedAt)}`}
                              arrow
                            >
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
                      }
                    >
                      <ListItemText
                        primary={formatActivityDisplay(
                          log.activityType,
                          log.metadata,
                        )}
                        secondary={
                          <>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: 13,
                                mt: 0.25,
                                color: 'text.secondary',
                              }}
                            >
                              by{' '}
                              <Box
                                component="span"
                                sx={{
                                  color: 'primary.main',
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
                                  fontSize: 12,
                                  color: 'text.secondary',
                                }}
                              >
                                {log.notes}
                              </Typography>
                            )}
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
                          </>
                        }
                        primaryTypographyProps={{
                          variant: 'body2',
                          sx: {
                            fontWeight: 600,
                            color: 'text.primary',
                          },
                        }}
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}

            {hasMore && (
              <Box sx={{ mt: 1.5, textAlign: 'center' }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  sx={{ textTransform: 'none' }}
                >
                  Show more ({filteredLogs.length - visibleCount} remaining)
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      <EditActivityModal
        open={!!editingLog}
        careLog={editingLog}
        onSave={handleEditSave}
        onClose={handleEditClose}
      />
    </>
  );
}
