import { HiveRole } from '@prisma/client';

export interface PetMember {
  userId: string;
  role: HiveRole;
}

export interface PetWithOwnership {
  ownerId: string;
  members?: PetMember[];
}

// Check if user is the primary owner
export function isPrimaryOwner(pet: PetWithOwnership, userId: string): boolean {
  return pet.ownerId === userId;
}

// Check if user is a co-owner (OWNER role in hive, but not primary)
export function isCoOwner(pet: PetWithOwnership, userId: string): boolean {
  if (isPrimaryOwner(pet, userId)) return false;
  return pet.members?.some(m => m.userId === userId && m.role === 'OWNER') ?? false;
}

// Check if user is any type of owner (primary or co-owner)
export function isOwner(pet: PetWithOwnership, userId: string): boolean {
  return isPrimaryOwner(pet, userId) || isCoOwner(pet, userId);
}

// Check if user can remove a specific member
export function canRemoveMember(
  pet: PetWithOwnership,
  actingUserId: string,
  targetUserId: string
): boolean {
  // Can't remove the primary owner
  if (isPrimaryOwner(pet, targetUserId)) return false;

  // Only owners can remove members
  if (!isOwner(pet, actingUserId)) return false;

  // Primary owner can remove anyone (except themselves, handled above)
  if (isPrimaryOwner(pet, actingUserId)) return true;

  // Co-owners can only remove caregivers, not other co-owners
  const targetMember = pet.members?.find(m => m.userId === targetUserId);
  return targetMember?.role === 'CAREGIVER';
}

// Check if user can edit pet details
export function canEditPet(pet: PetWithOwnership, userId: string): boolean {
  return isOwner(pet, userId);
}

// Check if user can invite new members
export function canInviteMembers(pet: PetWithOwnership, userId: string): boolean {
  return isOwner(pet, userId);
}

// Get display label for a member
export function getMemberRoleLabel(
  pet: PetWithOwnership,
  userId: string
): 'Owner' | 'Co-owner' | 'Caregiver' {
  if (isPrimaryOwner(pet, userId)) return 'Owner';
  const member = pet.members?.find(m => m.userId === userId);
  if (member?.role === 'OWNER') return 'Co-owner';
  return 'Caregiver';
}
