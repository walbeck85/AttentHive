import { POST, GET } from '../../../app/api/care-logs/route';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createMockUser, createMockCareLog } from '../../utils/test-factories';

// Typed spy for console suppression
type ConsoleErrorSpy = jest.SpyInstance<void, [message?: unknown, ...optionalParams: unknown[]]>;

let consoleErrorSpy: ConsoleErrorSpy;

beforeAll(() => {
  // Suppress console.error in tests to keep output clean
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
    careRecipient: {
      findUnique: jest.fn(),
    },
    careLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Handler types for testing - simplified from Next's complex types
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

describe('POST /api/care-logs', () => {
  describe('Success cases', () => {
    it('creates care log when user owns the pet', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'owner@example.com' });
      const mockCareLog = createMockCareLog({
        id: 'log-1',
        recipientId: 'pet-1',
        userId: 'user-1',
        activityType: 'FEED',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      // Mock must return hives array for canWriteToRecipient authorization check
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'user-1',
        hives: [],
      });
      (prisma.careLog.create as jest.Mock).mockResolvedValue(mockCareLog);

      const req = createRequest({
        petId: 'pet-1',
        activityType: 'FEED',
        notes: 'Morning feeding',
      });

      const res = await postHandler(req);

      expect(res.status).toBe(201);
      expect(prisma.careLog.create).toHaveBeenCalledWith({
        data: {
          recipientId: 'pet-1',
          userId: 'user-1',
          activityType: 'FEED',
          notes: 'Morning feeding',
          metadata: Prisma.JsonNull,
          photoUrl: null,
        },
      });
    });

    it('creates care log when user is in care circle', async () => {
      const mockUser = createMockUser({ id: 'caregiver-1', email: 'caregiver@example.com' });
      const mockCareLog = createMockCareLog({
        id: 'log-2',
        recipientId: 'pet-1',
        userId: 'caregiver-1',
        activityType: 'WALK',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'caregiver@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      // Mock must return hives array for canWriteToRecipient authorization check
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'owner-1',
        hives: [{ role: 'CAREGIVER' }],
      });
      (prisma.careLog.create as jest.Mock).mockResolvedValue(mockCareLog);

      const req = createRequest({
        petId: 'pet-1',
        activityType: 'WALK',
      });

      const res = await postHandler(req);

      expect(res.status).toBe(201);
      expect(prisma.careLog.create).toHaveBeenCalledWith({
        data: {
          recipientId: 'pet-1',
          userId: 'caregiver-1',
          activityType: 'WALK',
          notes: null,
          metadata: Prisma.JsonNull,
          photoUrl: null,
        },
      });
    });

    it('creates care log with null notes when not provided', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });
      const mockCareLog = createMockCareLog({
        id: 'log-3',
        recipientId: 'pet-1',
        userId: 'user-1',
        activityType: 'MEDICATE',
        notes: null,
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'user-1',
        hives: [],
      });
      (prisma.careLog.create as jest.Mock).mockResolvedValue(mockCareLog);

      const req = createRequest({
        petId: 'pet-1',
        activityType: 'MEDICATE',
      });

      const res = await postHandler(req);

      expect(res.status).toBe(201);
      expect(prisma.careLog.create).toHaveBeenCalledWith({
        data: {
          recipientId: 'pet-1',
          userId: 'user-1',
          activityType: 'MEDICATE',
          notes: null,
          metadata: Prisma.JsonNull,
          photoUrl: null,
        },
      });
    });

    it('creates walk care log with metadata', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });
      const walkMetadata = {
        durationSeconds: 900,
        bathroomEvents: [
          { type: 'URINATION', occurredAt: '2024-01-15T10:05:00Z', minutesIntoWalk: 5 },
          { type: 'DEFECATION', occurredAt: '2024-01-15T10:10:00Z', minutesIntoWalk: 10 },
        ],
      };
      const mockCareLog = createMockCareLog({
        id: 'log-4',
        recipientId: 'pet-1',
        userId: 'user-1',
        activityType: 'WALK',
        metadata: walkMetadata,
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'user-1',
        hives: [],
      });
      (prisma.careLog.create as jest.Mock).mockResolvedValue(mockCareLog);

      const req = createRequest({
        petId: 'pet-1',
        activityType: 'WALK',
        metadata: walkMetadata,
      });

      const res = await postHandler(req);

      expect(res.status).toBe(201);
      expect(prisma.careLog.create).toHaveBeenCalledWith({
        data: {
          recipientId: 'pet-1',
          userId: 'user-1',
          activityType: 'WALK',
          notes: null,
          metadata: walkMetadata,
          photoUrl: null,
        },
      });
    });

    it('creates walk care log without metadata (backward compatible)', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });
      const mockCareLog = createMockCareLog({
        id: 'log-5',
        recipientId: 'pet-1',
        userId: 'user-1',
        activityType: 'WALK',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'user-1',
        hives: [],
      });
      (prisma.careLog.create as jest.Mock).mockResolvedValue(mockCareLog);

      const req = createRequest({
        petId: 'pet-1',
        activityType: 'WALK',
      });

      const res = await postHandler(req);

      expect(res.status).toBe(201);
      expect(prisma.careLog.create).toHaveBeenCalledWith({
        data: {
          recipientId: 'pet-1',
          userId: 'user-1',
          activityType: 'WALK',
          notes: null,
          metadata: Prisma.JsonNull,
          photoUrl: null,
        },
      });
    });

    it('creates care log with photoUrl when provided', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });
      const mockCareLog = createMockCareLog({
        id: 'log-6',
        recipientId: 'pet-1',
        userId: 'user-1',
        activityType: 'FEED',
        photoUrl: 'https://example.com/activity-photo.jpg',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
        ownerId: 'user-1',
        hives: [],
      });
      (prisma.careLog.create as jest.Mock).mockResolvedValue(mockCareLog);

      const req = createRequest({
        petId: 'pet-1',
        activityType: 'FEED',
        photoUrl: 'https://example.com/activity-photo.jpg',
      });

      const res = await postHandler(req);

      expect(res.status).toBe(201);
      expect(prisma.careLog.create).toHaveBeenCalledWith({
        data: {
          recipientId: 'pet-1',
          userId: 'user-1',
          activityType: 'FEED',
          notes: null,
          metadata: Prisma.JsonNull,
          photoUrl: 'https://example.com/activity-photo.jpg',
        },
      });
    });
  });

  describe('Error cases', () => {
    it('returns 401 when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = createRequest({
        petId: 'pet-1',
        activityType: 'FEED',
      });

      const res = await postHandler(req);

      expect(res.status).toBe(401);
      expect(prisma.careLog.create).not.toHaveBeenCalled();
    });

    it('returns 400 when petId is missing', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const req = createRequest({
        activityType: 'FEED',
      });

      const res = await postHandler(req);

      expect(res.status).toBe(400);
      expect(prisma.careLog.create).not.toHaveBeenCalled();
    });

    it('returns 400 when activityType is missing', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const req = createRequest({
        petId: 'pet-1',
      });

      const res = await postHandler(req);

      expect(res.status).toBe(400);
      expect(prisma.careLog.create).not.toHaveBeenCalled();
    });

    it('returns 400 when activityType is invalid', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const req = createRequest({
        petId: 'pet-1',
        activityType: 'INVALID_TYPE',
      });

      const res = await postHandler(req);

      expect(res.status).toBe(400);
      expect(prisma.careLog.create).not.toHaveBeenCalled();
    });

    it('returns 404 when pet does not exist', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue(null);

      const req = createRequest({
        petId: 'nonexistent-pet',
        activityType: 'FEED',
      });

      const res = await postHandler(req);

      expect(res.status).toBe(404);
      expect(prisma.careLog.create).not.toHaveBeenCalled();
    });
  });
});

