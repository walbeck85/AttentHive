import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { inviteMemberToPet } from '@/lib/hive';
import { prisma } from '@/lib/prisma';
import {
  apiLimiter,
  checkRateLimit,
  rateLimitResponse,
  getClientIp,
} from '@/lib/rate-limit';

// Keep the payload tight so this endpoint doesn't drift over time
const inviteSchema = z.object({
  recipientId: z.string().min(1, 'recipientId is required'),
  email: z.string().email('A valid email is required'),
  role: z.enum(['OWNER', 'CAREGIVER']).optional().default('CAREGIVER'),
});

export async function POST(request: NextRequest) {
  try {
    // Make sure only authenticated users can hit this
    const session = await getServerSession(authOptions);

    // Get DB user for rate limiting identifier
    const dbUser = session?.user?.email
      ? await prisma.user.findUnique({ where: { email: session.user.email } })
      : null;

    // Rate limit by user ID if authenticated, otherwise by IP
    const identifier = dbUser?.id ?? getClientIp(request);
    const rateLimitResult = await checkRateLimit(apiLimiter, identifier);

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to invite members' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);

    if (!parsed.success) {
      const validationErrors = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return NextResponse.json(
        {
          error: 'Invalid invite payload',
          validationErrors,
        },
        { status: 400 },
      );
    }

    const { recipientId, email, role } = parsed.data;

    // Permission checks + DB work live in the lib helper
    const membership = await inviteMemberToPet(recipientId, email, role);

    const roleLabel = role === 'OWNER' ? 'Co-owner' : 'Caregiver';
    return NextResponse.json(
      {
        message: `${roleLabel} invited successfully`,
        membership,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('❌ Error in POST /api/hives/invite:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Something went wrong while inviting a member',
      },
      { status: 500 },
    );
  }
}