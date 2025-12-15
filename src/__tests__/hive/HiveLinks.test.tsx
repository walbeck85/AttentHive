// src/__tests__/hive/HiveLinks.test.tsx
import React from 'react';
import { renderWithProviders, screen } from '../../test-utils';
import { HivePetsYouCareForSection } from '../../app/hive/page';

// Mock next-auth so importing the hive page doesn't try to pull in
// the full OAuth / jose ESM stack. The test only cares about the JSX in
// HivePetsYouCareForSection, not about sessions.
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('HivePetsYouCareForSection', () => {
  it('renders links for pets you care for with correct hrefs', () => {
    const pets = [
      {
        id: 'pet-1',
        name: 'Truffle',
        type: 'DOG',
        ownerName: 'Alice',
      },
      {
        id: 'pet-2',
        name: 'Mochi',
        type: 'CAT',
        ownerName: 'Bob',
      },
    ];

    renderWithProviders(<HivePetsYouCareForSection pets={pets} />);

    pets.forEach((pet) => {
      // The component renders "View pet" as the link text, but we attach
      // a stable test id per pet so tests can assert the correct target.
      const link = screen.getByTestId(
        `hive-view-pet-${pet.id}`,
      ) as HTMLAnchorElement;

      expect(link).toHaveAttribute('href', `/pets/${pet.id}`);
    });
  });
});
