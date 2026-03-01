// src/app/recipients/[id]/not-found.tsx

import { Box, Button, Container, Typography } from '@mui/material';

export default function RecipientNotFound() {
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
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
          Not found
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          This recipient doesn&apos;t exist or you don&apos;t have access to it.
        </Typography>
        <Button
          variant="contained"
          size="small"
          href="/dashboard"
          sx={{ textTransform: 'none' }}
        >
          Back to dashboard
        </Button>
      </Container>
    </Box>
  );
}
