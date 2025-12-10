// src/components/RootShell.tsx
"use client";

import { ReactNode, useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import NavBar from "./NavBar";

type RootShellProps = {
  children: ReactNode;
};

// Keep this in sync with the Drawer width in NavBar
const DRAWER_WIDTH = 280;

export default function RootShell({ children }: RootShellProps) {
  const theme = useTheme();

  // Use noSsr so the media query is only evaluated on the client.
  // This keeps the server-rendered markup stable and avoids layout
  // decisions that depend on a "fake" server match.
  const isMobile = useMediaQuery(theme.breakpoints.down("md"), {
    noSsr: true,
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleMobileDrawer = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <Box
      suppressHydrationWarning
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* This wrapper moves the entire page (NavBar + content) when drawer is open */}
      <Box
        sx={{
          transform:
            isMobile && mobileOpen ? `translateX(${DRAWER_WIDTH}px)` : "none",
          transition: theme.transitions.create("transform", {
            duration: theme.transitions.duration.enteringScreen,
            easing: theme.transitions.easing.easeOut,
          }),
          flex: 1,
        }}
      >
        <NavBar
          mobileOpen={mobileOpen}
          onToggleMobileDrawer={handleToggleMobileDrawer}
          drawerWidth={DRAWER_WIDTH}
        />

        {/* Main page content; existing .app-page / .app-shell classes still apply inside */}
        <Box
          component="main"
          sx={{
            maxWidth: (theme) => theme.breakpoints.values.lg,
            mx: "auto",
            width: "100%",
            px: { xs: 2, sm: 3, md: 4 },
            pb: 4,
            bgcolor: "background.default",
            color: "text.primary",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
