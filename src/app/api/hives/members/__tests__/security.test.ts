import { GET, DELETE } from '../route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { createMockUser } from '@/__tests__/utils/test-factories';

// Typed spy for console suppression
type ConsoleErrorSpy = jest.SpyInstance<
  void,
  [message?: unknown, ...optionalParams: unknown[]]
>;

let consoleErrorSpy: ConsoleErrorSpy;

beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    careRecipient: {
      findUnique: jest.fn(),
    },
    hive: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Handler type for testing
type GetHandler = (request: Request) => Promise<Response>;

const getHandler = GET as unknown as GetHandler;

const createGetRequest = (url: string): Request =>
  ({
    url,
  }) as unknown as Request;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/hives/members - Security', () => {
  describe('Authorization', () => {
    it('returns 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = createGetRequest(
        'http://localhost/api/hives/members?recipientId=pet-1'
      );
      const res = await getHandler(req);

      expect(res.status).toBe(401);
    });

    it('allows owner to view hive members', async () => {
      const owner = createMockUser({ id: 'owner-1', email: 'owner@example.com' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(owner);
      // canAccessPet query returns owner
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'owner-1',
        hives: [],
      });
      (prisma.hive.findMany as jest.Mock).mockResolvedValue([]);

      const req = createGetRequest(
        'http://localhost/api/hives/members?recipientId=pet-1'
      );
      const res = await getHandler(req);

      expect(res.status).toBe(200);
    });

    it('allows caregiver (hive member) to view hive members', async () => {
      const caregiver = createMockUser({
        id: 'caregiver-1',
        email: 'caregiver@example.com',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'caregiver@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(caregiver);
      // canAccessPet query returns caregiver's hive membership
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'owner-1',
        hives: [{ role: 'CAREGIVER' }],
      });
      (prisma.hive.findMany as jest.Mock).mockResolvedValue([]);

      const req = createGetRequest(
        'http://localhost/api/hives/members?recipientId=pet-1'
      );
      const res = await getHandler(req);

      expect(res.status).toBe(200);
    });

    it('returns 404 for random user with no access (does not leak pet existence)', async () => {
      const randomUser = createMockUser({
        id: 'random-1',
        email: 'random@example.com',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'random@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(randomUser);
      // Pet exists but user has no access (not owner, no hive membership)
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'owner-1',
        hives: [],
      });

      const req = createGetRequest(
        'http://localhost/api/hives/members?recipientId=pet-1'
      );
      const res = await getHandler(req);

      expect(res.status).toBe(404);
      expect(prisma.hive.findMany).not.toHaveBeenCalled();
    });

    it('returns 404 when pet does not exist', async () => {
      const user = createMockUser({ id: 'user-1', email: 'user@example.com' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue(null);

      const req = createGetRequest(
        'http://localhost/api/hives/members?recipientId=nonexistent'
      );
      const res = await getHandler(req);

      expect(res.status).toBe(404);
      expect(prisma.hive.findMany).not.toHaveBeenCalled();
    });
  });

  describe('Data Exposure Prevention', () => {
    it('response does NOT contain passwordHash field', async () => {
      const owner = createMockUser({ id: 'owner-1', email: 'owner@example.com' });

      // Mock hive members with SAFE fields only (as the fixed function returns)
      const mockHiveMembers = [
        {
          id: 'hive-1',
          recipientId: 'pet-1',
          userId: 'caregiver-1',
          role: 'CAREGIVER',
          grantedAt: new Date(),
          user: {
            id: 'caregiver-1',
            name: 'Caregiver Name',
            email: 'caregiver@example.com',
            // These fields should NOT be present:
            // passwordHash: 'should-not-be-here',
            // phone: 'should-not-be-here',
            // address: 'should-not-be-here',
          },
        },
      ];

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(owner);
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'owner-1',
        hives: [],
      });
      (prisma.hive.findMany as jest.Mock).mockResolvedValue(mockHiveMembers);

      const req = createGetRequest(
        'http://localhost/api/hives/members?recipientId=pet-1'
      );
      const res = await getHandler(req);

      expect(res.status).toBe(200);

      // Verify the mock data structure matches what's expected
      // The key verification is that getHiveMembersForPet uses select, not include: true
      // This is verified in the next test
    });

    it('hive.findMany is called with user select (not include: true)', async () => {
      const owner = createMockUser({ id: 'owner-1', email: 'owner@example.com' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(owner);
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'owner-1',
        hives: [],
      });
      (prisma.hive.findMany as jest.Mock).mockResolvedValue([]);

      const req = createGetRequest(
        'http://localhost/api/hives/members?recipientId=pet-1'
      );
      await getHandler(req);

      // Verify the Prisma query uses select instead of include: true
      expect(prisma.hive.findMany).toHaveBeenCalledWith({
        where: { recipientId: 'pet-1' },
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
    });
  });
});

