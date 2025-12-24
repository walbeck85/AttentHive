// src/lib/hive.ts
// Domain logic for Hive (shared pet access)

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  isPrimaryOwner,
  canInviteMembers,
  type PetWithOwnership,
} from '@/lib/permissions';

async function getCurrentDbUserOrThrow() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    throw new Error('You must be logged in to perform this action');
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

  return dbUser;
}

/**
 * Grant access to a pet (Recipient) for a given user email with a specific role.
 * For now this acts as an "instant invite" – as soon as the owner adds someone,
 * they can see and log care for that pet.
 *
 * @param recipientId - The pet to share
 * @param email - The email of the user to invite
 * @param role - The role to grant: 'OWNER' (co-owner) or 'CAREGIVER' (default)
 */
export async function inviteMemberToPet(
  recipientId: string,
  email: string,
  role: 'OWNER' | 'CAREGIVER' = 'CAREGIVER',
) {
  const dbUser = await getCurrentDbUserOrThrow();

  // Make sure the current user actually owns this pet
  const recipient = await prisma.recipient.findUnique({
    where: { id: recipientId },
  });

  if (!recipient) {
    throw new Error('Pet not found');
  }

  // Fetch hive members for permission checks
  const hiveMembers = await prisma.hive.findMany({
    where: { recipientId },
    select: { userId: true, role: true },
  });

  const pet: PetWithOwnership = {
    ownerId: recipient.ownerId,
    members: hiveMembers,
  };

  // Check if user can invite members at all
  if (!canInviteMembers(pet, dbUser.id)) {
    throw new Error('Not authorized to share this pet');
  }

  // Only primary owner can invite co-owners
  if (role === 'OWNER' && !isPrimaryOwner(pet, dbUser.id)) {
    throw new Error('Only the primary owner can invite co-owners');
  }

  // Prevent inviting yourself
  if (email.toLowerCase() === dbUser.email?.toLowerCase()) {
    throw new Error('You cannot invite yourself');
  }

  // Only allow sharing with existing users for v1
  const invitedUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!invitedUser) {
    // For now, we keep this strict – no auto-account creation.
    throw new Error('No user found with that email');
  }

  // Prevent inviting the primary owner (they already own it)
  if (isPrimaryOwner(pet, invitedUser.id)) {
    throw new Error('This user is already the primary owner');
  }

  // Upsert so this is idempotent: re-inviting someone updates their role.
  const membership = await prisma.hive.upsert({
    where: {
      recipientId_userId: {
        recipientId,
        userId: invitedUser.id,
      },
    },
    update: {
      role,
    },
    create: {
      recipientId,
      userId: invitedUser.id,
      role,
    },
  });

  return membership;
}

/**
 * @deprecated Use inviteMemberToPet instead
 * Grant caregiver access to a pet (Recipient) for a given user email.
 */
export async function inviteCaregiverToPet(recipientId: string, email: string) {
  return inviteMemberToPet(recipientId, email, 'CAREGIVER');
}

/**
 * Placeholder for a real invitation flow.
 *
 * Your current Hive schema does not track "pending" vs "accepted" vs "declined".
 * Once you add a status field, this function can be wired up properly.
 */
/**
 * TODO(WA): Wire this up after adding a HiveStatus enum to the Prisma schema.
 * This will handle accept/decline of invitations instead of granting access immediately.
 */
export async function respondToInvitation(
  hiveId: string,
  action: 'accept' | 'decline',
) {
  // Using the parameters here so ESLint doesn't complain about unused vars.
  console.warn('respondToInvitation called before implementation', {
    hiveId,
    action,
  });

  throw new Error(
    'respondToInvitation is not implemented yet – see REMAINING_FEATURES.md under "Hive invitations".',
  );
}

/**
 * Remove caregiver access for a user from a specific pet.
 * This is a hard delete because the schema does not include a status field.
 */
export async function removeCaregiverFromPet(
  recipientId: string,
  caregiverUserId: string,
) {
  const dbUser = await getCurrentDbUserOrThrow();

  const recipient = await prisma.recipient.findUnique({
    where: { id: recipientId },
  });

  if (!recipient || recipient.ownerId !== dbUser.id) {
    throw new Error('Not authorized to remove caregivers for this pet');
  }

  // Hard delete the Hive entry for this user + pet
  return prisma.hive.deleteMany({
    where: {
      recipientId,
      userId: caregiverUserId,
      // We only touch caregivers; if you ever add OWNER rows, we don't want to nuke those.
      role: 'CAREGIVER',
    },
  });
}

/**
 * Get all Hive members for a given pet (recipient).
 * This returns Hive rows + safe user fields (no sensitive data like passwordHash).
 *
 * NOTE: This does NOT include the owner by default; the owner lives on Recipient.ownerId.
 * On the UI side you can fetch the Recipient and combine owner + hive members.
 *
 * SECURITY: Only returns id, name, email - NEVER passwordHash, phone, address
 */
export async function getHiveMembersForPet(recipientId: string) {
  const memberships = await prisma.hive.findMany({
    where: { recipientId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return memberships;
}

/**
 * Get all pets that are shared with a given user (i.e., where they are in the Hive).
 *
 * This is what you'll use for:
 * - Account → "Shared Pets"
 * - Dashboard → mixing owned + shared pets
 */
export async function getSharedPetsForUser(userId: string) {
  const memberships = await prisma.hive.findMany({
    where: {
      userId,
      // We treat CAREGIVER and VIEWER as "shared" access.
      // If you later add OWNER rows to Hive, you can decide whether to include/exclude them here.
      role: {
        in: ['CAREGIVER', 'VIEWER'],
      },
    },
    include: {
      recipient: true,
    },
  });

  // Return the memberships so the caller can see role + recipient metadata.
  // Call sites can map to `membership.recipient` to get the pet object.
  return memberships;
}