import { POST } from '../../../app/api/hives/invite/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { inviteMemberToPet } from '@/lib/hive';

type ConsoleSpy = jest.SpyInstance<void, [message?: unknown, ...optionalParams: unknown[]]>;

let consoleErrorSpy: ConsoleSpy;

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

jest.mock('@/lib/hive', () => ({
  inviteMemberToPet: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/rate-limit', () => ({
  apiLimiter: {},
  checkRateLimit: jest.fn().mockResolvedValue({ success: true }),
  rateLimitResponse: jest.fn(),
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}));

type PostHandler = (request: Request) => Promise<Response>;
const postHandler = POST as unknown as PostHandler;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/hives/invite - email verification gate', () => {
  it('returns 403 when user email is not verified', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'unverified@example.com' },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      emailVerified: false,
    });

    const req = {
      json: async () => ({
        recipientId: 'pet-1',
        email: 'invitee@example.com',
      }),
    } as unknown as Request;
    const res = await postHandler(req);

    expect(res.status).toBe(403);
  });

  it('allows invite when user email is verified', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'verified@example.com' },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      emailVerified: true,
    });
    (inviteMemberToPet as jest.Mock).mockResolvedValue({
      id: 'membership-1',
      recipientId: 'pet-1',
      userId: 'invitee',
      role: 'CAREGIVER',
    });

    const req = {
      json: async () => ({
        recipientId: 'pet-1',
        email: 'invitee@example.com',
      }),
    } as unknown as Request;
    const res = await postHandler(req);

    expect(res.status).toBe(201);
  });
});
