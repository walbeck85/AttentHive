import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z, type ZodIssue } from 'zod';
import {
  PET_CHARACTERISTIC_IDS,
  type PetCharacteristicId,
} from '@/lib/petCharacteristics';
import { canEditPet, type PetWithOwnership } from '@/lib/permissions';
import {
  apiLimiter,
  checkRateLimit,
  rateLimitResponse,
  getClientIp,
} from '@/lib/rate-limit';

// Helper: create a JSON Response without relying on Response.json,
// which can be missing or behave differently in some Jest environments.
// In the actual Next.js runtime, this is equivalent in spirit to
// NextResponse.json but keeps our tests environment-agnostic.
function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

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
});

// Validation schema for updating a pet (all fields optional)
const updatePetSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name too long')
    .optional(),
  type: z.enum(['DOG', 'CAT'] as const).optional(),
  breed: z
    .string()
    .min(1, 'Breed is required')
    .max(100, 'Breed too long')
    .optional(),
  gender: z.enum(['MALE', 'FEMALE'] as const).optional(),
  birthDate: z
    .string()
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      return birthDate <= today;
    }, 'Birth date cannot be in the future')
    .optional(),
  // For updates we use a slightly clearer message that will surface directly
  // in error responses when this is the only invalid field. The tests and UI
  // rely on this exact copy when a negative weight is submitted.
  weight: z
    .number()
    .positive('Weight must be a positive number')
    .optional(),
  // Optional multi-select flags; if present we sanitize and persist them,
  // and if omitted we leave existing values untouched.
  characteristics: z.array(z.string()).optional(),
  description: z.string().max(500, 'Description too long').optional(),
  specialNotes: z.string().max(500, 'Special notes too long').optional(),
});

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

// POST /api/pets - Create a new pet
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
      return jsonResponse(
        { error: 'You must be logged in to add a pet' },
        { status: 401 },
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
        }),
      );

      return jsonResponse(
        {
          error: 'Invalid pet data',
          validationErrors: formattedErrors,
        },
        { status: 400 },
      );
    }

    // Step 4: Data is valid! Save to database
    const petData = validationResult.data;

    // Separate out characteristics so we can normalize them before persisting.
    const {
      birthDate,
      characteristics: rawCharacteristics,
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
        ownerId: dbUser.id, // use real DB user id, not session.user.id
        category: 'PET',
      },
    });

    console.log('✅ Pet created successfully:', newPet.id);

    // Step 5: Return the created pet
    return jsonResponse(
      {
        message: 'Pet created successfully!',
        pet: newPet,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('❌ Error in POST /api/pets:', error);
    return jsonResponse(
      { error: 'Something went wrong while creating the pet' },
      { status: 500 },
    );
  }
}

// GET /api/pets/[id] - Get a single pet for the logged-in user
// This powers the pet details page and always returns a single `pet` object
// (or a 404) rather than a collection.
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
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
      return jsonResponse(
        { error: 'You must be logged in to view this pet' },
        { status: 401 },
      );
    }

    // Support both sync and async params (Next 15/16 dynamic API behavior)
    const resolvedParams =
      'then' in context.params ? await context.params : context.params;

    const petId = resolvedParams.id;

    // Step 2: Fetch the pet for this user, including recent care logs
    const pet = await prisma.careRecipient.findFirst({
      where: {
        id: petId,
        ownerId: dbUser.id,
      },
      include: {
        careLogs: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!pet) {
      return jsonResponse(
        { error: 'Pet not found' },
        { status: 404 },
      );
    }

    // Step 3: Return the single pet under a `pet` key so the detail page
    // can safely call `setPet(data.pet)` without needing to know about the
    // collection shape used on the dashboard list route.
    return jsonResponse({ pet }, { status: 200 });
  } catch (error) {
    console.error('❌ Error in GET /api/pets/[id]:', error);
    return jsonResponse(
      { error: 'Failed to fetch pet details' },
      { status: 500 },
    );
  }
}

// PATCH /api/pets/[id] - Update an existing pet. This is used by the
// pet details page (and tests) to update fields like name, weight, and
// birth date for the currently authenticated owner.
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
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
      return jsonResponse(
        { error: 'Not authenticated' },
        { status: 401 },
      );
    }

    // Support both sync and async params (Next 15/16 dynamic API behavior)
    const resolvedParams =
      'then' in context.params ? await context.params : context.params;

    const petId = resolvedParams.id;

    // Step 2: Verify the pet exists and user has permission to edit
    const existingPet = await prisma.careRecipient.findUnique({
      where: { id: petId },
      select: {
        id: true,
        ownerId: true,
        hives: {
          select: { userId: true, role: true },
        },
      },
    });

    if (!existingPet) {
      return jsonResponse(
        { error: 'Pet not found' },
        { status: 404 },
      );
    }

    // Build ownership context for permission check
    const pet: PetWithOwnership = {
      ownerId: existingPet.ownerId,
      members: existingPet.hives,
    };

    // Both primary owner and co-owners can edit pet details
    if (!canEditPet(pet, dbUser.id)) {
      return jsonResponse(
        { error: 'You do not have permission to update this pet' },
        { status: 403 },
      );
    }

    // Step 3: Parse and validate the incoming data
    const body = await request.json();

    if (!body || Object.keys(body).length === 0) {
      return jsonResponse(
        { error: 'No fields provided to update' },
        { status: 400 },
      );
    }

    const validationResult = updatePetSchema.safeParse(body);

    if (!validationResult.success) {
      // Format errors for easier reading in logs / debugging
      const formattedErrors = validationResult.error.issues.map(
        (err: ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message,
        }),
      );

      // When only a single field (like weight) is invalid, we surface that
      // message directly on the `error` key so tests and UI can use it.
      const primaryMessage =
        validationResult.error.issues[0]?.message ?? 'Invalid pet update data';

      console.log('❌ Validation failed in PATCH /api/pets/[id]:', formattedErrors);

      return jsonResponse(
        {
          error: primaryMessage,
          validationErrors: formattedErrors,
        },
        { status: 400 },
      );
    }

    const updateData = validationResult.data;

    // Separate out birthDate and characteristics so we can normalize before persisting.
    const {
      birthDate,
      characteristics: rawCharacteristics,
      description,
      specialNotes,
      ...rest
    } = updateData;

    const characteristics =
      rawCharacteristics !== undefined
        ? sanitizeCharacteristics(rawCharacteristics)
        : undefined;

    // Step 4: Apply the update
    const updatedPet = await prisma.careRecipient.update({
      where: { id: petId },
      data: {
        ...rest,
        // If birthDate is present, coerce it to a Date instance so Prisma
        // receives the right type instead of a plain string.
        ...(birthDate ? { birthDate: new Date(birthDate) } : {}),
        // Only update characteristics when the client actually sent them.
        ...(characteristics !== undefined ? { characteristics } : {}),
        // Only update description/specialNotes when explicitly sent.
        ...(description !== undefined ? { description } : {}),
        ...(specialNotes !== undefined ? { specialNotes } : {}),
      },
    });

    // Step 5: Return the updated pet
    return jsonResponse(
      {
        message: 'Pet updated successfully!',
        pet: updatedPet,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('❌ Error in PATCH /api/pets/[id]:', error);
    return jsonResponse(
      { error: 'Failed to update pet' },
      { status: 500 },
    );
  }
}