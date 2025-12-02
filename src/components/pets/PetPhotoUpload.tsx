// src/components/pets/PetPhotoUpload.tsx
'use client';

import React, { useRef, useState } from 'react';

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
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      {/* Left: bounded preview so large photos don't dominate the page. */}
      <div className="flex flex-col items-center gap-2 md:items-start">
        <div className="overflow-hidden rounded-3xl border border-[#E5D9C6] bg-[#FAF3E7]">
          <div className="relative w-40 aspect-[4/5] md:w-48">
            {imageUrl ? (
              // Using object-cover inside a fixed aspect ratio so tall phone photos
              // are cropped nicely instead of stretching the layout and the preview
              // stays a small, consistent size in the detail view.
              <img
                src={imageUrl}
                alt={`${name} photo`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="mm-muted-sm">No photo</span>
              </div>
            )}
          </div>
        </div>
        {status && (
          <p className="text-xs text-[#7A6A56] text-center md:text-left max-w-xs">
            {status}
          </p>
        )}
        {error && (
          <p className="text-xs text-red-700 text-center md:text-left max-w-xs">
            {error}
          </p>
        )}
      </div>

      {/* Right: upload controls and helper copy. */}
      <div className="flex-1 space-y-2 text-sm">
        <p className="font-semibold text-[#382110]">Pet photo</p>
        <p className="mm-muted-sm">
          Upload a clear photo so the care circle knows exactly who they&apos;re
          looking after.
        </p>

        <div className="mt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>

        {isUploading && (
          <p className="mm-muted-sm mt-2">
            Uploading photo… this might take a moment for larger images.
          </p>
        )}
      </div>
    </div>
  );
}