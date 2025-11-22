import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: petId } = await params;

    // --- DEBUG LOGS START ---
    console.log('\n🔍 --- DEBUGGING PET DETAIL API ---');
    console.log('👤 User ID:', session?.user?.id);
    console.log('🐕 Pet ID from URL:', petId);
    // --- DEBUG LOGS END ---

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!petId) {
      console.log('❌ Pet ID is missing or undefined');
      return NextResponse.json({ error: 'Invalid Pet ID' }, { status: 400 });
    }

    const pet = await prisma.recipient.findFirst({
      where: {
        id: petId,
        OR: [
          { ownerId: session.user.id },
          { careCircles: { some: { userId: session.user.id } } }
        ]
      },
    });

    // --- DEBUG LOGS START ---
    console.log('✅ Database Result:', pet ? `Found ${pet.name}` : 'Not Found');
    if (!pet) {
      // Double check: Does the pet exist at all?
      const exists = await prisma.recipient.findUnique({ where: { id: petId } });
      console.log('🧐 Does pet exist ANYWHERE?', exists ? `Yes, owned by ${exists.ownerId}` : 'No, ID is invalid');
    }
    console.log('----------------------------------\n');
    // --- DEBUG LOGS END ---

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    return NextResponse.json({ pet }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fetching pet details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pet details' },
      { status: 500 }
    );
  }
}