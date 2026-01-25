// src/app/api/pets/[id]/photo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canEditPet, type PetWithOwnership } from '@/lib/permissions';
import {
  apiLimiter,
  checkRateLimit,
  rateLimitResponse,
  getClientIp,
} from '@/lib/rate-limit';

// Force Node runtime so file uploads and Supabase SDK behave consistently.
export const runtime = 'nodejs';

// Keeping limits tight so uploads stay fast and don't quietly bloat storage.
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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
function detectImageType(buffer: Uint8Array): string | null {
  if (buffer.length < 12) {
    return null;
  }

  // JPEG: starts with FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG: starts with 89 50 4E 47 0D 0A 1A 0A (‰PNG\r\n\x1a\n)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
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
    buffer[11] === 0x50    // P
  ) {
    return 'image/webp';
  }

  return null;
}

type RouteContext = { params: Promise<{ id: string }> };

// Small helper to create JSON responses without relying on NextResponse.json,
// which can behave differently in Jest / non-Next environments.
// We still return a NextResponse so the rest of the app and tests can treat it
// like any other Response and call .status / .json() on it.
function jsonResponse(body: unknown, init?: ResponseInit): NextResponse {
  return new NextResponse(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

// We resolve the Supabase client lazily so a missing env var does not crash the build.
// Instead, we can return a controlled 500 and log loudly.
function getSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    // If this ever logs in production, it means env is misconfigured, not that a user did anything wrong.
    console.error(
      'Supabase server client missing configuration. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
    return null;
  }

  return createClient(url, serviceRoleKey);
}

export async function POST(
  req: NextRequest,
  context: RouteContext
) {
  // Next 16 passes dynamic route params as a Promise, so we resolve them up front.
  const { id } = await context.params;

  try {
    const session = await getServerSession(authOptions);

    // Get DB user for rate limiting
    const dbUser = session?.user?.email
      ? await prisma.user.findUnique({ where: { email: session.user.email } })
      : null;

    // Rate limit by user ID if authenticated, otherwise by IP
    const identifier = dbUser?.id ?? getClientIp(req);
    const rateLimitResult = await checkRateLimit(apiLimiter, identifier);

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    if (!session || !session.user?.email) {
      // If we don't have a real session, we fail fast rather than leaking any details about pets.
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!dbUser) {
      // If this hits, auth and DB are out of sync, which is a setup problem not a user mistake.
      return jsonResponse(
        { error: 'Authenticated user record not found in database.' },
        { status: 403 }
      );
    }

    // Fetch the pet with hive members to check permissions
    const recipient = await prisma.careRecipient.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        hives: {
          select: { userId: true, role: true },
        },
      },
    });

    if (!recipient) {
      // From the caller's perspective, this is just "not found" to avoid hinting at other users' data.
      return jsonResponse(
        { error: 'Pet not found or you do not have permission to modify it.' },
        { status: 404 }
      );
    }

    // Build ownership context for permission check
    const pet: PetWithOwnership = {
      ownerId: recipient.ownerId,
      members: recipient.hives,
    };

    // Both primary owner and co-owners can upload photos
    if (!canEditPet(pet, dbUser.id)) {
      return jsonResponse(
        { error: 'Pet not found or you do not have permission to modify it.' },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      // Being strict about the field name here keeps the client contract crystal clear.
      return jsonResponse(
        { error: 'A file field named "file" is required.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      // Hard-capping file size avoids the slow creep of huge images clogging storage and bandwidth.
      return jsonResponse(
        { error: 'File is too large. Maximum size is 5 MB.' },
        { status: 400 }
      );
    }

    // Read file bytes BEFORE validation so we can check magic bytes
    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    // SECURITY: Validate actual file contents via magic bytes, not client-provided MIME type.
    // Attackers can spoof file.type to upload malicious HTML/SVG as "image/jpeg".
    const detectedType = detectImageType(fileBytes);

    if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType)) {
      return jsonResponse(
        {
          error:
            'Invalid file content. Please upload a valid JPEG, PNG, or WebP image.',
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    if (!supabase) {
      // If env is broken, we surface a controlled failure instead of letting the whole app crash.
      return jsonResponse(
        { error: 'Storage is not configured on the server.' },
        { status: 500 }
      );
    }

    // Use detected type (not client-provided) for extension and content-type
    const extension = detectedType.split('/')[1] ?? 'jpg';

    // Bucket path includes the recipient id and a timestamp so re-uploads never collide.
    const objectPath = `pets/${recipient.id}/${Date.now()}.${extension}`;

    const { data, error } = await supabase.storage
      .from('pet-photos')
      .upload(objectPath, fileBytes, {
        contentType: detectedType, // Use validated type, not spoofable file.type
        upsert: true,
      });

    if (error || !data) {
      // If storage fails, we bail before touching the DB so state never drifts out of sync.
      console.error('Supabase upload error:', error);
      return jsonResponse(
        { error: 'Failed to upload image to storage.' },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('pet-photos').getPublicUrl(data.path);

    // Persist the new URL on the Recipient so every consumer reads from a single source of truth.
    const updatedRecipient = await prisma.careRecipient.update({
      where: { id: recipient.id },
      data: {
        imageUrl: publicUrl,
      },
    });

    return jsonResponse(
      {
        imageUrl: updatedRecipient.imageUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    // This is our last safety net so callers see a clean error instead of a generic 500 page.
    console.error('Error in pet photo upload route:', error);
    return jsonResponse(
      { error: 'Unexpected error while uploading image.' },
      { status: 500 }
    );
  }
}