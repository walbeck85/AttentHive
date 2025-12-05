"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "@/theme";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
}