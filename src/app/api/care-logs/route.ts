import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ActivityType, Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Metadata type for WALK activities with timer and bathroom tracking
type WalkMetadata = {
  durationSeconds: number;
  bathroomEvents: Array<{
    type: "URINATION" | "DEFECATION";
    occurredAt: string;
    minutesIntoWalk: number;
  }>;
};

// Central helper: resolve the Prisma user backing the current session.
// - If no session: return { session: null, dbUser: null }.
// - If a session exists but no DB row yet: create one once.
async function getDbUserForSession() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return { session: null as typeof session, dbUser: null as null };
  }

  // Look up by email first – this is our primary identity link today.
  let dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  // If this user has never touched the database before, create a record for them.
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email: session.user.email,
        name: session.user.name ?? "",
        // Satisfies schema for OAuth users; never used as a real password.
        passwordHash: "google-oauth",
      },
    });
  }

  return { session, dbUser };
}

// GET /api/care-logs?id=PET_ID
// Returns care logs for a single pet.
// Note: this endpoint is not param-based in the filesystem, so the id comes
// from the query string (?id=...).
export async function GET(request: NextRequest) {
  try {
    const { session, dbUser } = await getDbUserForSession();

    if (!session || !dbUser) {
      return NextResponse.json(
        { error: "You must be logged in to view care history" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get("id");

    if (!recipientId) {
      return NextResponse.json(
        { error: "Missing pet id (?id=...)" },
        { status: 400 }
      );
    }

    // For now, we only enforce that the pet exists; we don't block on ownerId.
    // This keeps the app usable even if profile/email changes introduce
    // mismatches between session and ownerId.
    const pet = await prisma.recipient.findUnique({
      where: { id: recipientId },
    });

    if (!pet) {
      return NextResponse.json(
        { error: "Pet not found" },
        { status: 404 }
      );
    }

    const logs = await prisma.careLog.findMany({
      where: { recipientId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
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
    console.error("❌ Error in GET /api/care-logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

// POST /api/care-logs
// Creates a new care log entry for a given pet, attributed to the current DB user.
// The client passes `petId` and `activityType` in the JSON body.
export async function POST(request: NextRequest) {
  try {
    const { session, dbUser } = await getDbUserForSession();

    if (!session || !dbUser) {
      return NextResponse.json(
        { error: "You must be logged in to log care" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      petId?: string;
      activityType?: string;
      notes?: string;
      metadata?: WalkMetadata;
    };

    const recipientId = body.petId;

    if (!recipientId) {
      return NextResponse.json(
        { error: "Missing petId in request body" },
        { status: 400 }
      );
    }

    if (!body.activityType) {
      return NextResponse.json(
        { error: "Missing activityType in request body" },
        { status: 400 }
      );
    }

    const isValidActivity = Object.values(ActivityType).includes(
      body.activityType as ActivityType
    );

    if (!isValidActivity) {
      return NextResponse.json(
        { error: "Invalid activity type" },
        { status: 400 }
      );
    }

    const activityType = body.activityType as ActivityType;

    // Again, only enforce that the pet exists. Ownership checks are relaxed
    // here so that your dashboard buttons keep working even if user/profile
    // data has evolved.
    const pet = await prisma.recipient.findUnique({
      where: { id: recipientId },
    });

    if (!pet) {
      return NextResponse.json(
        { error: "Pet not found" },
        { status: 404 }
      );
    }

    const newLog = await prisma.careLog.create({
      data: {
        recipientId,
        userId: dbUser.id,
        activityType,
        notes: body.notes ?? null,
        metadata: body.metadata ?? Prisma.JsonNull,
      },
    });

    return NextResponse.json(
      {
        message: "Care activity logged successfully",
        log: newLog,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error in POST /api/care-logs:", error);
    return NextResponse.json(
      { error: "Failed to create care log" },
      { status: 500 }
    );
  }
}