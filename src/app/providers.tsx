// src/app/providers.tsx
"use client";
// Imports ------------------------------------------------------
import { SessionProvider } from "next-auth/react";
// Provider component -------------------------------------------
export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}