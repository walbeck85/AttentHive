import React from 'react';
import { screen, fireEvent, waitFor, within } from '../../test-utils';
import { renderWithProviders } from '../../test-utils';
import RecipientCard, { type RecipientData } from '../../components/recipients/RecipientCard';

// Helper type so we can extend global in a typed way.
type GlobalWithFetch = typeof globalThis & { fetch: jest.Mock };

// Minimal RecipientData factories per category.
function createPetRecipient(overrides: Partial<RecipientData> = {}): RecipientData {
  return {
    id: 'pet-1',
    name: 'Buddy',
    category: 'PET',
    subtype: 'DOG',
    breed: 'Labrador',
    imageUrl: null,
    ...overrides,
  };
}

function createPlantRecipient(overrides: Partial<RecipientData> = {}): RecipientData {
  return {
    id: 'plant-1',
    name: 'Fern',
    category: 'PLANT',
    subtype: 'INDOOR',
    plantSpecies: 'Boston Fern',
    imageUrl: null,
    ...overrides,
  };
}

function createPersonRecipient(overrides: Partial<RecipientData> = {}): RecipientData {
  return {
    id: 'person-1',
    name: 'Grandma',
    category: 'PERSON',
    subtype: 'ELDER',
    relationship: 'Grandmother',
    imageUrl: null,
    ...overrides,
  };
}

