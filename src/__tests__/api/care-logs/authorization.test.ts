import { POST, GET } from '../../../app/api/care-logs/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import {
  createMockUser,
  createMockRecipient,
  createMockCareLog,
} from '../../utils/test-factories';

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
      create: jest.fn(),
    },
    recipient: {
      findUnique: jest.fn(),
    },
    careLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Handler types for testing
type PostHandler = (request: Request) => Promise<Response>;
type GetHandler = (request: Request) => Promise<Response>;

const postHandler = POST as unknown as PostHandler;
const getHandler = GET as unknown as GetHandler;

type JsonBody = Record<string, unknown>;

const createRequest = (body: JsonBody): Request =>
  ({
    json: async () => body,
  }) as unknown as Request;

const createGetRequest = (url: string): Request =>
  ({
    url,
  }) as unknown as Request;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Care Logs Authorization', () => {
  describe('GET /api/care-logs - Read Access', () => {
    it('returns 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = createGetRequest('http://localhost/api/care-logs?id=pet-1');
      const res = await getHandler(req);

      expect(res.status).toBe(401);
    });

    it('allows owner to read their pet logs', async () => {
      const owner = createMockUser({ id: 'owner-1', email: 'owner@example.com' });
      const pet = createMockRecipient({ id: 'pet-1', ownerId: 'owner-1' });
      const logs = [
        createMockCareLog({ recipientId: 'pet-1', userId: 'owner-1' }),
      ];

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(owner);
      // First call for canAccessPet, second call for pet name
      (prisma.recipient.findUnique as jest.Mock)
        .mockResolvedValueOnce({ ownerId: 'owner-1', hives: [] })
        .mockResolvedValueOnce(pet);
      (prisma.careLog.findMany as jest.Mock).mockResolvedValue(logs);

      const req = createGetRequest('http://localhost/api/care-logs?id=pet-1');
      const res = await getHandler(req);

      expect(res.status).toBe(200);
    });

    it('allows CAREGIVER (via Hive) to read pet logs', async () => {
      const caregiver = createMockUser({
        id: 'caregiver-1',
        email: 'caregiver@example.com',
      });
      const pet = createMockRecipient({ id: 'pet-1', ownerId: 'owner-1' });
      const logs = [createMockCareLog({ recipientId: 'pet-1' })];

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'caregiver@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(caregiver);
      (prisma.recipient.findUnique as jest.Mock)
        .mockResolvedValueOnce({ ownerId: 'owner-1', hives: [{ role: 'CAREGIVER' }] })
        .mockResolvedValueOnce(pet);
      (prisma.careLog.findMany as jest.Mock).mockResolvedValue(logs);

      const req = createGetRequest('http://localhost/api/care-logs?id=pet-1');
      const res = await getHandler(req);

      expect(res.status).toBe(200);
    });

    it('allows VIEWER (via Hive) to read pet logs', async () => {
      const viewer = createMockUser({
        id: 'viewer-1',
        email: 'viewer@example.com',
      });
      const pet = createMockRecipient({ id: 'pet-1', ownerId: 'owner-1' });
      const logs = [createMockCareLog({ recipientId: 'pet-1' })];

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'viewer@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(viewer);
      (prisma.recipient.findUnique as jest.Mock)
        .mockResolvedValueOnce({ ownerId: 'owner-1', hives: [{ role: 'VIEWER' }] })
        .mockResolvedValueOnce(pet);
      (prisma.careLog.findMany as jest.Mock).mockResolvedValue(logs);

      const req = createGetRequest('http://localhost/api/care-logs?id=pet-1');
      const res = await getHandler(req);

      expect(res.status).toBe(200);
    });

    it('returns 404 for random authenticated user (no access)', async () => {
      const randomUser = createMockUser({
        id: 'random-1',
        email: 'random@example.com',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'random@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(randomUser);
      // Pet exists but user has no access (not owner, no hive membership)
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValueOnce({
        ownerId: 'owner-1',
        hives: [],
      });

      const req = createGetRequest('http://localhost/api/care-logs?id=pet-1');
      const res = await getHandler(req);

      expect(res.status).toBe(404);
      expect(prisma.careLog.findMany).not.toHaveBeenCalled();
    });

    it('returns 404 when pet does not exist', async () => {
      const user = createMockUser({ id: 'user-1', email: 'user@example.com' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const req = createGetRequest('http://localhost/api/care-logs?id=nonexistent');
      const res = await getHandler(req);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/care-logs - Write Access', () => {
    it('returns 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = createRequest({ petId: 'pet-1', activityType: 'FEED' });
      const res = await postHandler(req);

      expect(res.status).toBe(401);
    });

    it('allows owner to create care logs', async () => {
      const owner = createMockUser({ id: 'owner-1', email: 'owner@example.com' });
      const careLog = createMockCareLog({
        recipientId: 'pet-1',
        userId: 'owner-1',
        activityType: 'FEED',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(owner);
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValueOnce({
        ownerId: 'owner-1',
        hives: [],
      });
      (prisma.careLog.create as jest.Mock).mockResolvedValue(careLog);

      const req = createRequest({ petId: 'pet-1', activityType: 'FEED' });
      const res = await postHandler(req);

      expect(res.status).toBe(201);
      expect(prisma.careLog.create).toHaveBeenCalled();
    });

    it('allows CAREGIVER (via Hive) to create care logs', async () => {
      const caregiver = createMockUser({
        id: 'caregiver-1',
        email: 'caregiver@example.com',
      });
      const careLog = createMockCareLog({
        recipientId: 'pet-1',
        userId: 'caregiver-1',
        activityType: 'WALK',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'caregiver@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(caregiver);
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValueOnce({
        ownerId: 'owner-1',
        hives: [{ role: 'CAREGIVER' }],
      });
      (prisma.careLog.create as jest.Mock).mockResolvedValue(careLog);

      const req = createRequest({ petId: 'pet-1', activityType: 'WALK' });
      const res = await postHandler(req);

      expect(res.status).toBe(201);
      expect(prisma.careLog.create).toHaveBeenCalled();
    });

    it('denies VIEWER (via Hive) from creating care logs - returns 404', async () => {
      const viewer = createMockUser({
        id: 'viewer-1',
        email: 'viewer@example.com',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'viewer@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(viewer);
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValueOnce({
        ownerId: 'owner-1',
        hives: [{ role: 'VIEWER' }],
      });

      const req = createRequest({ petId: 'pet-1', activityType: 'FEED' });
      const res = await postHandler(req);

      expect(res.status).toBe(404);
      expect(prisma.careLog.create).not.toHaveBeenCalled();
    });

    it('returns 404 for random authenticated user (no access)', async () => {
      const randomUser = createMockUser({
        id: 'random-1',
        email: 'random@example.com',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'random@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(randomUser);
      // Pet exists but user has no access
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValueOnce({
        ownerId: 'owner-1',
        hives: [],
      });

      const req = createRequest({ petId: 'pet-1', activityType: 'FEED' });
      const res = await postHandler(req);

      expect(res.status).toBe(404);
      expect(prisma.careLog.create).not.toHaveBeenCalled();
    });

    it('returns 404 when pet does not exist', async () => {
      const user = createMockUser({ id: 'user-1', email: 'user@example.com' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const req = createRequest({ petId: 'nonexistent', activityType: 'FEED' });
      const res = await postHandler(req);

      expect(res.status).toBe(404);
      expect(prisma.careLog.create).not.toHaveBeenCalled();
    });
  });

  describe('OAuth User Access (session.user.id !== dbUser.id)', () => {
    /**
     * CRITICAL: This test verifies the fix for OAuth users.
     * For Google OAuth users, session.user.id is NOT the database User.id.
     * Authorization must use email-based lookup to find the correct dbUser.id.
     */
    it('allows OAuth user to read their pet logs despite session.user.id mismatch', async () => {
      // OAuth user: session.user.id is a random NextAuth ID, NOT the database id
      const oauthSessionUserId = 'oauth-nextauth-generated-id-12345';
      const dbUserId = 'cuid-database-user-id-abc123';

      const dbUser = createMockUser({
        id: dbUserId,
        email: 'oauth.user@gmail.com',
      });
      const logs = [
        createMockCareLog({ recipientId: 'pet-1', userId: dbUserId }),
      ];

      // Session has mismatched ID (OAuth scenario)
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: oauthSessionUserId, // Different from dbUser.id!
          email: 'oauth.user@gmail.com',
        },
      });

      // Email-based lookup returns the correct database user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(dbUser);

      // Authorization check uses dbUser.id (the correct one)
      (prisma.recipient.findUnique as jest.Mock)
        .mockResolvedValueOnce({ ownerId: dbUserId, hives: [] })
        .mockResolvedValueOnce({ name: 'Buddy' });
      (prisma.careLog.findMany as jest.Mock).mockResolvedValue(logs);

      const req = createGetRequest('http://localhost/api/care-logs?id=pet-1');
      const res = await getHandler(req);

      // Should succeed because we use email lookup, not session.user.id
      expect(res.status).toBe(200);
      expect(prisma.careLog.findMany).toHaveBeenCalled();
    });

    it('allows OAuth user to create care logs despite session.user.id mismatch', async () => {
      const oauthSessionUserId = 'oauth-nextauth-generated-id-67890';
      const dbUserId = 'cuid-database-user-id-xyz789';

      const dbUser = createMockUser({
        id: dbUserId,
        email: 'another.oauth@gmail.com',
      });
      const careLog = createMockCareLog({
        recipientId: 'pet-1',
        userId: dbUserId,
        activityType: 'FEED',
      });

      // Session has mismatched ID (OAuth scenario)
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: oauthSessionUserId, // Different from dbUser.id!
          email: 'another.oauth@gmail.com',
        },
      });

      // Email-based lookup returns the correct database user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(dbUser);

      // Authorization uses dbUser.id
      (prisma.recipient.findUnique as jest.Mock).mockResolvedValueOnce({
        ownerId: dbUserId,
        hives: [],
      });
      (prisma.careLog.create as jest.Mock).mockResolvedValue(careLog);

      const req = createRequest({ petId: 'pet-1', activityType: 'FEED' });
      const res = await postHandler(req);

      // Should succeed because we use email lookup
      expect(res.status).toBe(201);
      expect(prisma.careLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: dbUserId, // Must use DB id, not session id
          }),
        })
      );
    });
  });
});
