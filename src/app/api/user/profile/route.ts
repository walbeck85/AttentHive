// src/app/api/user/profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// This type keeps the payload intentionally small and focused on fields
// users are allowed to edit from the profile page.
type ProfilePayload = {
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
};

// GET /api/user/profile
// Used by the account page to load the current user's profile data.
export async function GET() {
  const session = await getServerSession(authOptions);

  // If there is no valid session, we fail fast so we don't expose anything.
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      // Note: we intentionally do NOT select `emailVerified` here because
      // the current Prisma User model does not define that column.
    },
  });

  if (!user) {
    // This should not normally happen, but it guards against weird state.
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

// PATCH /api/user/profile
// Handles profile updates from the account page form.
// We use PATCH instead of PUT because users are only editing a subset
// of fields, not replacing the whole resource.
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Again, fail fast if we don't have a logged-in user.
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: ProfilePayload;
  try {
    body = (await request.json()) as ProfilePayload;
  } catch {
    // If the body is not valid JSON, we return a 400 rather than crashing.
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      // Prisma ignores `undefined` values, so we can safely pass individual
      // fields here for a true partial update, including email.
      data: {
        name: body.name,
        phone: body.phone,
        address: body.address,
        email: body.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
      },
    });

    // Returning the updated user lets the client update its local UI
    // without needing an extra GET request.
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    // Centralized logging so we can diagnose issues in development / Vercel logs.
    console.error("Error updating profile", error);

    return NextResponse.json(
      { error: "Unable to save profile" },
      { status: 500 }
    );
  }
}