import { POST, GET } from '../../../app/api/care-recipients/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { createMockUser, createMockCareRecipient } from '../../utils/test-factories';

// Typed spies for console suppression
type ConsoleSpy = jest.SpyInstance<void, [message?: unknown, ...optionalParams: unknown[]]>;

let consoleErrorSpy: ConsoleSpy;
let consoleLogSpy: ConsoleSpy;

beforeAll(() => {
  // Suppress console output in tests to keep output clean
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
  consoleLogSpy.mockRestore();
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
      upsert: jest.fn(),
    },
    careRecipient: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Handler types for testing - simplified from Next's complex types
type PostHandler = (request: Request) => Promise<Response>;
type GetHandler = () => Promise<Response>;

const postHandler = POST as unknown as PostHandler;
const getHandler = GET as unknown as GetHandler;

type JsonBody = Record<string, unknown>;

const createRequest = (body: JsonBody): Request =>
  ({
    json: async () => body,
  }) as unknown as Request;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/care-recipients', () => {
  it("returns user's pets when authenticated", async () => {
    const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });
    const mockPets = [
      createMockCareRecipient({ id: 'pet-1', name: 'Buddy', ownerId: 'user-1' }),
      createMockCareRecipient({ id: 'pet-2', name: 'Max', ownerId: 'user-1' }),
    ];

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'user@example.com' },
    });
    (prisma.user.upsert as jest.Mock).mockResolvedValue(mockUser);
    (prisma.careRecipient.findMany as jest.Mock).mockResolvedValue(mockPets);

    const res = await getHandler();

    expect(res.status).toBe(200);
    expect(prisma.careRecipient.findMany).toHaveBeenCalledWith({
      where: { ownerId: 'user-1' },
      include: {
        careLogs: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('returns 401 when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const res = await getHandler();

    expect(res.status).toBe(401);
    expect(prisma.careRecipient.findMany).not.toHaveBeenCalled();
  });

  it('returns empty array when user has no pets', async () => {
    const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'user@example.com' },
    });
    (prisma.user.upsert as jest.Mock).mockResolvedValue(mockUser);
    (prisma.careRecipient.findMany as jest.Mock).mockResolvedValue([]);

    const res = await getHandler();

    expect(res.status).toBe(200);
    expect(prisma.careRecipient.findMany).toHaveBeenCalled();
  });
});

