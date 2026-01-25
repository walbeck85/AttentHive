import { NextRequest, NextResponse } from 'next/server';
import { getDbUserFromSession, canAccessPet } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// GET /api/pets/[id]/care-logs
// Fetches the full activity history for a specific pet
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check Authentication - use email-based lookup for OAuth compatibility
    const dbUser = await getDbUserFromSession();

    if (!dbUser) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      );
    }

    // 2. Unwrap dynamic route params (Next.js 16: params is a Promise)
    const { id: petId } = await params;

    if (!petId) {
      return NextResponse.json({ error: 'Invalid Pet ID' }, { status: 400 });
    }

    // 3. Authorization: verify the user has access to this specific pet
    const { canAccess } = await canAccessPet(dbUser.id, petId);

    if (!canAccess) {
      // Return 404 to avoid leaking pet existence information
      return NextResponse.json(
        { error: 'Pet not found' },
        { status: 404 }
      );
    }

    // Fetch pet name for response
    const pet = await prisma.careRecipient.findUnique({
      where: { id: petId },
      select: { name: true },
    });

    // 4. Fetch the Care Logs
    const logs = await prisma.careLog.findMany({
      where: {
        recipientId: petId,
      },
      orderBy: {
        createdAt: 'desc', // Newest first
      },
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
        logs,
        petName: pet?.name ?? 'Unknown',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error fetching care logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity history' },
      { status: 500 }
    );
  }
}