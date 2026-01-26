import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z, type ZodIssue } from 'zod';
import {
  PET_CHARACTERISTIC_IDS,
  type PetCharacteristicId,
} from '@/lib/petCharacteristics';
import {
  apiLimiter,
  checkRateLimit,
  rateLimitResponse,
  getClientIp,
} from '@/lib/rate-limit';

// Validation schema for creating a pet
const createPetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  type: z.enum(['DOG', 'CAT'] as const),
  breed: z.string().min(1, 'Breed is required').max(100, 'Breed too long'),
  gender: z.enum(['MALE', 'FEMALE'] as const),
  birthDate: z
    .string()
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      return birthDate <= today;
    }, 'Birth date cannot be in the future'),
  weight: z.number().positive('Weight must be positive'),
  // Client may send an array of strings for characteristic flags.
  // We keep this loose here and enforce the canonical values via
  // `sanitizeCharacteristics` so the schema stays simple.
  characteristics: z.array(z.string()).optional(),
  description: z.string().max(500, 'Description too long').optional(),
  specialNotes: z.string().max(500, 'Special notes too long').optional(),
});

// Helper: normalize and validate any incoming characteristics array against
// the canonical list. This keeps the DB clean even if the client payload
// drifts or a malicious caller sends arbitrary strings.
function sanitizeCharacteristics(input: unknown): PetCharacteristicId[] {
  if (!Array.isArray(input)) {
    return [];
  }

  // Filter to known IDs and de-duplicate so we never store junk or repeats.
  return Array.from(
    new Set(
      input.filter((id): id is PetCharacteristicId =>
        PET_CHARACTERISTIC_IDS.includes(id as PetCharacteristicId),
      ),
    ),
  );
}

// Helper: ensure there is a Prisma User row for the current session user.
// This is important for OAuth (Google) users who may not have been created
// in our own User table yet.
async function getOrCreateDbUserForSession() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return { session, dbUser: null as null };
  }

  const dbUser = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {},
    create: {
      email: session.user.email,
      name: session.user.name ?? '',
      // This value is never used for login; it just satisfies the schema.
      passwordHash: 'google-oauth',
    },
  });

  return { session, dbUser };
}

// POST /api/care-recipients - Create a new care recipient
export async function POST(request: NextRequest) {
  try {
    // Step 1: Ensure we have a logged-in user AND a backing DB user
    const { session, dbUser } = await getOrCreateDbUserForSession();

    // Rate limit by user ID if authenticated, otherwise by IP
    const identifier = dbUser?.id ?? getClientIp(request);
    const rateLimitResult = await checkRateLimit(apiLimiter, identifier);

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    if (!session || !dbUser) {
      return NextResponse.json(
        { error: 'You must be logged in to add a pet' },
        { status: 401 }
      );
    }

    // Step 2: Get the data from the request
    const body = await request.json();

    // Step 3: Validate the data with Zod
    const validationResult = createPetSchema.safeParse(body);

    if (!validationResult.success) {
      console.log('❌ Validation failed:', validationResult.error);

      // Format errors for easier reading
      const formattedErrors = validationResult.error.issues.map(
        (err: ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message,
        })
      );

      return NextResponse.json(
        {
          error: 'Invalid pet data',
          validationErrors: formattedErrors,
        },
        { status: 400 }
      );
    }

    // Step 4: Data is valid! Save to database
    const petData = validationResult.data;

    // Separate out characteristics so we can normalize them before persisting.
    const {
      birthDate,
      characteristics: rawCharacteristics,
      description,
      specialNotes,
      ...rest
    } = petData;

    const characteristics = sanitizeCharacteristics(rawCharacteristics);

    const newPet = await prisma.careRecipient.create({
      data: {
        ...rest,
        gender: rest.gender,
        type: rest.type,
        breed: rest.breed,
        birthDate: new Date(birthDate),
        weight: rest.weight,
        characteristics,
        // Only include description/specialNotes if they have values
        ...(description !== undefined ? { description } : {}),
        ...(specialNotes !== undefined ? { specialNotes } : {}),
        ownerId: dbUser.id, // ✅ use real DB user id, not session.user.id
        category: 'PET',
      },
    });

    console.log('✅ Pet created successfully:', newPet.id);

    // Step 5: Return the created pet
    return NextResponse.json(
      {
        message: 'Pet created successfully!',
        pet: newPet,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error in POST /api/care-recipients:', error);
    return NextResponse.json(
      { error: 'Something went wrong while creating the pet' },
      { status: 500 }
    );
  }
}

// GET /api/care-recipients - Get all care recipients for the logged-in user
export async function GET(request: NextRequest) {
  try {
    // Step 1: Ensure we have a logged-in user AND a backing DB user
    const { session, dbUser } = await getOrCreateDbUserForSession();

    // Rate limit by user ID if authenticated, otherwise by IP
    const identifier = dbUser?.id ?? getClientIp(request);
    const rateLimitResult = await checkRateLimit(apiLimiter, identifier);

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    if (!session || !dbUser) {
      return NextResponse.json(
        { error: 'You must be logged in to view pets' },
        { status: 401 }
      );
    }

    // Step 2: Fetch all pets for this user WITH their last activity
    const pets = await prisma.careRecipient.findMany({
      where: {
        ownerId: dbUser.id, // ✅ query by DB user id
      },
      include: {
        careLogs: {
          take: 1, // Limit to only 1 record (the most recent)
          orderBy: {
            createdAt: 'desc', // Sort by newest first
          },
          include: {
            user: {
              // Join User table to get the caregiver's name
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Sort pets by when they were added
      },
    });

    console.log(`✅ Found ${pets.length} pets for user:`, session.user?.email);

    // Step 3: Return the pets
    return NextResponse.json(
      {
        pets,
        count: pets.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error in GET /api/care-recipients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pets' },
      { status: 500 }
    );
  }
}