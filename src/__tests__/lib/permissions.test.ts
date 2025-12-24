// src/__tests__/lib/permissions.test.ts
import {
  isPrimaryOwner,
  isCoOwner,
  isOwner,
  canRemoveMember,
  canEditPet,
  canInviteMembers,
  getMemberRoleLabel,
  type PetWithOwnership,
} from '@/lib/permissions';

describe('Permission Utilities', () => {
  // Test data setup
  const primaryOwnerId = 'primary-owner';
  const coOwnerId = 'co-owner';
  const caregiverId = 'caregiver';
  const viewerId = 'viewer';
  const outsiderId = 'outsider';

  const petWithAllRoles: PetWithOwnership = {
    ownerId: primaryOwnerId,
    members: [
      { userId: coOwnerId, role: 'OWNER' },
      { userId: caregiverId, role: 'CAREGIVER' },
      { userId: viewerId, role: 'VIEWER' },
    ],
  };

  const petWithNoMembers: PetWithOwnership = {
    ownerId: primaryOwnerId,
    members: [],
  };

  const petWithUndefinedMembers: PetWithOwnership = {
    ownerId: primaryOwnerId,
  };

  describe('isPrimaryOwner', () => {
    it('returns true for the primary owner', () => {
      expect(isPrimaryOwner(petWithAllRoles, primaryOwnerId)).toBe(true);
    });

    it('returns false for a co-owner', () => {
      expect(isPrimaryOwner(petWithAllRoles, coOwnerId)).toBe(false);
    });

    it('returns false for a caregiver', () => {
      expect(isPrimaryOwner(petWithAllRoles, caregiverId)).toBe(false);
    });

    it('returns false for a viewer', () => {
      expect(isPrimaryOwner(petWithAllRoles, viewerId)).toBe(false);
    });

    it('returns false for an outsider', () => {
      expect(isPrimaryOwner(petWithAllRoles, outsiderId)).toBe(false);
    });
  });

  describe('isCoOwner', () => {
    it('returns true for a co-owner (OWNER role in hive)', () => {
      expect(isCoOwner(petWithAllRoles, coOwnerId)).toBe(true);
    });

    it('returns false for the primary owner', () => {
      expect(isCoOwner(petWithAllRoles, primaryOwnerId)).toBe(false);
    });

    it('returns false for a caregiver', () => {
      expect(isCoOwner(petWithAllRoles, caregiverId)).toBe(false);
    });

    it('returns false for a viewer', () => {
      expect(isCoOwner(petWithAllRoles, viewerId)).toBe(false);
    });

    it('returns false for an outsider', () => {
      expect(isCoOwner(petWithAllRoles, outsiderId)).toBe(false);
    });

    it('returns false when members array is empty', () => {
      expect(isCoOwner(petWithNoMembers, coOwnerId)).toBe(false);
    });

    it('returns false when members is undefined', () => {
      expect(isCoOwner(petWithUndefinedMembers, coOwnerId)).toBe(false);
    });
  });

  describe('isOwner', () => {
    it('returns true for the primary owner', () => {
      expect(isOwner(petWithAllRoles, primaryOwnerId)).toBe(true);
    });

    it('returns true for a co-owner', () => {
      expect(isOwner(petWithAllRoles, coOwnerId)).toBe(true);
    });

    it('returns false for a caregiver', () => {
      expect(isOwner(petWithAllRoles, caregiverId)).toBe(false);
    });

    it('returns false for a viewer', () => {
      expect(isOwner(petWithAllRoles, viewerId)).toBe(false);
    });

    it('returns false for an outsider', () => {
      expect(isOwner(petWithAllRoles, outsiderId)).toBe(false);
    });

    it('returns true for primary owner even with no members', () => {
      expect(isOwner(petWithNoMembers, primaryOwnerId)).toBe(true);
    });
  });

  describe('canRemoveMember', () => {
    describe('primary owner removing members', () => {
      it('allows primary owner to remove a co-owner', () => {
        expect(canRemoveMember(petWithAllRoles, primaryOwnerId, coOwnerId)).toBe(true);
      });

      it('allows primary owner to remove a caregiver', () => {
        expect(canRemoveMember(petWithAllRoles, primaryOwnerId, caregiverId)).toBe(true);
      });

      it('allows primary owner to remove a viewer', () => {
        expect(canRemoveMember(petWithAllRoles, primaryOwnerId, viewerId)).toBe(true);
      });

      it('prevents primary owner from removing themselves', () => {
        expect(canRemoveMember(petWithAllRoles, primaryOwnerId, primaryOwnerId)).toBe(false);
      });
    });

    describe('co-owner removing members', () => {
      it('allows co-owner to remove a caregiver', () => {
        expect(canRemoveMember(petWithAllRoles, coOwnerId, caregiverId)).toBe(true);
      });

      it('prevents co-owner from removing a viewer (only caregivers allowed)', () => {
        // Current implementation only allows co-owners to remove caregivers
        expect(canRemoveMember(petWithAllRoles, coOwnerId, viewerId)).toBe(false);
      });

      it('prevents co-owner from removing another co-owner', () => {
        const petWithTwoCoOwners: PetWithOwnership = {
          ownerId: primaryOwnerId,
          members: [
            { userId: 'co-owner-1', role: 'OWNER' },
            { userId: 'co-owner-2', role: 'OWNER' },
          ],
        };
        expect(canRemoveMember(petWithTwoCoOwners, 'co-owner-1', 'co-owner-2')).toBe(false);
      });

      it('prevents co-owner from removing the primary owner', () => {
        expect(canRemoveMember(petWithAllRoles, coOwnerId, primaryOwnerId)).toBe(false);
      });

      it('prevents co-owner from removing themselves', () => {
        expect(canRemoveMember(petWithAllRoles, coOwnerId, coOwnerId)).toBe(false);
      });
    });

    describe('caregiver removing members', () => {
      it('prevents caregiver from removing anyone', () => {
        expect(canRemoveMember(petWithAllRoles, caregiverId, viewerId)).toBe(false);
        expect(canRemoveMember(petWithAllRoles, caregiverId, coOwnerId)).toBe(false);
        expect(canRemoveMember(petWithAllRoles, caregiverId, primaryOwnerId)).toBe(false);
      });
    });

    describe('viewer removing members', () => {
      it('prevents viewer from removing anyone', () => {
        expect(canRemoveMember(petWithAllRoles, viewerId, caregiverId)).toBe(false);
      });
    });

    describe('outsider removing members', () => {
      it('prevents outsider from removing anyone', () => {
        expect(canRemoveMember(petWithAllRoles, outsiderId, caregiverId)).toBe(false);
      });
    });
  });

  describe('canEditPet', () => {
    it('allows primary owner to edit', () => {
      expect(canEditPet(petWithAllRoles, primaryOwnerId)).toBe(true);
    });

    it('allows co-owner to edit', () => {
      expect(canEditPet(petWithAllRoles, coOwnerId)).toBe(true);
    });

    it('prevents caregiver from editing', () => {
      expect(canEditPet(petWithAllRoles, caregiverId)).toBe(false);
    });

    it('prevents viewer from editing', () => {
      expect(canEditPet(petWithAllRoles, viewerId)).toBe(false);
    });

    it('prevents outsider from editing', () => {
      expect(canEditPet(petWithAllRoles, outsiderId)).toBe(false);
    });
  });

  describe('canInviteMembers', () => {
    it('allows primary owner to invite', () => {
      expect(canInviteMembers(petWithAllRoles, primaryOwnerId)).toBe(true);
    });

    it('allows co-owner to invite', () => {
      expect(canInviteMembers(petWithAllRoles, coOwnerId)).toBe(true);
    });

    it('prevents caregiver from inviting', () => {
      expect(canInviteMembers(petWithAllRoles, caregiverId)).toBe(false);
    });

    it('prevents viewer from inviting', () => {
      expect(canInviteMembers(petWithAllRoles, viewerId)).toBe(false);
    });

    it('prevents outsider from inviting', () => {
      expect(canInviteMembers(petWithAllRoles, outsiderId)).toBe(false);
    });
  });

  describe('getMemberRoleLabel', () => {
    it('returns "Owner" for primary owner', () => {
      expect(getMemberRoleLabel(petWithAllRoles, primaryOwnerId)).toBe('Owner');
    });

    it('returns "Co-owner" for co-owner', () => {
      expect(getMemberRoleLabel(petWithAllRoles, coOwnerId)).toBe('Co-owner');
    });

    it('returns "Caregiver" for caregiver', () => {
      expect(getMemberRoleLabel(petWithAllRoles, caregiverId)).toBe('Caregiver');
    });

    it('returns "Caregiver" for viewer (fallback)', () => {
      // Viewers are not currently differentiated in the label
      expect(getMemberRoleLabel(petWithAllRoles, viewerId)).toBe('Caregiver');
    });

    it('returns "Caregiver" for outsider (fallback)', () => {
      expect(getMemberRoleLabel(petWithAllRoles, outsiderId)).toBe('Caregiver');
    });
  });
});
