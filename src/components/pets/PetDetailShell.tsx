// src/components/pets/PetDetailShell.tsx
import React, { Children, type ReactNode } from 'react';
import { Box, Container, Stack } from '@mui/material';

type PetDetailShellProps = {
  children: ReactNode;
};

// This shell owns the outer layout for the pet detail page so the main component
// can focus on composing sections instead of repeating Box/Container/Stack markup.
export default function PetDetailShell({ children }: PetDetailShellProps) {
  const sections = Children.toArray(children);

  return (
    <Box
      component="main"
      sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        minHeight: '100vh',
        py: { xs: 3, md: 4 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={3.5}>{sections}</Stack>
      </Container>
    </Box>
  );
}
