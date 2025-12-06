"use client";

import { ReactNode } from "react";
import { Container, Paper, Stack, Typography } from "@mui/material";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

// This wrapper gives auth screens a single place to agree on spacing, elevation,
// and typography so I’m not playing whack-a-mole every time I tweak the layout.
export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        // On small screens, anchor the card closer to the top so long forms
        // aren’t pushed below the fold. On larger screens we keep the
        // vertically centered presentation.
        alignItems: { xs: "flex-start", sm: "center" },
        py: { xs: 1, sm: 6 },
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          // Slightly tighter padding on mobile to reduce vertical height while
          // keeping the roomy desktop feel.
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={0.25}>
            <Typography variant="h4" component="h1">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Stack>

          {/* Each auth screen owns its own form and footer so we keep
              flexibility without duplicating the container chrome. */}
          {children}
        </Stack>
      </Paper>
    </Container>
  );
}