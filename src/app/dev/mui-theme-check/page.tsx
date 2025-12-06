// src/app/chakra-test/page.tsx
// Simple MUI test route to verify that the theme provider is wired correctly.

// Dev-only route to validate the MUI theme wiring.
// Safe to remove before production if not needed.

import { Box, Button, Stack, Typography } from "@mui/material";

export default function MuiTestPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Box
        sx={{
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: 2,
          p: 3,
          maxWidth: 400,
          width: "100%",
        }}
      >
        <Typography variant="h6" gutterBottom color="text.primary">
          MUI Theme Check
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          If this card has a soft white background, navy text, and a warm
          orange primary button, your MUI theme is active.
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button variant="contained" color="primary">
            Primary
          </Button>
          <Button variant="outlined" color="primary">
            Outline
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}