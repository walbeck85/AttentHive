// src/app/recipients/[id]/loading.tsx
//
// Route-level loading skeleton shown while the server component streams.
// Keeps layout stable so there's no content shift when data arrives.

import { Box, Container, Skeleton, Stack } from '@mui/material';

export default function RecipientDetailLoading() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 4 } }}
      >
        <Stack spacing={3}>
          {/* Back button */}
          <Skeleton variant="rounded" width={80} height={32} />

          {/* Header card */}
          <Skeleton variant="rounded" height={120} />

          {/* Info section */}
          <Skeleton variant="rounded" height={100} />

          {/* Profile section */}
          <Skeleton variant="rounded" height={200} />

          {/* Activity section */}
          <Skeleton variant="rounded" height={300} />
        </Stack>
      </Container>
    </Box>
  );
}
