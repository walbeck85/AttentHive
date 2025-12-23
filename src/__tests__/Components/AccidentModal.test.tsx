import React from 'react';
import { screen, fireEvent } from '../../test-utils';
import { renderWithProviders } from '../../test-utils';
import AccidentModal from '../../components/pets/AccidentModal';

describe('AccidentModal', () => {
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
      renderWithProviders(<AccidentModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Report accident for Buddy')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      renderWithProviders(<AccidentModal {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders pee, poo, and vomit buttons', () => {
      renderWithProviders(<AccidentModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /pee/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /poo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /vomit/i })).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      renderWithProviders(<AccidentModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('displays pet name in title', () => {
      renderWithProviders(<AccidentModal {...defaultProps} petName="Whiskers" />);

      expect(screen.getByText('Report accident for Whiskers')).toBeInTheDocument();
    });

    it('renders photo picker', () => {
      renderWithProviders(<AccidentModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /add photo/i })).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('calls onConfirm with pee subtype when pee button is clicked', () => {
      const onConfirm = jest.fn();
      renderWithProviders(<AccidentModal {...defaultProps} onConfirm={onConfirm} />);

      const peeButton = screen.getByRole('button', { name: /pee/i });
      fireEvent.click(peeButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onConfirm).toHaveBeenCalledWith({ subtype: 'pee' }, null);
    });

    it('calls onConfirm with poo subtype when poo button is clicked', () => {
      const onConfirm = jest.fn();
      renderWithProviders(<AccidentModal {...defaultProps} onConfirm={onConfirm} />);

      const pooButton = screen.getByRole('button', { name: /poo/i });
      fireEvent.click(pooButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onConfirm).toHaveBeenCalledWith({ subtype: 'poo' }, null);
    });

    it('calls onConfirm with vomit subtype when vomit button is clicked', () => {
      const onConfirm = jest.fn();
      renderWithProviders(<AccidentModal {...defaultProps} onConfirm={onConfirm} />);

      const vomitButton = screen.getByRole('button', { name: /vomit/i });
      fireEvent.click(vomitButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onConfirm).toHaveBeenCalledWith({ subtype: 'vomit' }, null);
    });
  });

  describe('Cancel', () => {
    it('calls onClose when cancel button is clicked', () => {
      const onClose = jest.fn();
      renderWithProviders(<AccidentModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = jest.fn();
      renderWithProviders(<AccidentModal {...defaultProps} onClose={onClose} />);

      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onConfirm when cancelled', () => {
      const onConfirm = jest.fn();
      const onClose = jest.fn();
      renderWithProviders(
        <AccidentModal {...defaultProps} onConfirm={onConfirm} onClose={onClose} />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });
});
