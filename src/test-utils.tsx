// src/test-utils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeModeProvider } from '@/components/ThemeModeProvider';

// If you later need NextAuth SessionProvider, theme providers, etc.,
// this wrapper is where we wire them up so tests stay consistent.
function AllTheProviders({ children }: { children: React.ReactNode }) {
  // Central place to wire up shared app providers for tests.
  // Right now we only need ThemeModeProvider so components can
  // rely on the same MUI theme + mode logic used in the app shell.
  return <ThemeModeProvider>{children}</ThemeModeProvider>;
}

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'>;

// Centralizing render lets future-me add or swap providers in one place
// instead of trekking through a pile of tests changing imports.
export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from RTL so tests can import from one place.
// This keeps the test surface area small and predictable.
export * from '@testing-library/react';