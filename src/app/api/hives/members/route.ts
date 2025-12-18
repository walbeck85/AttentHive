// src/app/api/hives/members/route.ts
import { NextRequest, NextResponse } from "next/server";

import { getDbUserFromSession, canAccessPet } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getHiveMembersForPet } from "@/lib/hive";

export async function GET(request: NextRequest) {
  // Ensure the caller is authenticated - use email-based lookup for OAuth compatibility
  const dbUser = await getDbUserFromSession();

  if (!dbUser) {
    return NextResponse.json(
      { error: "You must be logged in to view hive members" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const recipientId = searchParams.get("recipientId");

  if (!recipientId) {
    return NextResponse.json(
      { error: "recipientId query parameter is required" },
      { status: 400 }
    );
  }

  // Authorization: user must be owner OR have a Hive membership for this pet
  const { canAccess, role } = await canAccessPet(dbUser.id, recipientId);

  if (!canAccess) {
    // Return 404 to avoid revealing pet existence to unauthorized users
    return NextResponse.json(
      { error: "Pet not found" },
      { status: 404 }
    );
  }

  const isOwner = role === "OWNER";

  // Fetch Hive members for this recipient
  const members = await getHiveMembersForPet(recipientId);

  return NextResponse.json(
    {
      members,
      count: members.length,
      isOwner,
    },
    { status: 200 }
  );
}

export async function DELETE(request: NextRequest) {
  // Auth gate: only logged-in users can attempt to remove care circle members.
  const dbUser = await getDbUserFromSession();

  if (!dbUser) {
    return NextResponse.json(
      { error: "You must be logged in to modify hive members" },
      { status: 401 }
    );
  }

  let body: { membershipId?: string; recipientId?: string } = {};

  try {
    body = (await request.json()) as {
      membershipId?: string;
      recipientId?: string;
    };
  } catch {
    // If there is no JSON body or it is invalid, we fall back to an empty object
    // and allow membershipId to be provided via the query string instead.
    body = {};
  }

  const { searchParams } = new URL(request.url);
  const membershipIdFromQuery = searchParams.get("membershipId") ?? undefined;

  const membershipId = body.membershipId ?? membershipIdFromQuery;

  if (!membershipId) {
    return NextResponse.json(
      { error: "membershipId is required to remove a hive member" },
      { status: 400 }
    );
  }

  try {
    // Look up the hive membership and its recipient to verify ownership.
    const membership = await prisma.hive.findUnique({
      where: { id: membershipId },
      include: {
        recipient: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Hive membership not found" },
        { status: 404 }
      );
    }

    // Optional safety: if a recipientId was provided in the request body,
    // ensure it matches the membership's recipient to avoid accidental mismatches.
    if (body.recipientId && membership.recipientId !== body.recipientId) {
      return NextResponse.json(
        { error: "membershipId does not belong to the specified recipientId" },
        { status: 400 }
      );
    }

    // Only the owner of the recipient can remove caregivers/viewers.
    if (membership.recipient.ownerId !== dbUser.id) {
      return NextResponse.json(
        { error: "You do not have permission to modify this hive" },
        { status: 403 }
      );
    }

    // Extra guardrail: do not allow removing the OWNER record.
    if (membership.role === "OWNER") {
      return NextResponse.json(
        { error: "Owners cannot be removed from their own hive" },
        { status: 400 }
      );
    }

    await prisma.hive.delete({
      where: { id: membershipId },
    });

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing hive member:", error);
    return NextResponse.json(
      { error: "Failed to remove hive member" },
      { status: 500 }
    );
  }
}