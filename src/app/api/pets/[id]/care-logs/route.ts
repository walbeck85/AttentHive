import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Context type for the dynamic route params
type RouteContext = {
  params: {
    id: string;
  };
};

// GET /api/pets/[id]/care-logs
// Fetches the full activity history for a specific pet
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // 1. Check Authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      );
    }

    // await params in case of future Next.js versions, though in 14 it's synchronous
    const { id: petId } = context.params;

    // 2. Authorization: Verify the user has access to this pet
    // We check if the user is the OWNER or a member of the CARE CIRCLE
    const pet = await prisma.recipient.findFirst({
      where: {
        id: petId,
        OR: [
          { ownerId: session.user.id },
          {
            careCircles: {
              some: { userId: session.user.id }
            }
          }
        ]
      }
    });

    if (!pet) {
      return NextResponse.json(
        { error: 'Pet not found or access denied' },
        { status: 404 }
      );
    }

    // 3. Fetch the Care Logs
    const logs = await prisma.careLog.findMany({
      where: {
        recipientId: petId
      },
      orderBy: {
        createdAt: 'desc' // Newest first
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`✅ Fetched ${logs.length} logs for pet: ${pet.name}`);

    return NextResponse.json(
      { 
        logs,
        petName: pet.name 
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