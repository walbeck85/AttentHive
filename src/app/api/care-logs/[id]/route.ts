// src/app/api/care-logs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { canWriteToPet } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import {
  apiLimiter,
  checkRateLimit,
  rateLimitResponse,
  getClientIp,
} from '@/lib/rate-limit';

type RouteContext = { params: Promise<{ id: string }> };

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

// PATCH /api/care-logs/[id]
// Updates an existing care log entry.
// Accepts: notes, photoUrl (can be null to remove)
// Sets editedAt timestamp on any modification.
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const { session, dbUser } = await getDbUserForSession();

    // Rate limit by user ID if authenticated, otherwise by IP
    const identifier = dbUser?.id ?? getClientIp(request);
    const rateLimitResult = await checkRateLimit(apiLimiter, identifier);

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    if (!session || !dbUser) {
      return NextResponse.json({ error: 'You must be logged in to edit care logs' }, { status: 401 });
    }

    // Find the care log first
    const careLog = await prisma.careLog.findUnique({
      where: { id },
      select: {
        id: true,
        recipientId: true,
        userId: true,
        notes: true,
        photoUrl: true,
      },
    });

    if (!careLog) {
      return NextResponse.json({ error: 'Care log not found' }, { status: 404 });
    }

    // Authorization: user must have write access to the pet
    // This allows both the original creator and other caregivers/owners to edit
    const hasWriteAccess = await canWriteToPet(dbUser.id, careLog.recipientId);

    if (!hasWriteAccess) {
      return NextResponse.json({ error: 'Care log not found' }, { status: 404 });
    }

    const body = (await request.json()) as {
      notes?: string | null;
      photoUrl?: string | null;
    };

    // Build update data - only include fields that were explicitly provided
    const updateData: { notes?: string | null; photoUrl?: string | null; editedAt?: Date } = {};
    let hasChanges = false;

    if ('notes' in body) {
      updateData.notes = body.notes;
      hasChanges = true;
    }

    if ('photoUrl' in body) {
      updateData.photoUrl = body.photoUrl;
      hasChanges = true;
    }

    if (!hasChanges) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Set editedAt timestamp
    updateData.editedAt = new Date();

    const updatedLog = await prisma.careLog.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Care log updated successfully',
        log: updatedLog,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error in PATCH /api/care-logs/[id]:', error);
    return NextResponse.json({ error: 'Failed to update care log' }, { status: 500 });
  }
}

// DELETE /api/care-logs/[id]
// Deletes a care log entry.
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const { session, dbUser } = await getDbUserForSession();

    // Rate limit by user ID if authenticated, otherwise by IP
    const identifier = dbUser?.id ?? getClientIp(request);
    const rateLimitResult = await checkRateLimit(apiLimiter, identifier);

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    if (!session || !dbUser) {
      return NextResponse.json({ error: 'You must be logged in to delete care logs' }, { status: 401 });
    }

    // Find the care log first
    const careLog = await prisma.careLog.findUnique({
      where: { id },
      select: {
        id: true,
        recipientId: true,
        userId: true,
      },
    });

    if (!careLog) {
      return NextResponse.json({ error: 'Care log not found' }, { status: 404 });
    }

    // Authorization: user must have write access to the pet
    const hasWriteAccess = await canWriteToPet(dbUser.id, careLog.recipientId);

    if (!hasWriteAccess) {
      return NextResponse.json({ error: 'Care log not found' }, { status: 404 });
    }

    await prisma.careLog.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Care log deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('❌ Error in DELETE /api/care-logs/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete care log' }, { status: 500 });
  }
}
