"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeModeProvider } from "@/components/ThemeModeProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeModeProvider>{children}</ThemeModeProvider>
    </SessionProvider>
  );
}