import React from 'react';
import { screen, fireEvent } from '../../test-utils';
import { renderWithProviders } from '../../test-utils';
import QuickActions from '../../components/pets/QuickActions';
import type { ActivityConfig } from '@/config/activityTypes';

describe('QuickActions', () => {
  const defaultProps = {
    petType: 'DOG' as const,
    onAction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DOG rendering', () => {
    it('renders Walk button for dogs', () => {
      renderWithProviders(<QuickActions {...defaultProps} petType="DOG" />);

      expect(screen.getByTitle('Walk')).toBeInTheDocument();
    });

    it('does not render Litter Box button for dogs', () => {
      renderWithProviders(<QuickActions {...defaultProps} petType="DOG" />);

      expect(screen.queryByTitle('Litter Box')).not.toBeInTheDocument();
    });

    it('renders shared action buttons for dogs', () => {
      renderWithProviders(<QuickActions {...defaultProps} petType="DOG" />);

      expect(screen.getByTitle('Feed')).toBeInTheDocument();
      expect(screen.getByTitle('Medicate')).toBeInTheDocument();
      expect(screen.getByTitle('Bathroom')).toBeInTheDocument();
      expect(screen.getByTitle('Accident')).toBeInTheDocument();
      expect(screen.getByTitle('Wellness Check')).toBeInTheDocument();
    });

    it('renders 6 buttons for dogs', () => {
      renderWithProviders(<QuickActions {...defaultProps} petType="DOG" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(6);
    });
  });

  describe('CAT rendering', () => {
    it('renders Litter Box button for cats', () => {
      renderWithProviders(<QuickActions {...defaultProps} petType="CAT" />);

      expect(screen.getByTitle('Litter Box')).toBeInTheDocument();
    });

    it('does not render Walk button for cats', () => {
      renderWithProviders(<QuickActions {...defaultProps} petType="CAT" />);

      expect(screen.queryByTitle('Walk')).not.toBeInTheDocument();
    });

    it('renders shared action buttons for cats', () => {
      renderWithProviders(<QuickActions {...defaultProps} petType="CAT" />);

      expect(screen.getByTitle('Feed')).toBeInTheDocument();
      expect(screen.getByTitle('Medicate')).toBeInTheDocument();
      expect(screen.getByTitle('Bathroom')).toBeInTheDocument();
      expect(screen.getByTitle('Accident')).toBeInTheDocument();
      expect(screen.getByTitle('Wellness Check')).toBeInTheDocument();
    });

    it('renders 6 buttons for cats', () => {
      renderWithProviders(<QuickActions {...defaultProps} petType="CAT" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(6);
    });
  });

  describe('Action callbacks', () => {
    it('calls onAction with correct config when Feed is clicked', () => {
      const onAction = jest.fn();
      renderWithProviders(<QuickActions {...defaultProps} onAction={onAction} />);

      const feedButton = screen.getByTitle('Feed');
      fireEvent.click(feedButton);

      expect(onAction).toHaveBeenCalledTimes(1);
      const config: ActivityConfig = onAction.mock.calls[0][0];
      expect(config.type).toBe('FEED');
      expect(config.modalType).toBe('confirm');
    });

    it('calls onAction with correct config when Walk is clicked (DOG)', () => {
      const onAction = jest.fn();
      renderWithProviders(<QuickActions {...defaultProps} petType="DOG" onAction={onAction} />);

      const walkButton = screen.getByTitle('Walk');
      fireEvent.click(walkButton);

      expect(onAction).toHaveBeenCalledTimes(1);
      const config: ActivityConfig = onAction.mock.calls[0][0];
      expect(config.type).toBe('WALK');
      expect(config.modalType).toBe('timer');
    });

    it('calls onAction with correct config when Litter Box is clicked (CAT)', () => {
      const onAction = jest.fn();
      renderWithProviders(<QuickActions {...defaultProps} petType="CAT" onAction={onAction} />);

      const litterBoxButton = screen.getByTitle('Litter Box');
      fireEvent.click(litterBoxButton);

      expect(onAction).toHaveBeenCalledTimes(1);
      const config: ActivityConfig = onAction.mock.calls[0][0];
      expect(config.type).toBe('LITTER_BOX');
      expect(config.modalType).toBe('confirm');
    });

    it('calls onAction with correct config when Bathroom is clicked', () => {
      const onAction = jest.fn();
      renderWithProviders(<QuickActions {...defaultProps} onAction={onAction} />);

      const bathroomButton = screen.getByTitle('Bathroom');
      fireEvent.click(bathroomButton);

      expect(onAction).toHaveBeenCalledTimes(1);
      const config: ActivityConfig = onAction.mock.calls[0][0];
      expect(config.type).toBe('BATHROOM');
      expect(config.modalType).toBe('bathroom');
    });

    it('calls onAction with correct config when Accident is clicked', () => {
      const onAction = jest.fn();
      renderWithProviders(<QuickActions {...defaultProps} onAction={onAction} />);

      const accidentButton = screen.getByTitle('Accident');
      fireEvent.click(accidentButton);

      expect(onAction).toHaveBeenCalledTimes(1);
      const config: ActivityConfig = onAction.mock.calls[0][0];
      expect(config.type).toBe('ACCIDENT');
      expect(config.modalType).toBe('accident');
    });

    it('calls onAction with correct config when Wellness Check is clicked', () => {
      const onAction = jest.fn();
      renderWithProviders(<QuickActions {...defaultProps} onAction={onAction} />);

      const wellnessButton = screen.getByTitle('Wellness Check');
      fireEvent.click(wellnessButton);

      expect(onAction).toHaveBeenCalledTimes(1);
      const config: ActivityConfig = onAction.mock.calls[0][0];
      expect(config.type).toBe('WELLNESS_CHECK');
      expect(config.modalType).toBe('confirm');
    });
  });

  describe('Event propagation', () => {
    it('stops event propagation on button click', () => {
      const onAction = jest.fn();
      const parentClick = jest.fn();

      renderWithProviders(
        <div onClick={parentClick}>
          <QuickActions {...defaultProps} onAction={onAction} />
        </div>
      );

      const feedButton = screen.getByTitle('Feed');
      fireEvent.click(feedButton);

      expect(onAction).toHaveBeenCalledTimes(1);
      expect(parentClick).not.toHaveBeenCalled();
    });
  });
});
