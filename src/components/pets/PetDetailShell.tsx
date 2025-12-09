// src/components/pets/PetDetailShell.tsx
import React, { type ReactNode } from 'react';
import { Box, Container, Stack } from '@mui/material';

type PetDetailShellProps = {
  children: ReactNode;
};

// This shell owns the outer layout for the pet detail page so the main component
// can focus on composing sections instead of repeating Box/Container/Stack markup.
export default function PetDetailShell({ children }: PetDetailShellProps) {
  const [header, profile, activity, careCircle] = React.Children.toArray(children);
  const sections = [header, profile, activity, careCircle].filter(Boolean);

  return (
    <Box
      component="main"
      sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        minHeight: '100vh',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 4 } }}
      >
        <Stack spacing={3}>
          {sections.map((section, index) => (
            <Box key={index}>{section}</Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
