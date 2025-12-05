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
        alignItems: "center",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          p: 4,
          borderRadius: 3,
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={0.5}>
            <Typography variant="h4" component="h1">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Stack>

          {/* I’m letting each auth screen own its own form and footer so we
              keep flexibility without duplicating the container chrome. */}
          {children}
        </Stack>
      </Paper>
    </Container>
  );
}