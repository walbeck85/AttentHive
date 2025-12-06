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
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleMobileDrawer = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
        overflowX: "hidden",
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
        }}
      >
        <NavBar
          mobileOpen={mobileOpen}
          onToggleMobileDrawer={handleToggleMobileDrawer}
          drawerWidth={DRAWER_WIDTH}
        />

        {/* Main page content; existing .mm-page / .mm-shell classes still apply inside */}
        <Box component="main" sx={{ px: { xs: 2, sm: 3 }, pb: 4 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}