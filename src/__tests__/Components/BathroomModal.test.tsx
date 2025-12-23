import React from 'react';
import { screen, fireEvent } from '../../test-utils';
import { renderWithProviders } from '../../test-utils';
import BathroomModal from '../../components/pets/BathroomModal';

describe('BathroomModal', () => {
  const defaultProps = {
    open: true,
    petName: 'Buddy',
    onConfirm: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders modal when open is true', () => {
      renderWithProviders(<BathroomModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Log bathroom for Buddy')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      renderWithProviders(<BathroomModal {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders pee and poo buttons', () => {
      renderWithProviders(<BathroomModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /pee/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /poo/i })).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      renderWithProviders(<BathroomModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('displays pet name in title', () => {
      renderWithProviders(<BathroomModal {...defaultProps} petName="Max" />);

      expect(screen.getByText('Log bathroom for Max')).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('calls onConfirm with pee subtype when pee button is clicked', () => {
      const onConfirm = jest.fn();
      renderWithProviders(<BathroomModal {...defaultProps} onConfirm={onConfirm} />);

      const peeButton = screen.getByRole('button', { name: /pee/i });
      fireEvent.click(peeButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onConfirm).toHaveBeenCalledWith({ subtype: 'pee' });
    });

    it('calls onConfirm with poo subtype when poo button is clicked', () => {
      const onConfirm = jest.fn();
      renderWithProviders(<BathroomModal {...defaultProps} onConfirm={onConfirm} />);

      const pooButton = screen.getByRole('button', { name: /poo/i });
      fireEvent.click(pooButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onConfirm).toHaveBeenCalledWith({ subtype: 'poo' });
    });
  });

  describe('Cancel', () => {
    it('calls onClose when cancel button is clicked', () => {
      const onClose = jest.fn();
      renderWithProviders(<BathroomModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = jest.fn();
      renderWithProviders(<BathroomModal {...defaultProps} onClose={onClose} />);

      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onConfirm when cancelled', () => {
      const onConfirm = jest.fn();
      const onClose = jest.fn();
      renderWithProviders(
        <BathroomModal {...defaultProps} onConfirm={onConfirm} onClose={onClose} />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });
});
