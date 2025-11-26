// src/app/api/pets/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  try {
    // Support both sync and async params (Next 15/16 dynamic API behavior)
    const resolvedParams =
      'then' in context.params
        ? await context.params
        : context.params;

    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { error: 'Pet id is required' },
        { status: 400 }
      );
    }

    const pet = await prisma.recipient.findUnique({
      where: { id },
      include: {
        careLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!pet) {
      return NextResponse.json(
        { error: 'Pet not found' },
        { status: 404 }
      );
    }

    // Shape is already compatible with your PetDetailsPage expectations:
    // id, name, type, breed, gender, birthDate, weight, careLogs[...]
    return NextResponse.json({ pet });
  } catch (error) {
    console.error('[GET /api/pets/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to load pet' },
      { status: 500 }
    );
  }
}