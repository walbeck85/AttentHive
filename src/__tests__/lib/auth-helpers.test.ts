import { canAccessPet, canWriteToPet } from '@/lib/auth-helpers';
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
    recipient: {
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

describe('canAccessPet', () => {
  it('returns { canAccess: false, role: null } when pet does not exist', async () => {
    (prisma.recipient.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await canAccessPet('user-1', 'nonexistent-pet');

    expect(result).toEqual({ canAccess: false, role: null });
  });

  it('returns { canAccess: true, role: "OWNER" } when user is owner', async () => {
    (prisma.recipient.findUnique as jest.Mock).mockResolvedValue({
      ownerId: 'user-1',
      hives: [],
    });

    const result = await canAccessPet('user-1', 'pet-1');

    expect(result).toEqual({ canAccess: true, role: 'OWNER' });
  });

  it('returns { canAccess: true, role: "CAREGIVER" } when user has CAREGIVER hive membership', async () => {
    (prisma.recipient.findUnique as jest.Mock).mockResolvedValue({
      ownerId: 'owner-1',
      hives: [{ role: 'CAREGIVER' }],
    });

    const result = await canAccessPet('caregiver-1', 'pet-1');

    expect(result).toEqual({ canAccess: true, role: 'CAREGIVER' });
  });

  it('returns { canAccess: true, role: "VIEWER" } when user has VIEWER hive membership', async () => {
    (prisma.recipient.findUnique as jest.Mock).mockResolvedValue({
      ownerId: 'owner-1',
      hives: [{ role: 'VIEWER' }],
    });

    const result = await canAccessPet('viewer-1', 'pet-1');

    expect(result).toEqual({ canAccess: true, role: 'VIEWER' });
  });

  it('returns { canAccess: false, role: null } when user has no access', async () => {
    (prisma.recipient.findUnique as jest.Mock).mockResolvedValue({
      ownerId: 'owner-1',
      hives: [], // No hive membership
    });

    const result = await canAccessPet('random-user', 'pet-1');

    expect(result).toEqual({ canAccess: false, role: null });
  });
});

describe('canWriteToPet', () => {
  describe('Role-Based Write Access', () => {
    it('returns true for OWNER', async () => {
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'owner-1',
        hives: [],
      });

      const result = await canWriteToPet('owner-1', 'pet-1');

      expect(result).toBe(true);
    });

    it('returns true for CAREGIVER', async () => {
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'owner-1',
        hives: [{ role: 'CAREGIVER' }],
      });

      const result = await canWriteToPet('caregiver-1', 'pet-1');

      expect(result).toBe(true);
    });

    it('returns false for VIEWER (read-only role)', async () => {
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'owner-1',
        hives: [{ role: 'VIEWER' }],
      });

      const result = await canWriteToPet('viewer-1', 'pet-1');

      expect(result).toBe(false);
    });

    it('returns false when user has no access', async () => {
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'owner-1',
        hives: [],
      });

      const result = await canWriteToPet('random-user', 'pet-1');

      expect(result).toBe(false);
    });

    it('returns false when pet does not exist', async () => {
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await canWriteToPet('user-1', 'nonexistent-pet');

      expect(result).toBe(false);
    });
  });

  describe('VIEWER Role Enforcement Contract', () => {
    /**
     * These tests explicitly document that VIEWER is a read-only role.
     * Any change to this behavior would break the security model.
     */

    it('VIEWER cannot write even if they have valid hive membership', async () => {
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'owner-1',
        hives: [{ role: 'VIEWER' }],
      });

      const canWrite = await canWriteToPet('viewer-1', 'pet-1');

      expect(canWrite).toBe(false);
    });

    it('CAREGIVER can write with valid hive membership', async () => {
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'owner-1',
        hives: [{ role: 'CAREGIVER' }],
      });

      const canWrite = await canWriteToPet('caregiver-1', 'pet-1');

      expect(canWrite).toBe(true);
    });
  });
});
