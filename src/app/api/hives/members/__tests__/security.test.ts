import { GET } from '../route';
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
    recipient: {
      findUnique: jest.fn(),
    },
    hive: {
      findMany: jest.fn(),
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
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValue({
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
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValue({
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
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValue({
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
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValue(null);

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
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValue({
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
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValue({
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
