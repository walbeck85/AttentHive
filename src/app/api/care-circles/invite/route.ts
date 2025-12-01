import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { inviteCaregiverToPet } from '@/lib/carecircle';

// Keep the payload tight so this endpoint doesn't drift over time
const inviteSchema = z.object({
  recipientId: z.string().min(1, 'recipientId is required'),
  email: z.string().email('A valid email is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Make sure only authenticated users can hit this
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to invite a caregiver' },
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

    const { recipientId, email } = parsed.data;

    // Permission checks + DB work live in the lib helper
    const membership = await inviteCaregiverToPet(recipientId, email);

    return NextResponse.json(
      {
        message: 'Caregiver invited successfully',
        membership,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('❌ Error in POST /api/care-circles/invite:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Something went wrong while inviting a caregiver',
      },
      { status: 500 },
    );
  }
}