describe('GET /api/care-logs', () => {
  it('returns care logs for a pet', async () => {
    const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });
    const mockLogs = [
      createMockCareLog({ id: 'log-1', recipientId: 'pet-1', userId: 'user-1', activityType: 'FEED' }),
      createMockCareLog({ id: 'log-2', recipientId: 'pet-1', userId: 'user-1', activityType: 'WALK' }),
    ];

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'user@example.com' },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    // First call is for canAccessRecipient, second for pet name
    (prisma.careRecipient.findUnique as jest.Mock)
      .mockResolvedValueOnce({ ownerId: 'user-1', hives: [] })
      .mockResolvedValueOnce({ name: 'Buddy' });
    (prisma.careLog.findMany as jest.Mock).mockResolvedValue(mockLogs);

    const req = createGetRequest('http://localhost/api/care-logs?id=pet-1');

    const res = await getHandler(req);

    expect(res.status).toBe(200);
    expect(prisma.careLog.findMany).toHaveBeenCalledWith({
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('returns 401 when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = createGetRequest('http://localhost/api/care-logs?id=pet-1');

    const res = await getHandler(req);

    expect(res.status).toBe(401);
    expect(prisma.careLog.findMany).not.toHaveBeenCalled();
  });

  it('returns 400 when pet id is missing', async () => {
    const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'user@example.com' },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const req = createGetRequest('http://localhost/api/care-logs');

    const res = await getHandler(req);

    expect(res.status).toBe(400);
    expect(prisma.careLog.findMany).not.toHaveBeenCalled();
  });

  it('returns 404 when pet does not exist', async () => {
    const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'user@example.com' },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createGetRequest('http://localhost/api/care-logs?id=nonexistent');

    const res = await getHandler(req);

    expect(res.status).toBe(404);
    expect(prisma.careLog.findMany).not.toHaveBeenCalled();
  });
});
