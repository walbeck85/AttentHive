// src/__tests__/Components/PetCard.test.tsx
import React from 'react';
import { screen, fireEvent, waitFor, within } from '../../test-utils';
import { renderWithProviders } from '../../test-utils';
import PetCard, { PetData } from '../../components/pets/PetCard';

// Helper type so we can extend global in a typed way without `any`.
type GlobalWithFetch = typeof globalThis & { fetch: jest.Mock };

// Minimal PetData factory so tests stay readable.
function createPet(overrides: Partial<PetData> = {}): PetData {
  return {
    id: 'pet-1',
    name: 'Fluffy',
    type: 'DOG',
    breed: 'Corgi',
    gender: 'MALE',
    birthDate: '2020-01-01T00:00:00.000Z',
    weight: 20,
    careLogs: [],
    ...overrides,
  };
}

describe('PetCard', () => {
  beforeEach(() => {
    // Fresh fetch mock each test; no `as any` needed.
    (global as GlobalWithFetch).fetch = jest.fn();
    jest.clearAllMocks();
  });

  test('renders pet name, breed, age, weight, and gender', () => {
    const pet = createPet();

    renderWithProviders(
      <PetCard pet={pet} currentUserName="Will" onQuickAction={jest.fn()} />
    );

    expect(screen.getByText('Fluffy')).toBeInTheDocument();
    expect(screen.getByText('Corgi')).toBeInTheDocument();

    // There are two "yrs" strings (header + detail). I only care that at least one exists.
    expect(screen.getAllByText(/yrs/).length).toBeGreaterThan(0);

    // Same for weight, header + detail.
    expect(screen.getAllByText('20 lbs').length).toBeGreaterThan(0);

    // Gender appears twice as well; just assert it's present somewhere.
    expect(screen.getAllByText('Male').length).toBeGreaterThan(0);
  });

  test('renders last care log using current user name when it matches', () => {
    const careLogs = [
      {
        id: 'log-1',
        activityType: 'WALK' as const,
        createdAt: new Date().toISOString(),
        user: { name: 'Will' },
      },
    ];

    const pet = createPet({ careLogs });

    renderWithProviders(
      <PetCard pet={pet} currentUserName="Will" onQuickAction={jest.fn()} />
    );

    expect(screen.getByText(/You logged a walk/i)).toBeInTheDocument();
    // Very loose "time-ish" check so we don't couple to exact phrasing.
    expect(screen.getByText(/ago|just now|minute|hour|day/i)).toBeInTheDocument();
  });

  test('opens confirmation modal when a quick action is clicked', async () => {
    const pet = createPet();

    renderWithProviders(
      <PetCard pet={pet} currentUserName="Will" onQuickAction={jest.fn()} />
    );

    const feedButton = screen.getByRole('button', { name: 'Feed' });
    fireEvent.click(feedButton);

    // Grab the dialog by its role and label, then scope queries to it.
    const modal = await screen.findByRole('dialog', {
      name: /Log feed for Fluffy\?/i,
    });

    const modalUtils = within(modal);

    expect(
      modalUtils.getByText('Log feed for Fluffy?')
    ).toBeInTheDocument();

    // There are two "Log Feed" strings (title + button), so scope to the modal
    // and use getAllByText rather than global getByText.
    expect(modalUtils.getAllByText(/Log Feed/i).length).toBeGreaterThan(0);

    expect(
      modalUtils.getByText(/This will add .*Feed.*entry/i)
    ).toBeInTheDocument();
  });

  test('logs care activity and calls onQuickAction when confirming an action', async () => {
    const pet = createPet();
    const onQuickAction = jest.fn();

    const globalWithFetch = global as GlobalWithFetch;
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'log-1' }),
    });

    globalWithFetch.fetch = mockFetch;

    renderWithProviders(
      <PetCard pet={pet} currentUserName="Will" onQuickAction={onQuickAction} />
    );

    const feedButton = screen.getByRole('button', { name: 'Feed' });
    fireEvent.click(feedButton);

    const modal = await screen.findByRole('dialog', {
      name: /Log feed for Fluffy\?/i,
    });
    const modalUtils = within(modal);

    const confirmButton = modalUtils.getByRole('button', { name: /Log Feed/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/care-logs',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            petId: 'pet-1',
            activityType: 'FEED',
          }),
        })
      );
    });

    expect(onQuickAction).toHaveBeenCalledWith('pet-1', 'Fluffy', 'FEED');
  });
});