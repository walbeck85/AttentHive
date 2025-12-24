// src/lib/storage.ts
import 'server-only';

import { getSupabaseServerClient } from './supabase-server';

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Detect actual image type by checking magic bytes (file signature).
 *
 * SECURITY: Client-provided MIME types (file.type) can be spoofed.
 * An attacker could upload malicious HTML/SVG claiming to be "image/jpeg".
 * This function validates the actual file contents to prevent such attacks.
 *
 * @param buffer - First bytes of the file
 * @returns Detected MIME type or null if not a recognized image format
 */
export function detectImageType(buffer: Uint8Array): string | null {
  if (buffer.length < 12) {
    return null;
  }

  // JPEG: starts with FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: starts with 89 50 4E 47 0D 0A 1A 0A (‰PNG\r\n\x1a\n)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: starts with RIFF....WEBP (bytes 0-3: RIFF, bytes 8-11: WEBP)
  if (
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return 'image/webp';
  }

  return null;
}

export type UploadResult =
  | { success: true; publicUrl: string }
  | { success: false; error: string; status: number };

export type UploadImageParams = {
  file: File;
  bucket: string;
  pathPrefix: string;
  entityId: string;
};

/**
 * Validates and uploads an image to Supabase Storage.
 *
 * @param params.file - The File object to upload
 * @param params.bucket - Supabase Storage bucket name
 * @param params.pathPrefix - Path prefix (e.g., "pets" or "activity-photos")
 * @param params.entityId - ID to include in the path (pet ID or care log ID)
 * @returns Upload result with public URL or error details
 */
export async function uploadImage(
  params: UploadImageParams
): Promise<UploadResult> {
  const { file, bucket, pathPrefix, entityId } = params;

  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: 'File is too large. Maximum size is 5 MB.',
      status: 400,
    };
  }

  // Read file bytes for validation
  const arrayBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(arrayBuffer);

  // SECURITY: Validate actual file contents via magic bytes
  const detectedType = detectImageType(fileBytes);

  if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType)) {
    return {
      success: false,
      error: 'Invalid file content. Please upload a valid JPEG, PNG, or WebP image.',
      status: 400,
    };
  }

  const supabase = getSupabaseServerClient();
  const extension = detectedType.split('/')[1] ?? 'jpg';

  // Path pattern: {pathPrefix}/{entityId}-{timestamp}.{ext}
  const objectPath = `${pathPrefix}/${entityId}-${Date.now()}.${extension}`;

  const { data, error } = await supabase.storage.from(bucket).upload(objectPath, fileBytes, {
    contentType: detectedType,
    upsert: true,
  });

  if (error || !data) {
    console.error('Supabase upload error:', error);
    return {
      success: false,
      error: 'Failed to upload image to storage.',
      status: 500,
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return { success: true, publicUrl };
}

/**
 * Deletes an image from Supabase Storage by its public URL.
 *
 * @param publicUrl - The full public URL of the image
 * @param bucket - The bucket the image is stored in
 * @returns true if deletion succeeded, false otherwise
 */
export async function deleteImageByUrl(publicUrl: string, bucket: string): Promise<boolean> {
  try {
    // Extract the path from the public URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const url = new URL(publicUrl);
    const pathMatch = url.pathname.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+)`));

    if (!pathMatch || !pathMatch[1]) {
      console.error('Could not extract path from URL:', publicUrl);
      return false;
    }

    const objectPath = pathMatch[1];
    const supabase = getSupabaseServerClient();

    const { error } = await supabase.storage.from(bucket).remove([objectPath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}
