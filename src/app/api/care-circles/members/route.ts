import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCareCircleMembersForPet } from '@/lib/carecircle';

// GET /api/care-circles/members?recipientId=...
// Returns the care circle members for a given pet.
//
// For v1 we only require that the caller is authenticated; if we decide we need
// stricter privacy later, we can enforce "must be owner or member" in one place.
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to view shared access' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get('recipientId');

    if (!recipientId) {
      return NextResponse.json(
        { error: 'recipientId query parameter is required' },
        { status: 400 },
      );
    }

    const members = await getCareCircleMembersForPet(recipientId);

    return NextResponse.json(
      {
        members,
        count: members.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('❌ Error in GET /api/care-circles/members:', error);

    return NextResponse.json(
      { error: 'Failed to fetch care circle members' },
      { status: 500 },
    );
  }
}