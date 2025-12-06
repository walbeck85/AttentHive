// src/components/pets/PetPhotoUpload.tsx
'use client';

import React, { useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';

// For now we keep this component very self-contained so any issues with
// Supabase or the API route are obvious in one place.
type Props = {
  recipientId: string;
  name: string;
  initialImageUrl?: string | null;
  // onUploaded lets parents sync their own copy of the pet record so header
  // avatars and other consumers update immediately after a successful upload.
  onUploaded?: (imageUrl: string) => void;
};

export default function PetPhotoUpload({
  recipientId,
  name,
  initialImageUrl = null,
  onUploaded,
}: Props) {
  // Local copy of the current image URL so we can optimistically update the UI.
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl);
  const [status, setStatus] = useState<string>(
    initialImageUrl ? '' : 'No photo'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keeping a ref to the input makes it easy to clear it after upload.
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    // If the user cancels the dialog, we just keep the existing state.
    if (!file) return;

    // Guard against obviously wrong inputs before we hit the network.
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPEG, PNG, etc.).');
      setStatus('No photo');
      // Clear the input so they can try again.
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const formData = new FormData();
    // The backend route expects the file under the "file" key; do not rename.
    formData.append('file', file);

    setIsUploading(true);
    setError(null);
    setStatus(
      'Uploading photo… keeping this synchronous so we can see if anything misbehaves.'
    );

    try {
      const response = await fetch(`/api/pets/${recipientId}/photo`, {
        method: 'POST',
        body: formData,
      });

      // Try to parse whatever the server sent back so we can surface useful info.
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        console.error('Photo upload failed', response.status, payload);
        const message =
          (payload as { error?: string } | null)?.error ||
          `Photo upload failed with status ${response.status}.`;
        setError(message);
        setStatus('No photo');
        return;
      }

      const typedPayload = payload as { imageUrl?: string };

      if (!typedPayload?.imageUrl) {
        console.error('Upload response missing imageUrl', payload);
        setError(
          'Upload succeeded but did not return an image URL. Please try again.'
        );
        setStatus('No photo');
        return;
      }

      // Success path: update local state and notify the parent.
      setImageUrl(typedPayload.imageUrl);
      setStatus('');
      if (onUploaded) {
        onUploaded(typedPayload.imageUrl);
      }
    } catch (uploadError) {
      console.error('Unexpected error during photo upload', uploadError);
      setError('Unexpected error uploading photo. Please try again.');
      setStatus('No photo');
    } finally {
      setIsUploading(false);
      // Clear the file input so selecting the same file again still fires change.
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={{ xs: 2.5, sm: 3 }}
      alignItems={{ xs: 'flex-start', md: 'flex-start' }}
      sx={{ width: '100%', minWidth: 0 }}
    >
      {/* Left: tightly bounded preview so this never turns into a hero banner. */}
      <Stack
        spacing={1.5}
        alignItems={{ xs: 'center', md: 'flex-start' }}
        sx={{
          width: { xs: '100%', md: 'auto' },
          maxWidth: { xs: '100%', sm: 360, md: 360 },
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: { xs: '100%', sm: 320, md: 360 },
            maxWidth: '100%',
            aspectRatio: '4 / 5',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflow: 'hidden',
          }}
        >
          {imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageUrl}
              alt={`${name} photo`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Stack
              sx={{ width: '100%', height: '100%' }}
              alignItems="center"
              justifyContent="center"
            >
              <Typography variant="body2" color="text.secondary">
                No photo
              </Typography>
            </Stack>
          )}
        </Box>
        {status && (
          <Typography variant="caption" color="text.secondary" textAlign="center">
            {status}
          </Typography>
        )}
        {error && (
          <Typography variant="caption" color="error" textAlign="center">
            {error}
          </Typography>
        )}
      </Stack>

      {/* Right: upload controls and helper copy. */}
      <Stack
        spacing={1}
        flex={1}
        sx={{
          minWidth: 0,
          width: '100%',
          pt: { xs: 0, md: 2 },
          pb: { md: 1 },
          alignSelf: { md: 'stretch' },
          justifyContent: { md: 'flex-end' },
        }}
      >
        <Typography variant="subtitle2" color="text.primary">
          Pet photo
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload a clear photo so the care circle knows exactly who they&apos;re looking after.
        </Typography>

        <Box>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </Box>

        {isUploading && (
          <Typography variant="body2" color="text.secondary">
            Uploading photo… this might take a moment for larger images.
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
