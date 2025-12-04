// src/app/api/care-circles/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCareCircleMembersForPet } from "@/lib/carecircle";

export async function GET(request: NextRequest) {
  // Ensure the caller is authenticated
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "You must be logged in to view care circle members" },
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

  // Resolve a backing DB user for this session, same pattern as /api/pets and /account
  const dbUser = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {},
    create: {
      email: session.user.email,
      name: session.user.name ?? "",
      // Satisfies the non-null constraint on passwordHash; not used for OAuth login
      passwordHash: "google-oauth",
    },
  });

  // Look up the recipient so we can determine ownership
  const recipient = await prisma.recipient.findUnique({
    where: { id: recipientId },
    select: { ownerId: true },
  });

  const isOwner = recipient?.ownerId === dbUser.id;

  // Fetch CareCircle members for this recipient
  const members = await getCareCircleMembersForPet(recipientId);

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
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "You must be logged in to modify care circle members" },
      { status: 401 }
    );
  }

  // Resolve or create the backing User record for this session.
  const dbUser = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {},
    create: {
      email: session.user.email,
      name: session.user.name ?? "",
      // Satisfies the non-null constraint on passwordHash; not used for OAuth login
      passwordHash: "google-oauth",
    },
  });

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
      { error: "membershipId is required to remove a care circle member" },
      { status: 400 }
    );
  }

  try {
    // Look up the care circle membership and its recipient to verify ownership.
    const membership = await prisma.careCircle.findUnique({
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
        { error: "Care circle membership not found" },
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
        { error: "You do not have permission to modify this care circle" },
        { status: 403 }
      );
    }

    // Extra guardrail: do not allow removing the OWNER record.
    if (membership.role === "OWNER") {
      return NextResponse.json(
        { error: "Owners cannot be removed from their own care circle" },
        { status: 400 }
      );
    }

    await prisma.careCircle.delete({
      where: { id: membershipId },
    });

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing care circle member:", error);
    return NextResponse.json(
      { error: "Failed to remove care circle member" },
      { status: 500 }
    );
  }
}