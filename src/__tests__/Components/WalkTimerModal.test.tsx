import React from 'react';
import { screen, fireEvent, act, waitFor } from '../../test-utils';
import { renderWithProviders } from '../../test-utils';
import WalkTimerModal from '../../components/pets/WalkTimerModal';

describe('WalkTimerModal', () => {
  const defaultProps = {
    isOpen: true,
    petId: 'pet-1',
    petName: 'Buddy',
    onComplete: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders modal when isOpen is true', () => {
      renderWithProviders(<WalkTimerModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Walking Buddy')).toBeInTheDocument();
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      renderWithProviders(<WalkTimerModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders bathroom buttons', () => {
      renderWithProviders(<WalkTimerModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /pee/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /poop/i })).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      renderWithProviders(<WalkTimerModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /complete walk/i })).toBeInTheDocument();
    });
  });

  describe('Timer', () => {
    it('increments timer every second', () => {
      renderWithProviders(<WalkTimerModal {...defaultProps} />);

      expect(screen.getByText('00:00')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.getByText('00:01')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(59000);
      });
      expect(screen.getByText('01:00')).toBeInTheDocument();
    });

    it('formats time correctly for longer durations', () => {
      renderWithProviders(<WalkTimerModal {...defaultProps} />);

      act(() => {
        jest.advanceTimersByTime(125000); // 2 minutes 5 seconds
      });
      expect(screen.getByText('02:05')).toBeInTheDocument();
    });

    it('resets timer when modal reopens', () => {
      const { rerender } = renderWithProviders(<WalkTimerModal {...defaultProps} />);

      act(() => {
        jest.advanceTimersByTime(30000);
      });
      expect(screen.getByText('00:30')).toBeInTheDocument();

      // Close modal
      rerender(<WalkTimerModal {...defaultProps} isOpen={false} />);

      // Reopen modal
      rerender(<WalkTimerModal {...defaultProps} isOpen={true} />);

      expect(screen.getByText('00:00')).toBeInTheDocument();
    });
  });

  describe('Bathroom events', () => {
    it('adds pee event when pee button is clicked', () => {
      renderWithProviders(<WalkTimerModal {...defaultProps} />);

      const peeButton = screen.getByRole('button', { name: /pee/i });
      fireEvent.click(peeButton);

      expect(screen.getByText(/Bathroom Events/i)).toBeInTheDocument();
      expect(screen.getByText(/Pee at 0 min/i)).toBeInTheDocument();
    });

    it('adds poop event when poop button is clicked', () => {
      renderWithProviders(<WalkTimerModal {...defaultProps} />);

      const poopButton = screen.getByRole('button', { name: /poop/i });
      fireEvent.click(poopButton);

      expect(screen.getByText(/Bathroom Events/i)).toBeInTheDocument();
      expect(screen.getByText(/Poop at 0 min/i)).toBeInTheDocument();
    });

    it('tracks multiple bathroom events', () => {
      renderWithProviders(<WalkTimerModal {...defaultProps} />);

      const peeButton = screen.getByRole('button', { name: /pee/i });
      const poopButton = screen.getByRole('button', { name: /poop/i });

      fireEvent.click(peeButton);

      act(() => {
        jest.advanceTimersByTime(300000); // 5 minutes
      });

      fireEvent.click(poopButton);

      act(() => {
        jest.advanceTimersByTime(300000); // another 5 minutes
      });

      fireEvent.click(peeButton);

      expect(screen.getByText(/Pee at 0 min/i)).toBeInTheDocument();
      expect(screen.getByText(/Poop at 5 min/i)).toBeInTheDocument();
      expect(screen.getByText(/Pee at 10 min/i)).toBeInTheDocument();
    });

    it('does not show bathroom events section when empty', () => {
      renderWithProviders(<WalkTimerModal {...defaultProps} />);

      expect(screen.queryByText(/Bathroom Events/i)).not.toBeInTheDocument();
    });
  });

  describe('Complete Walk', () => {
    it('calls onComplete with correct metadata structure', async () => {
      const onComplete = jest.fn();
      renderWithProviders(<WalkTimerModal {...defaultProps} onComplete={onComplete} />);

      // Advance timer
      act(() => {
        jest.advanceTimersByTime(300000); // 5 minutes = 300 seconds
      });

      // Add bathroom event
      const peeButton = screen.getByRole('button', { name: /pee/i });
      fireEvent.click(peeButton);

      // Complete walk
      const completeButton = screen.getByRole('button', { name: /complete walk/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledTimes(1);
      });

      const callArg = onComplete.mock.calls[0][0];
      expect(callArg.durationSeconds).toBe(300);
      expect(callArg.bathroomEvents).toHaveLength(1);
      expect(callArg.bathroomEvents[0].type).toBe('URINATION');
      expect(callArg.bathroomEvents[0].minutesIntoWalk).toBe(5);
      expect(callArg.bathroomEvents[0].occurredAt).toBeDefined();
    });

    it('includes all bathroom events in metadata', async () => {
      const onComplete = jest.fn();
      renderWithProviders(<WalkTimerModal {...defaultProps} onComplete={onComplete} />);

      const peeButton = screen.getByRole('button', { name: /pee/i });
      const poopButton = screen.getByRole('button', { name: /poop/i });

      fireEvent.click(peeButton);
      fireEvent.click(poopButton);
      fireEvent.click(peeButton);

      const completeButton = screen.getByRole('button', { name: /complete walk/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledTimes(1);
      });

      const callArg = onComplete.mock.calls[0][0];
      expect(callArg.bathroomEvents).toHaveLength(3);
      expect(callArg.bathroomEvents[0].type).toBe('URINATION');
      expect(callArg.bathroomEvents[1].type).toBe('DEFECATION');
      expect(callArg.bathroomEvents[2].type).toBe('URINATION');
    });
  });

  describe('Cancel', () => {
    it('calls onCancel when cancel button is clicked', () => {
      const onCancel = jest.fn();
      renderWithProviders(<WalkTimerModal {...defaultProps} onCancel={onCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('does not call onComplete when cancelled', () => {
      const onComplete = jest.fn();
      const onCancel = jest.fn();
      renderWithProviders(
        <WalkTimerModal {...defaultProps} onComplete={onComplete} onCancel={onCancel} />
      );

      // Add some data
      const peeButton = screen.getByRole('button', { name: /pee/i });
      fireEvent.click(peeButton);

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
    });
  });
});
