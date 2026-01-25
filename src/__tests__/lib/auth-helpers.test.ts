import { canAccessRecipient, canWriteToRecipient } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Mock next-auth since auth-helpers imports it
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    careRecipient: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('canAccessRecipient', () => {
  it('returns { canAccess: false, role: null } when pet does not exist', async () => {
    (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await canAccessRecipient('user-1', 'nonexistent-pet');

    expect(result).toEqual({ canAccess: false, role: null });
  });

  it('returns { canAccess: true, role: "OWNER" } when user is owner', async () => {
    (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
      ownerId: 'user-1',
      hives: [],
    });

    const result = await canAccessRecipient('user-1', 'pet-1');

    expect(result).toEqual({ canAccess: true, role: 'OWNER' });
  });

  it('returns { canAccess: true, role: "CAREGIVER" } when user has CAREGIVER hive membership', async () => {
    (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
      ownerId: 'owner-1',
      hives: [{ role: 'CAREGIVER' }],
    });

    const result = await canAccessRecipient('caregiver-1', 'pet-1');

    expect(result).toEqual({ canAccess: true, role: 'CAREGIVER' });
  });

  it('returns { canAccess: true, role: "VIEWER" } when user has VIEWER hive membership', async () => {
    (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
      ownerId: 'owner-1',
      hives: [{ role: 'VIEWER' }],
    });

    const result = await canAccessRecipient('viewer-1', 'pet-1');

    expect(result).toEqual({ canAccess: true, role: 'VIEWER' });
  });

  it('returns { canAccess: false, role: null } when user has no access', async () => {
    (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
      ownerId: 'owner-1',
      hives: [], // No hive membership
    });

    const result = await canAccessRecipient('random-user', 'pet-1');

    expect(result).toEqual({ canAccess: false, role: null });
  });
});

describe('canWriteToRecipient', () => {
  describe('Role-Based Write Access', () => {
    it('returns true for OWNER', async () => {
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'owner-1',
        hives: [],
      });

      const result = await canWriteToRecipient('owner-1', 'pet-1');

      expect(result).toBe(true);
    });

    it('returns true for CAREGIVER', async () => {
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'owner-1',
        hives: [{ role: 'CAREGIVER' }],
      });

      const result = await canWriteToRecipient('caregiver-1', 'pet-1');

      expect(result).toBe(true);
    });

    it('returns false for VIEWER (read-only role)', async () => {
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'owner-1',
        hives: [{ role: 'VIEWER' }],
      });

      const result = await canWriteToRecipient('viewer-1', 'pet-1');

      expect(result).toBe(false);
    });

    it('returns false when user has no access', async () => {
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'owner-1',
        hives: [],
      });

      const result = await canWriteToRecipient('random-user', 'pet-1');

      expect(result).toBe(false);
    });

    it('returns false when pet does not exist', async () => {
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await canWriteToRecipient('user-1', 'nonexistent-pet');

      expect(result).toBe(false);
    });
  });

  describe('VIEWER Role Enforcement Contract', () => {
    /**
     * These tests explicitly document that VIEWER is a read-only role.
     * Any change to this behavior would break the security model.
     */

    it('VIEWER cannot write even if they have valid hive membership', async () => {
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'owner-1',
        hives: [{ role: 'VIEWER' }],
      });

      const canWrite = await canWriteToRecipient('viewer-1', 'pet-1');

      expect(canWrite).toBe(false);
    });

    it('CAREGIVER can write with valid hive membership', async () => {
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'owner-1',
        hives: [{ role: 'CAREGIVER' }],
      });

      const canWrite = await canWriteToRecipient('caregiver-1', 'pet-1');

      expect(canWrite).toBe(true);
    });
  });
});
