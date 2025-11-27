import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/pets/[id]/care-logs
// Fetches the full activity history for a specific pet
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check Authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
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
    const pet = await prisma.recipient.findFirst({
      where: {
        id: petId,
        OR: [
          { ownerId: session.user.id },
          {
            careCircles: {
              some: { userId: session.user.id },
            },
          },
        ],
      },
    });

    if (!pet) {
      return NextResponse.json(
        { error: 'Pet not found or access denied' },
        { status: 404 }
      );
    }

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
        petName: pet.name,
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