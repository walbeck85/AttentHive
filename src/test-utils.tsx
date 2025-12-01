// src/test-utils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// If you later need NextAuth SessionProvider, theme providers, etc.,
// this wrapper is where we wire them up so tests stay consistent.
function AllTheProviders({ children }: { children: React.ReactNode }) {
  // Keeping this intentionally lean for now so we do not over-engineer
  // the test setup before we actually need more providers.
  return <>{children}</>;
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