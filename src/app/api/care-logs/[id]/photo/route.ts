// src/app/api/care-logs/[id]/photo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { canWriteToPet } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { uploadImage, deleteImageByUrl } from '@/lib/storage';

// Force Node runtime so file uploads and Supabase SDK behave consistently.
export const runtime = 'nodejs';

const BUCKET = 'pet-photos';
const PATH_PREFIX = 'activity-photos';

type RouteContext = { params: Promise<{ id: string }> };

// Helper to create JSON responses
function jsonResponse(body: unknown, init?: ResponseInit): NextResponse {
  return new NextResponse(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

// Central helper: resolve the Prisma user backing the current session.
async function getDbUserForSession() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return { session: null as typeof session, dbUser: null as null };
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  return { session, dbUser };
}

// POST /api/care-logs/[id]/photo
// Uploads a photo for an existing care log.
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const { session, dbUser } = await getDbUserForSession();

    if (!session || !dbUser) {
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the care log
    const careLog = await prisma.careLog.findUnique({
      where: { id },
      select: {
        id: true,
        recipientId: true,
        photoUrl: true,
      },
    });

    if (!careLog) {
      return jsonResponse({ error: 'Care log not found' }, { status: 404 });
    }

    // Authorization: user must have write access to the pet
    const hasWriteAccess = await canWriteToPet(dbUser.id, careLog.recipientId);

    if (!hasWriteAccess) {
      return jsonResponse({ error: 'Care log not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return jsonResponse({ error: 'A file field named "file" is required.' }, { status: 400 });
    }

    // Upload the new photo
    const result = await uploadImage({
      file,
      bucket: BUCKET,
      pathPrefix: PATH_PREFIX,
      entityId: careLog.id,
    });

    if (!result.success) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }

    // Delete old photo if it exists
    if (careLog.photoUrl) {
      await deleteImageByUrl(careLog.photoUrl, BUCKET);
    }

    // Update the care log with new photo URL and editedAt timestamp
    const updatedLog = await prisma.careLog.update({
      where: { id },
      data: {
        photoUrl: result.publicUrl,
        editedAt: new Date(),
      },
    });

    return jsonResponse({ photoUrl: updatedLog.photoUrl }, { status: 200 });
  } catch (error) {
    console.error('Error in care log photo upload:', error);
    return jsonResponse({ error: 'Unexpected error while uploading image.' }, { status: 500 });
  }
}

// DELETE /api/care-logs/[id]/photo
// Removes the photo from a care log.
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const { session, dbUser } = await getDbUserForSession();

    if (!session || !dbUser) {
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the care log
    const careLog = await prisma.careLog.findUnique({
      where: { id },
      select: {
        id: true,
        recipientId: true,
        photoUrl: true,
      },
    });

    if (!careLog) {
      return jsonResponse({ error: 'Care log not found' }, { status: 404 });
    }

    // Authorization: user must have write access to the pet
    const hasWriteAccess = await canWriteToPet(dbUser.id, careLog.recipientId);

    if (!hasWriteAccess) {
      return jsonResponse({ error: 'Care log not found' }, { status: 404 });
    }

    if (!careLog.photoUrl) {
      return jsonResponse({ error: 'No photo to delete' }, { status: 400 });
    }

    // Delete from storage
    await deleteImageByUrl(careLog.photoUrl, BUCKET);

    // Update the care log
    await prisma.careLog.update({
      where: { id },
      data: {
        photoUrl: null,
        editedAt: new Date(),
      },
    });

    return jsonResponse({ message: 'Photo deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error in care log photo delete:', error);
    return jsonResponse({ error: 'Unexpected error while deleting image.' }, { status: 500 });
  }
}