describe('POST /api/care-recipients', () => {
  const validPetData = {
    name: 'Buddy',
    subtype: 'DOG',
    breed: 'Labrador',
    gender: 'MALE',
    birthDate: '2020-01-15',
    weight: 25.5,
  };

  describe('Success cases', () => {
    it('creates pet with required fields', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });
      const mockPet = createMockCareRecipient({
        id: 'pet-1',
        name: 'Buddy',
        ownerId: 'user-1',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.upsert as jest.Mock).mockResolvedValue(mockUser);
      (prisma.careRecipient.create as jest.Mock).mockResolvedValue(mockPet);

      const req = createRequest(validPetData);
      const res = await postHandler(req);

      expect(res.status).toBe(201);
      expect(prisma.careRecipient.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Buddy',
          subtype: 'DOG',
          breed: 'Labrador',
          gender: 'MALE',
          weight: 25.5,
          ownerId: 'user-1',
        }),
      });
    });

    it('creates pet with optional description and specialNotes', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });
      const mockPet = createMockCareRecipient({
        id: 'pet-1',
        name: 'Buddy',
        description: 'A friendly dog',
        specialNotes: 'Needs medication daily',
        ownerId: 'user-1',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.upsert as jest.Mock).mockResolvedValue(mockUser);
      (prisma.careRecipient.create as jest.Mock).mockResolvedValue(mockPet);

      const req = createRequest({
        ...validPetData,
        description: 'A friendly dog',
        specialNotes: 'Needs medication daily',
      });
      const res = await postHandler(req);

      expect(res.status).toBe(201);
      expect(prisma.careRecipient.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'A friendly dog',
          specialNotes: 'Needs medication daily',
        }),
      });
    });

    it('creates pet with characteristics', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });
      const mockPet = createMockCareRecipient({
        id: 'pet-1',
        name: 'Buddy',
        characteristics: ['ALLERGIES', 'SHY'],
        ownerId: 'user-1',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.upsert as jest.Mock).mockResolvedValue(mockUser);
      (prisma.careRecipient.create as jest.Mock).mockResolvedValue(mockPet);

      const req = createRequest({
        ...validPetData,
        characteristics: ['ALLERGIES', 'SHY'],
      });
      const res = await postHandler(req);

      expect(res.status).toBe(201);
      expect(prisma.careRecipient.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          characteristics: ['ALLERGIES', 'SHY'],
        }),
      });
    });
  });

  describe('Error cases', () => {
    it('returns 401 when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = createRequest(validPetData);
      const res = await postHandler(req);

      expect(res.status).toBe(401);
      expect(prisma.careRecipient.create).not.toHaveBeenCalled();
    });

    it('returns 400 when name is missing', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.upsert as jest.Mock).mockResolvedValue(mockUser);

      const { name: _, ...dataWithoutName } = validPetData;
      void _; // Suppress unused variable warning
      const req = createRequest(dataWithoutName);
      const res = await postHandler(req);

      expect(res.status).toBe(400);
      expect(prisma.careRecipient.create).not.toHaveBeenCalled();
    });

    it('returns 400 when subtype is missing', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.upsert as jest.Mock).mockResolvedValue(mockUser);

      const { subtype: __, ...dataWithoutSubtype } = validPetData;
      void __; // Suppress unused variable warning
      const req = createRequest(dataWithoutSubtype);
      const res = await postHandler(req);

      expect(res.status).toBe(400);
      expect(prisma.careRecipient.create).not.toHaveBeenCalled();
    });

    it('returns 400 when description exceeds 500 chars', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.upsert as jest.Mock).mockResolvedValue(mockUser);

      const req = createRequest({
        ...validPetData,
        description: 'a'.repeat(501),
      });
      const res = await postHandler(req);

      expect(res.status).toBe(400);
      expect(prisma.careRecipient.create).not.toHaveBeenCalled();
    });

    it('returns 400 when specialNotes exceeds 500 chars', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.upsert as jest.Mock).mockResolvedValue(mockUser);

      const req = createRequest({
        ...validPetData,
        specialNotes: 'a'.repeat(501),
      });
      const res = await postHandler(req);

      expect(res.status).toBe(400);
      expect(prisma.careRecipient.create).not.toHaveBeenCalled();
    });

    it('returns 400 when weight is negative', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.upsert as jest.Mock).mockResolvedValue(mockUser);

      const req = createRequest({
        ...validPetData,
        weight: -5,
      });
      const res = await postHandler(req);

      expect(res.status).toBe(400);
      expect(prisma.careRecipient.create).not.toHaveBeenCalled();
    });

    it('returns 400 when birthDate is in the future', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.upsert as jest.Mock).mockResolvedValue(mockUser);

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const req = createRequest({
        ...validPetData,
        birthDate: futureDate.toISOString().split('T')[0],
      });
      const res = await postHandler(req);

      expect(res.status).toBe(400);
      expect(prisma.careRecipient.create).not.toHaveBeenCalled();
    });

    it('returns 400 when subtype is invalid', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'user@example.com' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'user@example.com' },
      });
      (prisma.user.upsert as jest.Mock).mockResolvedValue(mockUser);

      const req = createRequest({
        ...validPetData,
        subtype: 'INVALID_TYPE',
      });
      const res = await postHandler(req);

      expect(res.status).toBe(400);
      expect(prisma.careRecipient.create).not.toHaveBeenCalled();
    });
  });
});
