// src/lib/auth-helpers.ts
// Centralized authorization helpers for recipient access control

import { getServerSession } from 'next-auth';
import type { User } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type RecipientAccessResult = {
  canAccess: boolean;
  role: 'OWNER' | 'CAREGIVER' | 'VIEWER' | null;
};

/**
 * Check if a user can access a recipient (read operations).
 * A user can access a recipient if they are:
 * - The owner (recipient.ownerId === userId)
 * - A member of the recipient's Hive (any role: OWNER, CAREGIVER, or VIEWER)
 *
 * Uses a single efficient Prisma query.
 */
export async function canAccessRecipient(
  userId: string,
  recipientId: string
): Promise<RecipientAccessResult> {
  // Single query to get recipient ownership and hive membership in one go
  const recipient = await prisma.careRecipient.findUnique({
    where: { id: recipientId },
    select: {
      ownerId: true,
      hives: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  // Recipient doesn't exist
  if (!recipient) {
    return { canAccess: false, role: null };
  }

  // User is the owner
  if (recipient.ownerId === userId) {
    return { canAccess: true, role: 'OWNER' };
  }

  // Check for Hive membership
  const hiveMembership = recipient.hives[0];
  if (hiveMembership) {
    return { canAccess: true, role: hiveMembership.role as RecipientAccessResult['role'] };
  }

  // No access
  return { canAccess: false, role: null };
}

/**
 * Check if a user can write to a recipient (create/update/delete operations).
 *
 * Role Hierarchy (highest to lowest privilege):
 * - OWNER: Full access - can read, write, and manage hive members
 * - CAREGIVER: Can read and write (log care activities)
 * - VIEWER: Read-only - can view recipient info and care logs, but CANNOT write
 *
 * This function returns TRUE only for OWNER and CAREGIVER roles.
 * VIEWER role is explicitly excluded from write operations.
 *
 * Use this for: POST care-logs, DELETE care-logs, any mutation endpoints
 * Use canAccessRecipient() instead for: GET operations where VIEWERs should have access
 *
 * @param userId - The database User.id to check
 * @param recipientId - The CareRecipient ID to check access for
 * @returns true if user can write, false otherwise
 */
export async function canWriteToRecipient(
  userId: string,
  recipientId: string
): Promise<boolean> {
  const { canAccess, role } = await canAccessRecipient(userId, recipientId);

  if (!canAccess) {
    return false;
  }

  // Only OWNER and CAREGIVER can write
  return role === 'OWNER' || role === 'CAREGIVER';
}

/**
 * Get the database User record for the current session.
 *
 * IMPORTANT: This looks up the user by EMAIL, not by session.user.id.
 * For OAuth users (e.g., Google), session.user.id is NOT the database User.id.
 * Email is the stable identifier that links sessions to database records.
 *
 * @returns The database User object, or null if not authenticated
 */
export async function getDbUserFromSession(): Promise<User | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  // Look up by email - this is the stable identifier across all auth methods
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  return dbUser;
}
