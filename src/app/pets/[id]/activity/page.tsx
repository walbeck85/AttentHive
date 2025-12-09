// src/app/pets/[id]/activity/page.tsx
'use client';
// Imports ------------------------------------------------------

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PetAvatar from '@/components/pets/PetAvatar';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';

// Types --------------------------------------------------------

type ActivityType = 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';

// CareLog represents a single activity entry for a pet
type CareLog = {
  id: string;
  activityType: ActivityType;
  notes: string | null;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--mm-bg)] flex items-center justify-center">
        <p className="mm-muted">Loading activity…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--mm-bg)] flex flex-col items-center justify-center gap-4">
        <p className="text-[#382110] text-lg font-semibold">
          Failed to load activity history
        </p>
        <p className="mm-muted text-sm">{error}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mm-chip mm-chip--solid-primary"
        >
          Back
        </button>
      </div>
    );
  }

  // Main layout ------------------------------------------------

  return (
    <Container
      maxWidth="lg"
      sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 4 } }}
    >
      <Stack spacing={3}>
        {/* Back + header card */}
        <Stack spacing={2}>
          <Button
            type="button"
            onClick={() => router.back()}
            variant="outlined"
            size="small"
            sx={{
              borderRadius: '9999px',
              textTransform: 'none',
              fontSize: 13,
              px: 1.75,
              py: 0.5,
            }}
          >
            ← Back
          </Button>

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
                <div>
                  <h1 className="mm-h2">{petName}</h1>
                  <p className="mm-muted-sm">Activity log</p>
                </div>
              </Box>
            </Box>
          </Paper>
        </Stack>

        {/* Filters */}
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
          <div className="flex flex-wrap gap-2">
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
                      fontSize: 13,
                    }}
                  >
                    {label}
                  </Button>
                );
              }
            )}
          </div>
        </Paper>

        {/* Activity list */}
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
          <h2 className="mm-h3 mb-3">Recent activity</h2>

          {filteredLogs.length === 0 ? (
            <p className="mm-muted-sm">No records found for this filter.</p>
          ) : (
            <ul className="space-y-3 text-sm">
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
                        color: (theme) =>
                          theme.palette.mode === 'dark'
                            ? theme.palette.text.primary
                            : '#382110',
                      }}
                    >
                      {ACTIVITY_LABELS[log.activityType]}
                    </Typography>
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
                          mt: 1,
                          fontSize: 12,
                          color: 'text.secondary',
                        }}
                      >
                        {log.notes}
                      </Typography>
                    )}
                  </div>
                  <Typography
                    variant="caption"
                    className="mm-meta"
                    sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}
                  >
                    {formatDateTime(log.createdAt)}
                  </Typography>
                </Box>
              ))}
            </ul>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
