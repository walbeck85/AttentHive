// src/lib/auth-helpers.ts
// Centralized authorization helpers for pet access control

import { HiveRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type PetAccessResult = {
  canAccess: boolean;
  role: 'OWNER' | 'CAREGIVER' | 'VIEWER' | null;
};

/**
 * Check if a user can access a pet (read operations).
 * A user can access a pet if they are:
 * - The owner (recipient.ownerId === userId)
 * - A member of the pet's Hive (any role: OWNER, CAREGIVER, or VIEWER)
 *
 * Uses a single efficient Prisma query.
 */
export async function canAccessPet(
  userId: string,
  petId: string
): Promise<PetAccessResult> {
  // Single query to get pet ownership and hive membership in one go
  const pet = await prisma.recipient.findUnique({
    where: { id: petId },
    select: {
      ownerId: true,
      hives: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  // Pet doesn't exist
  if (!pet) {
    return { canAccess: false, role: null };
  }

  // User is the owner
  if (pet.ownerId === userId) {
    return { canAccess: true, role: 'OWNER' };
  }

  // Check for Hive membership
  const hiveMembership = pet.hives[0];
  if (hiveMembership) {
    return { canAccess: true, role: hiveMembership.role as PetAccessResult['role'] };
  }

  // No access
  return { canAccess: false, role: null };
}

/**
 * Check if a user can write to a pet (create/update/delete operations).
 * A user can write to a pet if they are:
 * - The owner (recipient.ownerId === userId)
 * - A CAREGIVER in the pet's Hive
 *
 * VIEWER role is read-only and cannot write.
 */
export async function canWriteToPet(
  userId: string,
  petId: string
): Promise<boolean> {
  const { canAccess, role } = await canAccessPet(userId, petId);

  if (!canAccess) {
    return false;
  }

  // Only OWNER and CAREGIVER can write
  return role === 'OWNER' || role === 'CAREGIVER';
}
