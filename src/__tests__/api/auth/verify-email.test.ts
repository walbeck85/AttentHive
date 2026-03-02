import { POST } from '../../../app/api/auth/verify-email/route';
import { prisma } from '@/lib/prisma';
import { createMockUser } from '../../utils/test-factories';

type ConsoleSpy = jest.SpyInstance<void, [message?: unknown, ...optionalParams: unknown[]]>;

let consoleErrorSpy: ConsoleSpy;
let consoleWarnSpy: ConsoleSpy;

beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
  consoleWarnSpy.mockRestore();
});

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

type PostHandler = (request: Request) => Promise<Response>;
const postHandler = POST as unknown as PostHandler;

type JsonBody = Record<string, unknown>;

const createRequest = (body: JsonBody): Request =>
  ({
    json: async () => body,
  }) as unknown as Request;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/auth/verify-email', () => {
  it('verifies a valid token and marks user as verified', async () => {
    const mockUser = createMockUser({
      id: 'user-1',
      emailVerified: false,
      emailVerifyToken: 'valid-token',
      emailVerifyExpires: new Date(Date.now() + 60 * 60 * 1000),
    });
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue({
      ...mockUser,
      emailVerified: true,
    });

    const res = await postHandler(createRequest({ token: 'valid-token' }));

    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });
  });

  it('returns 400 for expired token', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await postHandler(createRequest({ token: 'expired-token' }));

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid token', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await postHandler(createRequest({ token: 'nonexistent-token' }));

    expect(res.status).toBe(400);
  });

  it('returns 400 when token is missing', async () => {
    const res = await postHandler(createRequest({}));

    expect(res.status).toBe(400);
  });

  it('returns 400 when token is not a string', async () => {
    const res = await postHandler(createRequest({ token: 123 }));

    expect(res.status).toBe(400);
  });

  it('clears token fields after successful verification', async () => {
    const mockUser = createMockUser({
      id: 'user-2',
      emailVerifyToken: 'abc123',
      emailVerifyExpires: new Date(Date.now() + 60 * 60 * 1000),
    });
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

    await postHandler(createRequest({ token: 'abc123' }));

    const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.emailVerifyToken).toBeNull();
    expect(updateCall.data.emailVerifyExpires).toBeNull();
  });
});
