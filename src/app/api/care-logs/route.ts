import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation Schema
const createLogSchema = z.object({
  recipientId: z.string().min(1, "Pet ID is required"),
  activityType: z.enum(['FEED', 'WALK', 'MEDICATE', 'ACCIDENT']),
  notes: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Auth Check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Body
    const body = await request.json();
    
    console.log('📝 POST /api/care-logs received:', body);

    // 3. Validate Input
    const result = createLogSchema.safeParse(body);
    if (!result.success) {
      console.error('❌ Validation Error:', result.error.flatten());
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { recipientId, activityType, notes } = result.data;

    // 4. Security: Verify Ownership/Access
    const pet = await prisma.recipient.findFirst({
      where: {
        id: recipientId,
        OR: [
          { ownerId: session.user.id },
          { careCircles: { some: { userId: session.user.id } } }
        ]
      }
    });

    if (!pet) {
      console.error(`❌ Access denied for user ${session.user.id} to pet ${recipientId}`);
      return NextResponse.json({ error: 'Pet not found or access denied' }, { status: 403 });
    }

    // 5. Create Log
    const newLog = await prisma.careLog.create({
      data: {
        recipientId,
        userId: session.user.id,
        activityType,
        notes: notes || null,
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    console.log('✅ Activity Logged:', newLog.id);
    return NextResponse.json(newLog, { status: 201 });

  } catch (error) {
    console.error('❌ SERVER ERROR in POST /api/care-logs:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}