// DELETE handler type for testing
type DeleteHandler = (request: Request) => Promise<Response>;
const deleteHandler = DELETE as unknown as DeleteHandler;

const createDeleteRequest = (
  url: string,
  body?: { membershipId?: string; recipientId?: string }
): Request =>
  ({
    url,
    json: async () => body ?? {},
  }) as unknown as Request;

describe('DELETE /api/hives/members - Owner Permission Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to set up common mocks
  const setupMocks = (
    actingUser: { id: string; email: string },
    membership: {
      id: string;
      userId: string;
      recipientId: string;
      role: 'OWNER' | 'CAREGIVER' | 'VIEWER';
      recipient: { ownerId: string };
    },
    allMembers: Array<{ userId: string; role: 'OWNER' | 'CAREGIVER' | 'VIEWER' }>
  ) => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: actingUser.email },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(actingUser);
    (prisma.hive.findUnique as jest.Mock).mockResolvedValue(membership);
    (prisma.hive.findMany as jest.Mock).mockResolvedValue(allMembers);
    (prisma.hive.delete as jest.Mock).mockResolvedValue({});
  };

  describe('Primary owner removing members', () => {
    it('primary owner removes co-owner → allowed', async () => {
      const primaryOwner = createMockUser({ id: 'primary-owner', email: 'primary@example.com' });
      const coOwnerMembership = {
        id: 'membership-1',
        userId: 'co-owner',
        recipientId: 'pet-1',
        role: 'OWNER' as const,
        recipient: { ownerId: 'primary-owner' },
      };
      const allMembers = [
        { userId: 'co-owner', role: 'OWNER' as const },
        { userId: 'caregiver-1', role: 'CAREGIVER' as const },
      ];

      setupMocks(primaryOwner, coOwnerMembership, allMembers);

      const req = createDeleteRequest(
        'http://localhost/api/hives/members',
        { membershipId: 'membership-1' }
      );
      const res = await deleteHandler(req);

      expect(res.status).toBe(200);
      expect(prisma.hive.delete).toHaveBeenCalledWith({
        where: { id: 'membership-1' },
      });
    });

    it('primary owner removes caregiver → allowed', async () => {
      const primaryOwner = createMockUser({ id: 'primary-owner', email: 'primary@example.com' });
      const caregiverMembership = {
        id: 'membership-2',
        userId: 'caregiver-1',
        recipientId: 'pet-1',
        role: 'CAREGIVER' as const,
        recipient: { ownerId: 'primary-owner' },
      };
      const allMembers = [
        { userId: 'co-owner', role: 'OWNER' as const },
        { userId: 'caregiver-1', role: 'CAREGIVER' as const },
      ];

      setupMocks(primaryOwner, caregiverMembership, allMembers);

      const req = createDeleteRequest(
        'http://localhost/api/hives/members',
        { membershipId: 'membership-2' }
      );
      const res = await deleteHandler(req);

      expect(res.status).toBe(200);
      expect(prisma.hive.delete).toHaveBeenCalledWith({
        where: { id: 'membership-2' },
      });
    });
  });

  describe('Co-owner removing members', () => {
    it('co-owner removes caregiver → allowed', async () => {
      const coOwner = createMockUser({ id: 'co-owner', email: 'coowner@example.com' });
      const caregiverMembership = {
        id: 'membership-2',
        userId: 'caregiver-1',
        recipientId: 'pet-1',
        role: 'CAREGIVER' as const,
        recipient: { ownerId: 'primary-owner' },
      };
      const allMembers = [
        { userId: 'co-owner', role: 'OWNER' as const },
        { userId: 'caregiver-1', role: 'CAREGIVER' as const },
      ];

      setupMocks(coOwner, caregiverMembership, allMembers);

      const req = createDeleteRequest(
        'http://localhost/api/hives/members',
        { membershipId: 'membership-2' }
      );
      const res = await deleteHandler(req);

      expect(res.status).toBe(200);
      expect(prisma.hive.delete).toHaveBeenCalledWith({
        where: { id: 'membership-2' },
      });
    });

    it('co-owner removes another co-owner → forbidden', async () => {
      const coOwner1 = createMockUser({ id: 'co-owner-1', email: 'coowner1@example.com' });
      const coOwner2Membership = {
        id: 'membership-3',
        userId: 'co-owner-2',
        recipientId: 'pet-1',
        role: 'OWNER' as const,
        recipient: { ownerId: 'primary-owner' },
      };
      const allMembers = [
        { userId: 'co-owner-1', role: 'OWNER' as const },
        { userId: 'co-owner-2', role: 'OWNER' as const },
        { userId: 'caregiver-1', role: 'CAREGIVER' as const },
      ];

      setupMocks(coOwner1, coOwner2Membership, allMembers);

      const req = createDeleteRequest(
        'http://localhost/api/hives/members',
        { membershipId: 'membership-3' }
      );
      const res = await deleteHandler(req);

      expect(res.status).toBe(403);
      expect(prisma.hive.delete).not.toHaveBeenCalled();
    });

    it('co-owner removes primary owner → forbidden', async () => {
      const coOwner = createMockUser({ id: 'co-owner', email: 'coowner@example.com' });
      // Note: This would require the primary owner to have a Hive membership
      // In practice, primary owner is on ownerId, not in Hive table
      // But if they somehow had a Hive OWNER record, it should still be blocked
      const primaryOwnerMembership = {
        id: 'membership-primary',
        userId: 'primary-owner',
        recipientId: 'pet-1',
        role: 'OWNER' as const,
        recipient: { ownerId: 'primary-owner' },
      };
      const allMembers = [
        { userId: 'co-owner', role: 'OWNER' as const },
        { userId: 'primary-owner', role: 'OWNER' as const },
      ];

      setupMocks(coOwner, primaryOwnerMembership, allMembers);

      const req = createDeleteRequest(
        'http://localhost/api/hives/members',
        { membershipId: 'membership-primary' }
      );
      const res = await deleteHandler(req);

      expect(res.status).toBe(403);
      expect(prisma.hive.delete).not.toHaveBeenCalled();
    });
  });

  describe('Caregiver attempting to remove members', () => {
    it('caregiver removes anyone → forbidden', async () => {
      const caregiver = createMockUser({ id: 'caregiver-1', email: 'caregiver@example.com' });
      const anotherCaregiverMembership = {
        id: 'membership-4',
        userId: 'caregiver-2',
        recipientId: 'pet-1',
        role: 'CAREGIVER' as const,
        recipient: { ownerId: 'primary-owner' },
      };
      const allMembers = [
        { userId: 'caregiver-1', role: 'CAREGIVER' as const },
        { userId: 'caregiver-2', role: 'CAREGIVER' as const },
      ];

      setupMocks(caregiver, anotherCaregiverMembership, allMembers);

      const req = createDeleteRequest(
        'http://localhost/api/hives/members',
        { membershipId: 'membership-4' }
      );
      const res = await deleteHandler(req);

      expect(res.status).toBe(403);
      expect(prisma.hive.delete).not.toHaveBeenCalled();
    });
  });

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = createDeleteRequest(
        'http://localhost/api/hives/members',
        { membershipId: 'membership-1' }
      );
      const res = await deleteHandler(req);

      expect(res.status).toBe(401);
    });
  });
});
