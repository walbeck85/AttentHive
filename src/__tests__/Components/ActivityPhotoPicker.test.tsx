import React from 'react';
import { screen, fireEvent } from '../../test-utils';
import { renderWithProviders } from '../../test-utils';
import ActivityPhotoPicker from '../../components/pets/ActivityPhotoPicker';

describe('ActivityPhotoPicker', () => {
  const defaultProps = {
    onPhotoChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  describe('Rendering', () => {
    it('renders add photo button when no photo selected', () => {
      renderWithProviders(<ActivityPhotoPicker {...defaultProps} />);

      expect(screen.getByRole('button', { name: /add photo/i })).toBeInTheDocument();
    });

    it('renders hidden file input', () => {
      renderWithProviders(<ActivityPhotoPicker {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveStyle('display: none');
    });

    it('accepts image files only', () => {
      renderWithProviders(<ActivityPhotoPicker {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });
  });

  describe('Photo selection', () => {
    it('calls onPhotoChange when valid image is selected', () => {
      const onPhotoChange = jest.fn();
      renderWithProviders(<ActivityPhotoPicker {...defaultProps} onPhotoChange={onPhotoChange} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(onPhotoChange).toHaveBeenCalledWith(file);
    });

    it('shows error for non-image files', () => {
      const onPhotoChange = jest.fn();
      renderWithProviders(<ActivityPhotoPicker {...defaultProps} onPhotoChange={onPhotoChange} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByText(/please select an image file/i)).toBeInTheDocument();
      expect(onPhotoChange).not.toHaveBeenCalled();
    });

    it('shows error for files over 5MB', () => {
      const onPhotoChange = jest.fn();
      renderWithProviders(<ActivityPhotoPicker {...defaultProps} onPhotoChange={onPhotoChange} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      // Create a file object with size > 5MB
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByText(/image must be under 5mb/i)).toBeInTheDocument();
      expect(onPhotoChange).not.toHaveBeenCalled();
    });

    it('shows preview when photo is selected', () => {
      renderWithProviders(<ActivityPhotoPicker {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByAltText(/activity photo preview/i)).toBeInTheDocument();
    });

    it('hides add photo button after selection', () => {
      renderWithProviders(<ActivityPhotoPicker {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.queryByRole('button', { name: /add photo/i })).not.toBeInTheDocument();
    });
  });

  describe('Photo removal', () => {
    it('calls onPhotoChange with null when photo is removed', () => {
      const onPhotoChange = jest.fn();
      renderWithProviders(<ActivityPhotoPicker {...defaultProps} onPhotoChange={onPhotoChange} />);

      // First select a photo
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Then remove it
      const removeButton = screen.getByRole('button');
      fireEvent.click(removeButton);

      expect(onPhotoChange).toHaveBeenLastCalledWith(null);
    });

    it('shows add photo button again after removal', () => {
      renderWithProviders(<ActivityPhotoPicker {...defaultProps} />);

      // First select a photo
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Then remove it
      const removeButton = screen.getByRole('button');
      fireEvent.click(removeButton);

      expect(screen.getByRole('button', { name: /add photo/i })).toBeInTheDocument();
    });

    it('revokes object URL when photo is removed', () => {
      renderWithProviders(<ActivityPhotoPicker {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const removeButton = screen.getByRole('button');
      fireEvent.click(removeButton);

      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Disabled state', () => {
    it('disables file input when disabled prop is true', () => {
      renderWithProviders(<ActivityPhotoPicker {...defaultProps} disabled={true} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeDisabled();
    });

    it('disables add photo button when disabled prop is true', () => {
      renderWithProviders(<ActivityPhotoPicker {...defaultProps} disabled={true} />);

      const button = screen.getByRole('button', { name: /add photo/i });
      expect(button).toBeDisabled();
    });
  });
});
