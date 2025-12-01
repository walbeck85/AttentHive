import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSharedPetsForUser } from '@/lib/carecircle';

// GET /api/care-circles/shared-pets
// Returns all pets where the current user has CareCircle access.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to view shared pets' },
        { status: 401 },
      );
    }

    // Mirror the get-or-create DB user pattern from /api/pets
    const dbUser = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: {
        email: session.user.email,
        name: session.user.name ?? '',
        // This value is never used for login; it just satisfies the schema.
        passwordHash: 'google-oauth',
      },
    });

    const memberships = await getSharedPetsForUser(dbUser.id);

    // Shape the data conveniently for the UI:
    // - spread the Recipient fields
    // - attach a role marker so the frontend knows the access level
    const sharedPets = memberships.map((membership) => ({
      ...membership.recipient,
      _careCircleRole: membership.role,
    }));

    return NextResponse.json(
      {
        sharedPets,
        count: sharedPets.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('❌ Error in GET /api/care-circles/shared-pets:', error);

    return NextResponse.json(
      { error: 'Failed to fetch shared pets' },
      { status: 500 },
    );
  }
}