// src/app/api/pets/[id]/photo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force Node runtime so file uploads and Supabase SDK behave consistently.
export const runtime = 'nodejs';

// Keeping limits tight so uploads stay fast and don’t quietly bloat storage.
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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

    if (!session || !session.user?.email) {
      // If we don’t have a real session, we fail fast rather than leaking any details about pets.
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve the current user record so we can enforce true ownership, not just "logged in".
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!dbUser) {
      // If this hits, auth and DB are out of sync, which is a setup problem not a user mistake.
      return jsonResponse(
        { error: 'Authenticated user record not found in database.' },
        { status: 403 }
      );
    }

    // Recipients are our "pets", so we key authorization off ownerId to keep access strict.
    const recipient = await prisma.recipient.findFirst({
      where: {
        id,
        ownerId: dbUser.id,
      },
    });

    if (!recipient) {
      // From the caller’s perspective, this is just "not found" to avoid hinting at other users’ data.
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

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      // Limiting MIME types up front keeps the bucket from turning into a general-purpose dump.
      return jsonResponse(
        {
          error:
            'Unsupported file type. Please upload a JPEG, PNG, or WebP image.',
        },
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

    const supabase = getSupabaseServerClient();

    if (!supabase) {
      // If env is broken, we surface a controlled failure instead of letting the whole app crash.
      return jsonResponse(
        { error: 'Storage is not configured on the server.' },
        { status: 500 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    const extension = file.type.split('/')[1] ?? 'jpg';

    // Bucket path includes the recipient id and a timestamp so re-uploads never collide.
    const objectPath = `pets/${recipient.id}/${Date.now()}.${extension}`;

    const { data, error } = await supabase.storage
      .from('pet-photos')
      .upload(objectPath, fileBytes, {
        contentType: file.type,
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
    const updatedRecipient = await prisma.recipient.update({
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