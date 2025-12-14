// src/app/pets/[id]/activity/page.tsx
'use client';
// Imports ------------------------------------------------------

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PetAvatar from '@/components/pets/PetAvatar';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import { formatWalkDetails, type WalkMetadata } from '@/components/pets/petActivityUtils';

// Types --------------------------------------------------------

type ActivityType = 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';

// CareLog represents a single activity entry for a pet
type CareLog = {
  id: string;
  activityType: ActivityType;
  notes: string | null;
  metadata?: WalkMetadata | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
};

// Helper functions ---------------------------------------------

// Formats a date string into a human-readable format
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    // Pin timezone so SSR and client renders stay in sync.
    timeZone: 'UTC',
  }).format(date);
}

// Labels for activity types
const ACTIVITY_LABELS: Record<ActivityType, string> = {
  FEED: 'Feed',
  WALK: 'Walk',
  MEDICATE: 'Medicate',
  ACCIDENT: 'Accident',
};

// Page component -----------------------------------------------

export default function ActivityLogPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const petId = params?.id;

  // State variables for logs, pet name, loading status, error message, and filter
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [petName, setPetName] = useState<string>('Pet');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | ActivityType>('ALL');

  // Fetch data -------------------------------------------------
  useEffect(() => {
    if (!petId) return;

    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        // IMPORTANT:
        // The care-log API is now a flat route: GET /api/care-logs?id=PET_ID
        // not /api/pets/:id/care-logs anymore.
        const response = await fetch(`/api/care-logs?id=${petId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch logs');
        }

        // Update state with fetched logs and pet name
        setLogs(data.logs);
        setPetName(data.petName);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [petId]);

  // Derived data -----------------------------------------------

  const filteredLogs =
    filter === 'ALL'
      ? logs
      : logs.filter((log) => log.activityType === filter);

  // Loading / error states -------------------------------------

  // Keep the loading view lightweight since no data has been fetched yet.
  if (loading) {
    return (
      // Use palette-backed surface and text so the spinner view adapts to mode without manual checks.
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Loading activity…
        </Typography>
      </Box>
    );
  }

  // Surface a clear error state so the user can retry navigation if fetch fails.
  if (error) {
    return (
      // Use themed surfaces and typography to keep the error view legible across themes while matching the rest of the layout.
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
          Failed to load activity history
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {error}
        </Typography>
        <Button
          type="button"
          onClick={() => router.back()}
          variant="contained"
          size="small"
          sx={{
            borderRadius: '9999px',
            textTransform: 'none',
            px: 2,
            py: 0.75,
          }}
        >
          Back
        </Button>
      </Box>
    );
  }

  // Main layout ------------------------------------------------

  // Use MUI containers and stacks for consistent spacing and responsive gutters.
  return (
    <Container
      maxWidth="lg"
      sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 4 } }}
    >
      <Stack spacing={3}>
        {/* Back + header card */}
        {/* Group the back control and header card to align vertical rhythm. */}
        <Stack spacing={2}>
          <Button
            type="button"
            onClick={() => router.back()}
            variant="outlined"
            size="small"
            sx={{
              borderRadius: '9999px',
              textTransform: 'none',
              px: 1.75,
              py: 0.5,
            }}
          >
            ← Back
          </Button>

          {/* Let Paper own the card shell and spacing instead of Tailwind. */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Even without an image URL, showing initials keeps this page visually consistent with the rest of the app. */}
                <Box
                  sx={{
                    height: 40,
                    width: 40,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <PetAvatar name={petName} size="md" />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {petName}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary', mt: 0.25 }}
                  >
                    Activity log
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Stack>

        {/* Filters */}
        {/* Keep filters inside Paper so spacing matches other cards without Tailwind shells. */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {(['ALL', 'FEED', 'WALK', 'MEDICATE', 'ACCIDENT'] as const).map(
              (type) => {
                const isAll = type === 'ALL';
                const isActive = filter === type;
                const label = isAll
                  ? 'All activity'
                  : ACTIVITY_LABELS[type as ActivityType];

                return (
                  <Button
                    key={type}
                    type="button"
                    onClick={() =>
                      setFilter(type === 'ALL' ? 'ALL' : (type as ActivityType))
                    }
                    variant={isActive ? 'contained' : 'outlined'}
                    size="small"
                    sx={{
                      borderRadius: '9999px',
                      textTransform: 'none',
                    }}
                  >
                    {label}
                  </Button>
                );
              }
            )}
          </Box>
        </Paper>

        {/* Activity list */}
        {/* Wrap the log list in Paper so typography and borders stay consistent with the header card. */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>
            Recent activity
          </Typography>

          {filteredLogs.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No records found for this filter.
            </Typography>
          ) : (
            <Box
              component="ul"
              sx={{
                listStyle: 'none',
                p: 0,
                m: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              {filteredLogs.map((log) => (
                <Box
                  key={log.id}
                  component="li"
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    pb: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-of-type': {
                      borderBottom: 'none',
                      pb: 0,
                    },
                  }}
                >
                  <div>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        // Rely on text.primary so labels stay legible in both light and dark mode without manual mode checks.
                        color: 'text.primary',
                      }}
                    >
                      {log.activityType === 'WALK'
                        ? formatWalkDetails(log.metadata)
                        : ACTIVITY_LABELS[log.activityType]}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mt: 0.25, color: 'text.secondary' }}
                    >
                      by{' '}
                      <Box
                        component="span"
                        // Use a primary accent for the author to keep emphasis consistent with the theme.
                        sx={{ color: 'primary.main', fontWeight: 500 }}
                      >
                        {log.user?.name || 'Someone'}
                      </Box>
                    </Typography>
                    {log.notes && (
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 1,
                          color: 'text.secondary',
                        }}
                      >
                        {log.notes}
                      </Typography>
                    )}
                  </div>
                  <Typography
                    variant="caption"
                    sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}
                  >
                    {formatDateTime(log.createdAt)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
