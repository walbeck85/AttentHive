// src/app/api/care-recipients/[id]/photo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canEditPet, type PetWithOwnership } from '@/lib/permissions';
import {
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  detectImageType,
} from '@/lib/storage';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import {
  apiLimiter,
  checkRateLimit,
  rateLimitResponse,
  getClientIp,
} from '@/lib/rate-limit';

// Force Node runtime so file uploads and Supabase SDK behave consistently.
export const runtime = 'nodejs';

const BUCKET = 'pet-photos';

type RouteContext = { params: Promise<{ id: string }> };

// Small helper to create JSON responses without relying on NextResponse.json,
// which can behave differently in Jest / non-Next environments.
function jsonResponse(body: unknown, init?: ResponseInit): NextResponse {
  return new NextResponse(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

export async function POST(
  req: NextRequest,
  context: RouteContext
) {
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
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!dbUser) {
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
      return jsonResponse(
        { error: 'Pet not found or you do not have permission to modify it.' },
        { status: 404 }
      );
    }

    const pet: PetWithOwnership = {
      ownerId: recipient.ownerId,
      members: recipient.hives,
    };

    if (!canEditPet(pet, dbUser.id)) {
      return jsonResponse(
        { error: 'Pet not found or you do not have permission to modify it.' },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return jsonResponse(
        { error: 'A file field named "file" is required.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      console.warn(`Upload rejected: ${sizeMB}MB exceeds 10MB limit`);
      return jsonResponse(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 413 }
      );
    }

    // Read file bytes for magic-byte validation
    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    // SECURITY: Validate actual file contents, not client-provided MIME type.
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

    const extension = detectedType.split('/')[1] ?? 'jpg';
    const objectPath = `pets/${recipient.id}/${Date.now()}.${extension}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, fileBytes, {
        contentType: detectedType,
        upsert: true,
      });

    if (error || !data) {
      console.error('Supabase upload error:', error);
      return jsonResponse(
        { error: 'Failed to upload image to storage.' },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(data.path);

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
    console.error('Error in pet photo upload route:', error);
    return jsonResponse(
      { error: 'Unexpected error while uploading image.' },
      { status: 500 }
    );
  }
}