describe('RecipientCard', () => {
  beforeEach(() => {
    (global as GlobalWithFetch).fetch = jest.fn();
    jest.clearAllMocks();
  });

  // -- PET rendering --------------------------------------------------------

  describe('PET category', () => {
    it('renders pet name and breed', () => {
      renderWithProviders(<RecipientCard recipient={createPetRecipient()} />);

      expect(screen.getByText('Buddy')).toBeInTheDocument();
      // Breed appears in both header (secondary info) and body
      expect(screen.getAllByText('Labrador').length).toBeGreaterThanOrEqual(1);
    });

    it('displays Pet category chip', () => {
      renderWithProviders(<RecipientCard recipient={createPetRecipient()} />);

      expect(screen.getByText('Pet')).toBeInTheDocument();
    });

    it('shows Type and Breed fields in card body', () => {
      renderWithProviders(<RecipientCard recipient={createPetRecipient({ subtype: 'CAT', breed: 'Siamese' })} />);

      expect(screen.getByText('Type')).toBeInTheDocument();
      // Cat appears in body; Siamese appears in header (secondary) + body (dd)
      expect(screen.getAllByText('Cat').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Breed')).toBeInTheDocument();
      expect(screen.getAllByText('Siamese').length).toBeGreaterThanOrEqual(1);
    });

    it('shows dash when breed is missing', () => {
      renderWithProviders(<RecipientCard recipient={createPetRecipient({ breed: null })} />);

      // The body section should show "—" for missing breed
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    it('formats SMALL_MAMMAL subtype as "Small Mammal"', () => {
      renderWithProviders(
        <RecipientCard recipient={createPetRecipient({ subtype: 'SMALL_MAMMAL', breed: null })} />
      );

      // Appears in header (secondary info fallback) and body (Type dd)
      expect(screen.getAllByText('Small Mammal').length).toBeGreaterThanOrEqual(1);
    });

    it('links to /recipients/pet-1', () => {
      renderWithProviders(<RecipientCard recipient={createPetRecipient()} />);

      const link = screen.getByRole('link', { name: /view details/i });
      expect(link).toHaveAttribute('href', '/recipients/pet-1');
    });

    it('renders quick actions for dog subtype', () => {
      renderWithProviders(<RecipientCard recipient={createPetRecipient()} />);

      expect(screen.getByTitle('Walk')).toBeInTheDocument();
      expect(screen.getByTitle('Feed')).toBeInTheDocument();
    });
  });

  // -- PLANT rendering ------------------------------------------------------

  describe('PLANT category', () => {
    it('renders plant name and species', () => {
      renderWithProviders(<RecipientCard recipient={createPlantRecipient()} />);

      expect(screen.getByText('Fern')).toBeInTheDocument();
      // plantSpecies appears in header (secondary info) and body (Species dd)
      expect(screen.getAllByText('Boston Fern').length).toBeGreaterThanOrEqual(1);
    });

    it('displays Plant category chip', () => {
      renderWithProviders(<RecipientCard recipient={createPlantRecipient()} />);

      expect(screen.getByText('Plant')).toBeInTheDocument();
    });

    it('shows Type and Species fields in card body', () => {
      renderWithProviders(<RecipientCard recipient={createPlantRecipient()} />);

      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Species')).toBeInTheDocument();
    });

    it('shows dash when plantSpecies is missing', () => {
      renderWithProviders(
        <RecipientCard recipient={createPlantRecipient({ plantSpecies: null })} />
      );

      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    it('links to /recipients/plant-1', () => {
      renderWithProviders(<RecipientCard recipient={createPlantRecipient()} />);

      const link = screen.getByRole('link', { name: /view details/i });
      expect(link).toHaveAttribute('href', '/recipients/plant-1');
    });

    it('renders quick actions for indoor subtype', () => {
      renderWithProviders(<RecipientCard recipient={createPlantRecipient()} />);

      expect(screen.getByTitle('Water')).toBeInTheDocument();
      expect(screen.getByTitle('Fertilize')).toBeInTheDocument();
      expect(screen.getByTitle('Prune')).toBeInTheDocument();
    });

    it('does not render pet-specific quick actions', () => {
      renderWithProviders(<RecipientCard recipient={createPlantRecipient()} />);

      expect(screen.queryByTitle('Walk')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Feed')).not.toBeInTheDocument();
    });
  });

  // -- PERSON rendering -----------------------------------------------------

  describe('PERSON category', () => {
    it('renders person name and relationship', () => {
      renderWithProviders(<RecipientCard recipient={createPersonRecipient()} />);

      expect(screen.getByText('Grandma')).toBeInTheDocument();
      // Relationship appears in header (secondary info) and body (dd)
      expect(screen.getAllByText('Grandmother').length).toBeGreaterThanOrEqual(1);
    });

    it('displays Person category chip', () => {
      renderWithProviders(<RecipientCard recipient={createPersonRecipient()} />);

      expect(screen.getByText('Person')).toBeInTheDocument();
    });

    it('shows Type and Relationship fields in card body', () => {
      renderWithProviders(<RecipientCard recipient={createPersonRecipient()} />);

      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Relationship')).toBeInTheDocument();
    });

    it('shows dash when relationship is missing', () => {
      renderWithProviders(
        <RecipientCard recipient={createPersonRecipient({ relationship: null })} />
      );

      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    it('links to /recipients/person-1', () => {
      renderWithProviders(<RecipientCard recipient={createPersonRecipient()} />);

      const link = screen.getByRole('link', { name: /view details/i });
      expect(link).toHaveAttribute('href', '/recipients/person-1');
    });

    it('renders quick actions for elder subtype', () => {
      renderWithProviders(<RecipientCard recipient={createPersonRecipient()} />);

      expect(screen.getByTitle('Meal')).toBeInTheDocument();
      expect(screen.getByTitle('Medicate')).toBeInTheDocument();
      expect(screen.getByTitle('Doctor')).toBeInTheDocument();
    });

    it('does not render pet-specific quick actions for person', () => {
      renderWithProviders(<RecipientCard recipient={createPersonRecipient()} />);

      expect(screen.queryByTitle('Walk')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Feed')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Litter Box')).not.toBeInTheDocument();
    });
  });

  // -- Shared chip ----------------------------------------------------------

  describe('Shared access badge', () => {
    it('shows Shared chip when _accessType is shared', () => {
      renderWithProviders(
        <RecipientCard recipient={createPetRecipient({ _accessType: 'shared' })} />
      );

      expect(screen.getByText('Shared')).toBeInTheDocument();
    });

    it('does not show Shared chip for owner', () => {
      renderWithProviders(
        <RecipientCard recipient={createPetRecipient({ _accessType: 'owner' })} />
      );

      expect(screen.queryByText('Shared')).not.toBeInTheDocument();
    });
  });

  // -- Secondary info helper ------------------------------------------------

  describe('secondary info', () => {
    it('shows breed as secondary info for pets', () => {
      renderWithProviders(
        <RecipientCard recipient={createPetRecipient({ breed: 'Golden Retriever' })} />
      );

      // Breed appears in header (secondary) and body (dd)
      expect(screen.getAllByText('Golden Retriever').length).toBeGreaterThanOrEqual(1);
    });

    it('falls back to formatted subtype when breed is missing for pets', () => {
      renderWithProviders(
        <RecipientCard recipient={createPetRecipient({ breed: null, subtype: 'BIRD' })} />
      );

      // "Bird" appears in header (secondary) and body (Type dd)
      expect(screen.getAllByText('Bird').length).toBeGreaterThanOrEqual(1);
    });

    it('shows plantSpecies as secondary info for plants', () => {
      renderWithProviders(
        <RecipientCard recipient={createPlantRecipient({ plantSpecies: 'Monstera' })} />
      );

      // Appears in header (secondary) and body (Species dd)
      expect(screen.getAllByText('Monstera').length).toBeGreaterThanOrEqual(1);
    });

    it('shows relationship as secondary info for person', () => {
      renderWithProviders(
        <RecipientCard recipient={createPersonRecipient({ relationship: 'Father' })} />
      );

      // Appears in header (secondary) and body (Relationship dd)
      expect(screen.getAllByText('Father').length).toBeGreaterThanOrEqual(1);
    });
  });

  // -- Quick action modal integration ---------------------------------------

  describe('quick action modals', () => {
    it('opens confirm modal for generic action and posts to API', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'log-1' }),
      });
      (global as GlobalWithFetch).fetch = mockFetch;

      renderWithProviders(<RecipientCard recipient={createPetRecipient()} />);

      // Click Feed (generic confirm modal)
      const feedButton = screen.getByTitle('Feed');
      fireEvent.click(feedButton);

      const modal = await screen.findByRole('dialog');
      const modalUtils = within(modal);

      expect(modalUtils.getByText(/Log feed for Buddy/i)).toBeInTheDocument();

      const confirmButton = modalUtils.getByRole('button', { name: /Log Feed/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/care-logs',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              petId: 'pet-1',
              activityType: 'FEED',
            }),
          })
        );
      });
    });

    it('closes confirm modal on cancel', async () => {
      renderWithProviders(<RecipientCard recipient={createPetRecipient()} />);

      const feedButton = screen.getByTitle('Feed');
      fireEvent.click(feedButton);

      const modal = await screen.findByRole('dialog');
      const modalUtils = within(modal);

      const cancelButton = modalUtils.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  // -- No quick actions without subtype -------------------------------------

  describe('missing subtype', () => {
    it('does not render quick actions when subtype is null', () => {
      renderWithProviders(
        <RecipientCard
          recipient={createPetRecipient({ subtype: null })}
        />
      );

      // Quick action buttons should not be present
      expect(screen.queryByTitle('Feed')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Walk')).not.toBeInTheDocument();
    });
  });
});
