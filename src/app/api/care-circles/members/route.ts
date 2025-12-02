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