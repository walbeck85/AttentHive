import React from 'react';
import { screen, fireEvent, waitFor } from '../../test-utils';
import { renderWithProviders } from '../../test-utils';
import EditActivityModal from '../../components/pets/EditActivityModal';
import type { CareLog } from '../../components/pets/petDetailTypes';

// Mock fetch globally
global.fetch = jest.fn();

describe('EditActivityModal', () => {
  const mockCareLog: CareLog = {
    id: 'log-1',
    activityType: 'FEED',
    createdAt: '2024-01-15T10:00:00Z',
    notes: 'Morning feeding',
    metadata: null,
    user: { id: 'user-1', name: 'Test User' },
    photoUrl: null,
    editedAt: null,
  };

  const defaultProps = {
    open: true,
    careLog: mockCareLog,
    onSave: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  describe('Rendering', () => {
    it('renders modal when open is true', () => {
      renderWithProviders(<EditActivityModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit activity')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      renderWithProviders(<EditActivityModal {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('does not render when careLog is null', () => {
      renderWithProviders(<EditActivityModal {...defaultProps} careLog={null} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('displays activity type label', () => {
      renderWithProviders(<EditActivityModal {...defaultProps} />);

      // FEED activity type displays as "Feed"
      expect(screen.getByText('Feed')).toBeInTheDocument();
    });

    it('renders notes field with current value', () => {
      renderWithProviders(<EditActivityModal {...defaultProps} />);

      const notesField = screen.getByLabelText(/notes/i);
      expect(notesField).toHaveValue('Morning feeding');
    });

    it('renders cancel and save buttons', () => {
      renderWithProviders(<EditActivityModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('renders add photo button when no photo', () => {
      renderWithProviders(<EditActivityModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /add photo/i })).toBeInTheDocument();
    });

    it('renders photo preview when careLog has photoUrl', () => {
      const careLogWithPhoto = {
        ...mockCareLog,
        photoUrl: 'https://example.com/photo.jpg',
      };
      renderWithProviders(
        <EditActivityModal {...defaultProps} careLog={careLogWithPhoto} />
      );

      expect(screen.getByAltText('Activity photo')).toBeInTheDocument();
    });
  });

  describe('Notes editing', () => {
    it('updates notes field on change', () => {
      renderWithProviders(<EditActivityModal {...defaultProps} />);

      const notesField = screen.getByLabelText(/notes/i);
      fireEvent.change(notesField, { target: { value: 'Updated notes' } });

      expect(notesField).toHaveValue('Updated notes');
    });
  });

  describe('Saving', () => {
    it('calls PATCH endpoint when notes are changed', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' }),
      });

      const onSave = jest.fn();
      renderWithProviders(<EditActivityModal {...defaultProps} onSave={onSave} />);

      const notesField = screen.getByLabelText(/notes/i);
      fireEvent.change(notesField, { target: { value: 'Updated notes' } });

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/care-logs/log-1',
          expect.objectContaining({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('Updated notes'),
          })
        );
      });
    });

    it('calls onSave with updated care log on success', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' }),
      });

      const onSave = jest.fn();
      renderWithProviders(<EditActivityModal {...defaultProps} onSave={onSave} />);

      const notesField = screen.getByLabelText(/notes/i);
      fireEvent.change(notesField, { target: { value: 'Updated notes' } });

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'log-1',
            notes: 'Updated notes',
            editedAt: expect.any(String),
          })
        );
      });
    });

    it('shows error message on save failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to update' }),
      });

      renderWithProviders(<EditActivityModal {...defaultProps} />);

      const notesField = screen.getByLabelText(/notes/i);
      fireEvent.change(notesField, { target: { value: 'Updated notes' } });

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to update/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cancel', () => {
    it('calls onClose when cancel button is clicked', () => {
      const onClose = jest.fn();
      renderWithProviders(<EditActivityModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = jest.fn();
      renderWithProviders(<EditActivityModal {...defaultProps} onClose={onClose} />);

      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Photo handling', () => {
    it('uploads photo when new photo is selected and saved', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ photoUrl: 'https://example.com/new-photo.jpg' }),
        });

      const onSave = jest.fn();
      renderWithProviders(<EditActivityModal {...defaultProps} onSave={onSave} />);

      // Select a new photo
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/care-logs/log-1/photo',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });

    it('removes photo when remove button is clicked and saved', async () => {
      const careLogWithPhoto = {
        ...mockCareLog,
        photoUrl: 'https://example.com/photo.jpg',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' }),
      });

      const onSave = jest.fn();
      renderWithProviders(
        <EditActivityModal
          {...defaultProps}
          careLog={careLogWithPhoto}
          onSave={onSave}
        />
      );

      // Find the remove photo button by finding the button with the DeleteOutlineIcon
      const deleteIcon = screen.getByTestId('DeleteOutlineIcon');
      const removeButton = deleteIcon.closest('button');
      expect(removeButton).toBeTruthy();
      fireEvent.click(removeButton!);

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/care-logs/log-1',
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('"photoUrl":null'),
          })
        );
      });
    });
  });
});
