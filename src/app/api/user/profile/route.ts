import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Keeping this tight so we only accept the fields we actually plan to store
const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(3).max(50).optional(),
  address: z.string().min(3).max(255).optional(),
  email: z.string().email().optional(),
});

// Basic shared guard so I do not copy-paste session lookups everywhere
async function requireSessionUser() {
  const session = await getServerSession(authOptions);

  // Being strict here so we fail fast if NextAuth's typing ever drifts
  if (!session || !session.user || !session.user.id) {
    throw new Error("User must be authenticated with a valid ID.");
  }

  return session.user;
}

export async function GET() {
  try {
    const user = await requireSessionUser();

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      // Selecting only what the profile UI actually needs to keep the payload lean
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(dbUser);
    } catch (error) {
    console.error("Error loading user profile", error);
    // Returning a generic message here; details can live in logs instead
    return NextResponse.json(
      { error: "Unable to load profile." },
      { status: 401 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await request.json();

    // Let Zod be the bad cop so we keep all validation rules in one place
    const parsed = profileUpdateSchema.parse(body);

    // Fetch current user so we can detect email changes
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        // Only apply values that were actually sent, so we do not blow away existing data
        ...(parsed.name !== undefined && { name: parsed.name }),
        ...(parsed.phone !== undefined && { phone: parsed.phone }),
        ...(parsed.address !== undefined && { address: parsed.address }),
        ...(parsed.email !== undefined && { email: parsed.email }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
      },
    });

    // In the future we can plug in an email verification flow here; for now we just expose the new state
    return NextResponse.json(updatedUser);
  } catch (error) {
    // If Zod throws, we surface a 400 so the UI knows it was a bad payload, not a server crash
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid profile data.", details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Unable to update profile." },
      { status: 500 }
    );
  }
}