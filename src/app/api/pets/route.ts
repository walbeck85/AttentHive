import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';  

// Validation schema for creating a pet
const createPetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  type: z.enum(['DOG', 'CAT'], {
    errorMap: () => ({ message: 'Pet type must be DOG or CAT' })
  }),
  breed: z.string().min(1, 'Breed is required').max(100, 'Breed too long'),
  gender: z.enum(['MALE', 'FEMALE'], {
    errorMap: () => ({ message: 'Gender must be MALE or FEMALE' })
  }),
  birthDate: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    return birthDate <= today;
  }, 'Birth date cannot be in the future'),
  weight: z.number().positive('Weight must be positive')
});

// POST /api/pets - Create a new pet
export async function POST(request: NextRequest) {
  try {
    // Step 1: Check if user is logged in
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
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
      const formattedErrors = validationResult.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return NextResponse.json(
        {
          error: 'Invalid pet data',
          validationErrors: formattedErrors
        },
        { status: 400 }
      );
    }

    // Step 4: Data is valid! Log it
    console.log('✅ Valid pet data:', validationResult.data);
    console.log('User creating pet:', session.user.email);
    
    // Step 5: Return success (we'll add database logic next)
    return NextResponse.json(
      { 
        message: 'Pet data validated successfully!',
        validatedData: validationResult.data,
        user: session.user.email
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error in POST /api/pets:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}