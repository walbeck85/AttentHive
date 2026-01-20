import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSharedPetsForUser } from '@/lib/hive';
import {
  apiLimiter,
  checkRateLimit,
  rateLimitResponse,
  getClientIp,
} from '@/lib/rate-limit';

// GET /api/hives/shared-pets
// Returns all pets where the current user has Hive access.
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Get DB user early for rate limiting
    const dbUser = session?.user?.email
      ? await prisma.user.upsert({
          where: { email: session.user.email },
          update: {},
          create: {
            email: session.user.email,
            name: session.user.name ?? '',
            passwordHash: 'google-oauth',
          },
        })
      : null;

    // Rate limit by user ID if authenticated, otherwise by IP
    const identifier = dbUser?.id ?? getClientIp(request);
    const rateLimitResult = await checkRateLimit(apiLimiter, identifier);

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to view shared pets' },
        { status: 401 },
      );
    }

    // dbUser was already created/fetched above for rate limiting
    const memberships = await getSharedPetsForUser(dbUser!.id);

    // Shape the data conveniently for the UI:
    // - spread the Recipient fields
    // - attach a role marker so the frontend knows the access level
    const sharedPets = memberships.map((membership) => ({
      ...membership.recipient,
      _hiveRole: membership.role,
    }));

    return NextResponse.json(
      {
        sharedPets,
        count: sharedPets.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('❌ Error in GET /api/hives/shared-pets:', error);

    return NextResponse.json(
      { error: 'Failed to fetch shared pets' },
      { status: 500 },
    );
  }
}