import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCareLogSchema = z.object({
  recipientId: z.string().cuid(),
  activityType: z.enum(["FEED", "WALK", "MEDICATE", "ACCIDENT"]),
  notes: z.string().optional(),
});

// POST /api/care-logs - Create a new activity log
export async function POST(request: NextRequest) {
  try {
    // Step 1: Check if user is logged in
    const session = await getServerSession(authOptions);
        
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to log activities' },
        { status: 401 }
      );
    }

    // Step 2: Get and validate request body
    const body = await request.json();
    
    const validationResult = createCareLogSchema.safeParse(body);
    
    if (!validationResult.success) {      
      const formattedErrors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return NextResponse.json(
        { 
          error: 'Invalid activity data',
          validationErrors: formattedErrors
        },
        { status: 400 }
      );
    }

    const { recipientId, activityType, notes } = validationResult.data;

    // Step 3: CRITICAL - Verify user has access to this pet
    const pet = await prisma.recipient.findFirst({
      where: {
        id: recipientId,
        OR: [
          // User owns this pet
          { ownerId: session.user.id },
          // OR user is in the care circle for this pet
          {
            careCircles: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      }
    });

    if (!pet) {
      return NextResponse.json(
        { error: 'Pet not found or you do not have access to this pet' },
        { status: 403 }
      );
    }

    // Step 4: Create the CareLog entry
    const careLog = await prisma.careLog.create({
      data: {
        recipientId,
        userId: session.user.id,
        activityType,
        notes: notes || null,
      },
      // Include user info in the response
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    console.log('✅ Activity logged successfully:', careLog.id, activityType);

    // Step 5: Return success response
    return NextResponse.json(
      {
        message: 'Activity logged successfully!',
        careLog
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('❌ Error in POST /api/care-logs:', error);
    return NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    );
  }
}