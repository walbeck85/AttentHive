// src/app/recipients/[id]/error.tsx
//
// Route-level error boundary for the recipient detail page.
// Catches unhandled errors from the server component (e.g. database
// failures, unexpected exceptions) and shows a recovery UI instead
// of a blank page.

'use client';

import { Box, Button, Container, Typography } from '@mui/material';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RecipientDetailError({ error, reset }: ErrorPageProps) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          Something went wrong
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          {error.message || 'An unexpected error occurred while loading this page.'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={reset}
            sx={{ textTransform: 'none' }}
          >
            Try again
          </Button>
          <Button
            variant="contained"
            size="small"
            href="/dashboard"
            sx={{ textTransform: 'none' }}
          >
            Back to dashboard
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
