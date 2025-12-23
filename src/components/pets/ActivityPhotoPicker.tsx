// src/components/pets/ActivityPhotoPicker.tsx
'use client';

import React, { useRef, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import CloseIcon from '@mui/icons-material/Close';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

type ActivityPhotoPickerProps = {
  onPhotoChange: (file: File | null) => void;
  disabled?: boolean;
};

export default function ActivityPhotoPicker({
  onPhotoChange,
  disabled = false,
}: ActivityPhotoPickerProps) {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, etc.)');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('Image must be under 5MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    onPhotoChange(file);
  };

  const handleRemove = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setError(null);
    onPhotoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Stack spacing={1} alignItems="center" width="100%">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
        style={{ display: 'none' }}
      />

      {preview ? (
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
            src={preview}
            alt="Activity photo preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <IconButton
            onClick={handleRemove}
            disabled={disabled}
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
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Button
          onClick={handleAddClick}
          disabled={disabled}
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

      {error && (
        <Typography variant="caption" color="error" textAlign="center">
          {error}
        </Typography>
      )}
    </Stack>
  );
}
