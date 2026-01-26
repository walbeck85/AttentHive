import React from 'react';
import { screen, fireEvent } from '../../test-utils';
import { renderWithProviders } from '../../test-utils';
import QuickActions from '../../components/pets/QuickActions';
import type { ActivityConfig } from '@/config/activityTypes';

describe('QuickActions', () => {
  const defaultProps = {
    subtype: 'DOG',
    onAction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DOG rendering', () => {
    it('renders Walk button for dogs', () => {
      renderWithProviders(<QuickActions {...defaultProps} subtype="DOG" />);

      expect(screen.getByTitle('Walk')).toBeInTheDocument();
    });

    it('does not render Litter Box button for dogs', () => {
      renderWithProviders(<QuickActions {...defaultProps} subtype="DOG" />);

      expect(screen.queryByTitle('Litter Box')).not.toBeInTheDocument();
    });

    it('renders expected action buttons for dogs', () => {
      renderWithProviders(<QuickActions {...defaultProps} subtype="DOG" />);

      expect(screen.getByTitle('Walk')).toBeInTheDocument();
      expect(screen.getByTitle('Feed')).toBeInTheDocument();
      expect(screen.getByTitle('Medicate')).toBeInTheDocument();
      expect(screen.getByTitle('Bathroom')).toBeInTheDocument();
      expect(screen.getByTitle('Accident')).toBeInTheDocument();
    });

    it('renders correct number of buttons for dogs', () => {
      renderWithProviders(<QuickActions {...defaultProps} subtype="DOG" />);

      // DOG actions from action-config: WALK, FEED, MEDICATE, BATHROOM, ACCIDENT, GROOMING, VET_VISIT, WELLNESS_CHECK, NOTE
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('CAT rendering', () => {
    it('renders Litter Box button for cats', () => {
      renderWithProviders(<QuickActions {...defaultProps} subtype="CAT" />);

      expect(screen.getByTitle('Litter Box')).toBeInTheDocument();
    });

    it('does not render Walk button for cats', () => {
      renderWithProviders(<QuickActions {...defaultProps} subtype="CAT" />);

      expect(screen.queryByTitle('Walk')).not.toBeInTheDocument();
    });

    it('renders expected action buttons for cats', () => {
      renderWithProviders(<QuickActions {...defaultProps} subtype="CAT" />);

      expect(screen.getByTitle('Feed')).toBeInTheDocument();
      expect(screen.getByTitle('Medicate')).toBeInTheDocument();
      expect(screen.getByTitle('Litter Box')).toBeInTheDocument();
      expect(screen.getByTitle('Accident')).toBeInTheDocument();
    });

    it('renders correct number of buttons for cats', () => {
      renderWithProviders(<QuickActions {...defaultProps} subtype="CAT" />);

      // CAT actions from action-config: FEED, MEDICATE, LITTER_BOX, ACCIDENT, GROOMING, VET_VISIT, WELLNESS_CHECK, NOTE
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('INDOOR plant rendering', () => {
    it('renders Water button for indoor plants', () => {
      renderWithProviders(<QuickActions {...defaultProps} subtype="INDOOR" />);

      expect(screen.getByTitle('Water')).toBeInTheDocument();
    });

    it('renders plant-specific action buttons', () => {
      renderWithProviders(<QuickActions {...defaultProps} subtype="INDOOR" />);

      expect(screen.getByTitle('Water')).toBeInTheDocument();
      expect(screen.getByTitle('Fertilize')).toBeInTheDocument();
      expect(screen.getByTitle('Prune')).toBeInTheDocument();
    });

    it('does not render pet-specific buttons for plants', () => {
      renderWithProviders(<QuickActions {...defaultProps} subtype="INDOOR" />);

      expect(screen.queryByTitle('Walk')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Feed')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Medicate')).not.toBeInTheDocument();
    });
  });

  describe('ELDER person rendering', () => {
    it('renders Meal button for elders', () => {
      renderWithProviders(<QuickActions {...defaultProps} subtype="ELDER" />);

      expect(screen.getByTitle('Meal')).toBeInTheDocument();
    });

    it('renders person-specific action buttons', () => {
      renderWithProviders(<QuickActions {...defaultProps} subtype="ELDER" />);

      expect(screen.getByTitle('Medicate')).toBeInTheDocument();
      expect(screen.getByTitle('Meal')).toBeInTheDocument();
      expect(screen.getByTitle('Doctor')).toBeInTheDocument();
    });

    it('does not render pet-specific buttons for people', () => {
      renderWithProviders(<QuickActions {...defaultProps} subtype="ELDER" />);

      expect(screen.queryByTitle('Walk')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Feed')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Litter Box')).not.toBeInTheDocument();
    });
  });

  describe('Action callbacks', () => {
    it('calls onAction with correct config when Feed is clicked', () => {
      const onAction = jest.fn();
      renderWithProviders(<QuickActions subtype="DOG" onAction={onAction} />);

      const feedButton = screen.getByTitle('Feed');
      fireEvent.click(feedButton);

      expect(onAction).toHaveBeenCalledTimes(1);
      const config: ActivityConfig = onAction.mock.calls[0][0];
      expect(config.type).toBe('FEED');
      expect(config.modalType).toBe('confirm');
    });

    it('calls onAction with correct config when Walk is clicked (DOG)', () => {
      const onAction = jest.fn();
      renderWithProviders(<QuickActions subtype="DOG" onAction={onAction} />);

      const walkButton = screen.getByTitle('Walk');
      fireEvent.click(walkButton);

      expect(onAction).toHaveBeenCalledTimes(1);
      const config: ActivityConfig = onAction.mock.calls[0][0];
      expect(config.type).toBe('WALK');
      expect(config.modalType).toBe('timer');
    });

    it('calls onAction with correct config when Litter Box is clicked (CAT)', () => {
      const onAction = jest.fn();
      renderWithProviders(<QuickActions subtype="CAT" onAction={onAction} />);

      const litterBoxButton = screen.getByTitle('Litter Box');
      fireEvent.click(litterBoxButton);

      expect(onAction).toHaveBeenCalledTimes(1);
      const config: ActivityConfig = onAction.mock.calls[0][0];
      expect(config.type).toBe('LITTER_BOX');
      expect(config.modalType).toBe('confirm');
    });

    it('calls onAction with correct config when Bathroom is clicked', () => {
      const onAction = jest.fn();
      renderWithProviders(<QuickActions subtype="DOG" onAction={onAction} />);

      const bathroomButton = screen.getByTitle('Bathroom');
      fireEvent.click(bathroomButton);

      expect(onAction).toHaveBeenCalledTimes(1);
      const config: ActivityConfig = onAction.mock.calls[0][0];
      expect(config.type).toBe('BATHROOM');
      expect(config.modalType).toBe('bathroom');
    });

    it('calls onAction with correct config when Accident is clicked', () => {
      const onAction = jest.fn();
      renderWithProviders(<QuickActions subtype="DOG" onAction={onAction} />);

      const accidentButton = screen.getByTitle('Accident');
      fireEvent.click(accidentButton);

      expect(onAction).toHaveBeenCalledTimes(1);
      const config: ActivityConfig = onAction.mock.calls[0][0];
      expect(config.type).toBe('ACCIDENT');
      expect(config.modalType).toBe('accident');
    });

    it('calls onAction with correct config when Water is clicked (INDOOR plant)', () => {
      const onAction = jest.fn();
      renderWithProviders(<QuickActions subtype="INDOOR" onAction={onAction} />);

      const waterButton = screen.getByTitle('Water');
      fireEvent.click(waterButton);

      expect(onAction).toHaveBeenCalledTimes(1);
      const config: ActivityConfig = onAction.mock.calls[0][0];
      expect(config.type).toBe('WATER');
      expect(config.modalType).toBe('confirm');
    });
  });

  describe('Event propagation', () => {
    it('stops event propagation on button click', () => {
      const onAction = jest.fn();
      const parentClick = jest.fn();

      renderWithProviders(
        <div onClick={parentClick}>
          <QuickActions subtype="DOG" onAction={onAction} />
        </div>
      );

      const feedButton = screen.getByTitle('Feed');
      fireEvent.click(feedButton);

      expect(onAction).toHaveBeenCalledTimes(1);
      expect(parentClick).not.toHaveBeenCalled();
    });
  });
});
