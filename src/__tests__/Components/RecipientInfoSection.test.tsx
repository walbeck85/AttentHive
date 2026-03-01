import React from 'react';
import { screen } from '../../test-utils';
import { renderWithProviders } from '../../test-utils';
import RecipientInfoSection from '../../components/pets/RecipientInfoSection';
import type { PetData } from '../../components/pets/petDetailTypes';

// Base factory with all required fields.  Override per-test as needed.
function createRecipient(overrides: Partial<PetData> = {}): PetData {
  return {
    id: 'r-1',
    name: 'Test',
    type: null,
    breed: '',
    gender: '',
    birthDate: '',
    weight: 0,
    careLogs: [],
    ...overrides,
  };
}

describe('RecipientInfoSection', () => {
  // -- PET ------------------------------------------------------------------

  describe('PET category', () => {
    it('renders "Pet info" section header', () => {
      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({ category: 'PET', breed: 'Corgi' })}
        />
      );

      expect(screen.getByText('Pet info')).toBeInTheDocument();
    });

    it('displays breed when present', () => {
      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({ category: 'PET', breed: 'Labrador' })}
        />
      );

      expect(screen.getByText('Breed')).toBeInTheDocument();
      expect(screen.getByText('Labrador')).toBeInTheDocument();
    });

    it('displays weight with "lbs" suffix', () => {
      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({ category: 'PET', breed: 'Corgi', weight: 25 })}
        />
      );

      expect(screen.getByText('Weight')).toBeInTheDocument();
      expect(screen.getByText('25 lbs')).toBeInTheDocument();
    });

    it('displays gender as "Male" for MALE', () => {
      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({ category: 'PET', breed: 'Corgi', gender: 'MALE' })}
        />
      );

      expect(screen.getByText('Sex')).toBeInTheDocument();
      expect(screen.getByText('Male')).toBeInTheDocument();
    });

    it('displays gender as "Female" for FEMALE', () => {
      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({ category: 'PET', breed: 'Corgi', gender: 'FEMALE' })}
        />
      );

      expect(screen.getByText('Sex')).toBeInTheDocument();
      expect(screen.getByText('Female')).toBeInTheDocument();
    });

    it('shows "Last walked" for DOG with a WALK care log', () => {
      const now = new Date();
      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({
            category: 'PET',
            subtype: 'DOG',
            breed: 'Husky',
            careLogs: [
              {
                id: 'log-1',
                activityType: 'WALK',
                createdAt: now.toISOString(),
                user: { id: 'u-1', name: 'Will' },
              },
            ],
          })}
        />
      );

      expect(screen.getByText('Last walked')).toBeInTheDocument();
      expect(screen.getByText('just now')).toBeInTheDocument();
    });

    it('shows "Last fed" for DOG with a FEED care log', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({
            category: 'PET',
            subtype: 'DOG',
            breed: 'Poodle',
            careLogs: [
              {
                id: 'log-2',
                activityType: 'FEED',
                createdAt: oneHourAgo.toISOString(),
                user: { id: 'u-1', name: 'Will' },
              },
            ],
          })}
        />
      );

      expect(screen.getByText('Last fed')).toBeInTheDocument();
      expect(screen.getByText('1h ago')).toBeInTheDocument();
    });

    it('shows "Last litter box" for CAT with a LITTER_BOX care log', () => {
      const now = new Date();
      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({
            category: 'PET',
            subtype: 'CAT',
            breed: 'Siamese',
            careLogs: [
              {
                id: 'log-3',
                activityType: 'LITTER_BOX',
                createdAt: now.toISOString(),
                user: { id: 'u-1', name: 'Will' },
              },
            ],
          })}
        />
      );

      expect(screen.getByText('Last litter box')).toBeInTheDocument();
    });

    it('returns null when no stats are available', () => {
      const { container } = renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({
            category: 'PET',
            breed: '',
            gender: '',
            birthDate: '',
            weight: 0,
          })}
        />
      );

      // Component renders null when stats array is empty
      expect(container.firstChild).toBeNull();
    });
  });

  // -- PLANT ----------------------------------------------------------------

  describe('PLANT category', () => {
    it('renders "Plant info" section header', () => {
      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({
            category: 'PLANT',
            plantSpecies: 'Monstera',
          })}
        />
      );

      expect(screen.getByText('Plant info')).toBeInTheDocument();
    });

    it('displays species when present', () => {
      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({
            category: 'PLANT',
            plantSpecies: 'Boston Fern',
          })}
        />
      );

      expect(screen.getByText('Species')).toBeInTheDocument();
      expect(screen.getByText('Boston Fern')).toBeInTheDocument();
    });

    it('displays sunlight when present', () => {
      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({
            category: 'PLANT',
            plantSpecies: 'Cactus',
            sunlight: 'Full sun',
          })}
        />
      );

      expect(screen.getByText('Sunlight')).toBeInTheDocument();
      expect(screen.getByText('Full sun')).toBeInTheDocument();
    });

    it('displays water frequency when present', () => {
      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({
            category: 'PLANT',
            plantSpecies: 'Orchid',
            waterFrequency: 'Weekly',
          })}
        />
      );

      expect(screen.getByText('Water frequency')).toBeInTheDocument();
      expect(screen.getByText('Weekly')).toBeInTheDocument();
    });

    it('shows "Last watered" for plant with a WATER care log', () => {
      const now = new Date();
      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({
            category: 'PLANT',
            plantSpecies: 'Fern',
            careLogs: [
              {
                id: 'log-4',
                activityType: 'WATER',
                createdAt: now.toISOString(),
                user: { id: 'u-1', name: 'Will' },
              },
            ],
          })}
        />
      );

      expect(screen.getByText('Last watered')).toBeInTheDocument();
      expect(screen.getByText('just now')).toBeInTheDocument();
    });

    it('shows "Last fertilized" for plant with a FERTILIZE care log', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({
            category: 'PLANT',
            plantSpecies: 'Rose',
            careLogs: [
              {
                id: 'log-5',
                activityType: 'FERTILIZE',
                createdAt: twoDaysAgo.toISOString(),
                user: { id: 'u-1', name: 'Will' },
              },
            ],
          })}
        />
      );

      expect(screen.getByText('Last fertilized')).toBeInTheDocument();
      expect(screen.getByText('2d ago')).toBeInTheDocument();
    });

    it('returns null when no plant stats are available', () => {
      const { container } = renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({ category: 'PLANT' })}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  // -- PERSON ---------------------------------------------------------------

  describe('PERSON category', () => {
    it('renders "Person info" section header', () => {
      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({
            category: 'PERSON',
            relationship: 'Grandmother',
          })}
        />
      );

      expect(screen.getByText('Person info')).toBeInTheDocument();
    });

    it('displays relationship when present', () => {
      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({
            category: 'PERSON',
            relationship: 'Father',
          })}
        />
      );

      expect(screen.getByText('Relationship')).toBeInTheDocument();
      expect(screen.getByText('Father')).toBeInTheDocument();
    });

    it('displays age for person with birthDate', () => {
      // Use a birthDate that gives a stable age
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      threeYearsAgo.setMonth(0, 1); // Jan 1 to avoid edge cases

      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({
            category: 'PERSON',
            relationship: 'Son',
            birthDate: threeYearsAgo.toISOString(),
          })}
        />
      );

      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('3 yrs')).toBeInTheDocument();
    });

    it('shows "Last meal" for person with a MEAL care log', () => {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({
            category: 'PERSON',
            relationship: 'Mother',
            careLogs: [
              {
                id: 'log-6',
                activityType: 'MEAL',
                createdAt: thirtyMinAgo.toISOString(),
                user: { id: 'u-1', name: 'Will' },
              },
            ],
          })}
        />
      );

      expect(screen.getByText('Last meal')).toBeInTheDocument();
      expect(screen.getByText('30m ago')).toBeInTheDocument();
    });

    it('shows "Last wellness check" for person with a WELLNESS_CHECK care log', () => {
      const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({
            category: 'PERSON',
            relationship: 'Grandfather',
            careLogs: [
              {
                id: 'log-7',
                activityType: 'WELLNESS_CHECK',
                createdAt: yesterday.toISOString(),
                user: { id: 'u-1', name: 'Will' },
              },
            ],
          })}
        />
      );

      expect(screen.getByText('Last wellness check')).toBeInTheDocument();
      expect(screen.getByText('yesterday')).toBeInTheDocument();
    });

    it('returns null when no person stats are available', () => {
      const { container } = renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({ category: 'PERSON' })}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  // -- Default category fallback --------------------------------------------

  describe('default category', () => {
    it('treats missing category as PET', () => {
      renderWithProviders(
        <RecipientInfoSection
          recipient={createRecipient({ breed: 'Corgi' })}
        />
      );

      expect(screen.getByText('Pet info')).toBeInTheDocument();
      expect(screen.getByText('Corgi')).toBeInTheDocument();
    });
  });
});
