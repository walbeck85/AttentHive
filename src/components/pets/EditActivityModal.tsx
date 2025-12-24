// src/components/pets/EditActivityModal.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import { formatActivityDisplay } from '@/components/pets/petActivityUtils';
import type { CareLog } from '@/components/pets/petDetailTypes';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

type EditActivityModalProps = {
  open: boolean;
  careLog: CareLog | null;
  onSave: (updatedLog: CareLog) => void;
  onClose: () => void;
};

export default function EditActivityModal({
  open,
  careLog,
  onSave,
  onClose,
}: EditActivityModalProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [notes, setNotes] = useState('');
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens with a new care log
  useEffect(() => {
    if (careLog) {
      setNotes(careLog.notes ?? '');
      setExistingPhotoUrl(careLog.photoUrl ?? null);
      setNewPhoto(null);
      setNewPhotoPreview(null);
      setPhotoError(null);
      setError(null);
    }
  }, [careLog]);

  if (!open || !careLog) return null;

  const overlayColor = alpha(theme.palette.common.black, isDark ? 0.65 : 0.4);
  const cardBg = theme.palette.background.paper;
  const cardBorder = theme.palette.divider;
  const cardShadow = isDark
    ? `0 28px 70px ${alpha(theme.palette.common.black, 0.7)}`
    : `0 20px 50px ${alpha(theme.palette.common.black, 0.35)}`;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setPhotoError(null);

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select an image file (JPEG, PNG, etc.)');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setPhotoError('Image must be under 5MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setNewPhotoPreview(objectUrl);
    setNewPhoto(file);
    // Clear existing photo since we're replacing it
    setExistingPhotoUrl(null);
  };

  const handleRemovePhoto = () => {
    if (newPhotoPreview) {
      URL.revokeObjectURL(newPhotoPreview);
    }
    setNewPhotoPreview(null);
    setNewPhoto(null);
    setExistingPhotoUrl(null);
    setPhotoError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, update notes and/or remove photo via PATCH
      const patchBody: { notes?: string | null; photoUrl?: string | null } = {};
      let hasChanges = false;

      if (notes !== (careLog.notes ?? '')) {
        patchBody.notes = notes || null;
        hasChanges = true;
      }

      // If we're removing the photo (no new photo and no existing photo but there was one before)
      if (!newPhoto && !existingPhotoUrl && careLog.photoUrl) {
        patchBody.photoUrl = null;
        hasChanges = true;
      }

      if (hasChanges) {
        const patchRes = await fetch(`/api/care-logs/${careLog.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patchBody),
        });

        if (!patchRes.ok) {
          const data = await patchRes.json();
          throw new Error(data.error || 'Failed to update activity');
        }
      }

      // If we have a new photo, upload it
      let finalPhotoUrl = existingPhotoUrl;
      if (newPhoto) {
        const formData = new FormData();
        formData.append('file', newPhoto);

        const uploadRes = await fetch(`/api/care-logs/${careLog.id}/photo`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error || 'Failed to upload photo');
        }

        const uploadData = await uploadRes.json();
        finalPhotoUrl = uploadData.photoUrl;
      }

      // Build the updated care log
      const updatedLog: CareLog = {
        ...careLog,
        notes: notes || null,
        photoUrl: finalPhotoUrl,
        editedAt: new Date().toISOString(),
      };

      onSave(updatedLog);
      onClose();
    } catch (err) {
      console.error('Error saving activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (newPhotoPreview) {
      URL.revokeObjectURL(newPhotoPreview);
    }
    onClose();
  };

  const currentPhotoUrl = newPhotoPreview || existingPhotoUrl;
  const activityLabel = formatActivityDisplay(careLog.activityType, careLog.metadata);

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-activity-modal-title"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: theme.zIndex.modal,
        backgroundColor: overlayColor,
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 3,
      }}
      onClick={handleClose}
    >
      <Paper
        onClick={(e) => e.stopPropagation()}
        elevation={0}
        sx={{
          maxWidth: 480,
          width: 'min(480px, 100%)',
          borderRadius: 3,
          bgcolor: cardBg,
          border: `1px solid ${cardBorder}`,
          boxShadow: cardShadow,
          px: { xs: 2.5, sm: 3 },
          py: { xs: 2.25, sm: 2.75 },
          color: theme.palette.text.primary,
        }}
      >
        <Stack spacing={2.5}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography
                id="edit-activity-modal-title"
                variant="h6"
                sx={{ fontWeight: 700 }}
              >
                Edit activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activityLabel}
              </Typography>
            </Box>
            <IconButton
              onClick={handleClose}
              disabled={isLoading}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Notes field */}
          <TextField
            label="Notes (optional)"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading}
            fullWidth
            variant="outlined"
            placeholder="Add any notes about this activity..."
          />

          {/* Photo section */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Photo (optional)
            </Typography>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isLoading}
              style={{ display: 'none' }}
            />

            {currentPhotoUrl ? (
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 200,
                  aspectRatio: '4 / 3',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentPhotoUrl}
                  alt="Activity photo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <IconButton
                  onClick={handleRemovePhoto}
                  disabled={isLoading}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    bgcolor: alpha(theme.palette.common.black, 0.6),
                    color: 'white',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.common.black, 0.8),
                    },
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <Button
                onClick={handleAddPhotoClick}
                disabled={isLoading}
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<AddAPhotoIcon />}
                sx={{
                  borderColor: theme.palette.divider,
                  color: theme.palette.text.secondary,
                  textTransform: 'none',
                  py: 1,
                  px: 2,
                }}
              >
                Add photo
              </Button>
            )}

            {photoError && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                {photoError}
              </Typography>
            )}
          </Box>

          {/* Error message */}
          {error && (
            <Typography variant="body2" color="error" textAlign="center">
              {error}
            </Typography>
          )}

          {/* Action buttons */}
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleClose}
              disabled={isLoading}
              sx={{
                borderColor: isDark
                  ? alpha(theme.palette.common.white, 0.25)
                  : theme.palette.divider,
                color: theme.palette.text.primary,
                px: 2.5,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isLoading}
              sx={{ px: 2.5 }}
            >
              {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Save'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
