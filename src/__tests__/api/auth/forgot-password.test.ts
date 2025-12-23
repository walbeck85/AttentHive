import { POST } from '../../../app/api/auth/forgot-password/route';
import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/email';
import { createMockUser } from '../../utils/test-factories';

// Typed spies for console suppression
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

jest.mock('@/lib/email', () => ({
  resend: {
    emails: {
      send: jest.fn(),
    },
  },
  EMAIL_FROM: 'AttentHive <noreply@attenthive.app>',
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

describe('POST /api/auth/forgot-password', () => {
  it('returns success for valid email', async () => {
    const mockUser = createMockUser({ email: 'test@example.com' });
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
    (resend!.emails.send as jest.Mock).mockResolvedValue({ id: 'email-id' });

    const response = await postHandler(createRequest({ email: 'test@example.com' }));

    expect(response.status).toBe(200);
    expect(prisma.user.findFirst).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('returns success for non-existent email (prevents enumeration)', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    const response = await postHandler(createRequest({ email: 'nonexistent@example.com' }));

    expect(response.status).toBe(200);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('creates reset token for valid user', async () => {
    const mockUser = createMockUser({ id: 'user-123', email: 'test@example.com' });
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
    (resend!.emails.send as jest.Mock).mockResolvedValue({ id: 'email-id' });

    await postHandler(createRequest({ email: 'test@example.com' }));

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: expect.objectContaining({
        resetToken: expect.any(String),
        resetTokenExpiry: expect.any(Date),
      }),
    });

    // Verify token is 64 characters (32 bytes hex)
    const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.resetToken).toHaveLength(64);

    // Verify expiry is approximately 1 hour from now
    const expiry = updateCall.data.resetTokenExpiry as Date;
    const oneHourFromNow = Date.now() + 60 * 60 * 1000;
    expect(expiry.getTime()).toBeGreaterThan(Date.now());
    expect(expiry.getTime()).toBeLessThanOrEqual(oneHourFromNow + 1000);
  });

  it('sends email via Resend for valid user', async () => {
    const mockUser = createMockUser({
      email: 'test@example.com',
      name: 'Test User',
    });
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
    (resend!.emails.send as jest.Mock).mockResolvedValue({ id: 'email-id' });

    await postHandler(createRequest({ email: 'test@example.com' }));

    expect(resend!.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'AttentHive <noreply@attenthive.app>',
        to: 'test@example.com',
        subject: 'Reset your AttentHive password',
        html: expect.stringContaining('Reset Password'),
      })
    );
  });

  it('does not send reset email for OAuth-only users', async () => {
    const mockUser = createMockUser({
      email: 'oauth@example.com',
      passwordHash: 'google-oauth',
    });
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

    const response = await postHandler(createRequest({ email: 'oauth@example.com' }));

    expect(response.status).toBe(200);
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(resend!.emails.send).not.toHaveBeenCalled();
  });

  it('returns 400 for missing email', async () => {
    const response = await postHandler(createRequest({}));

    expect(response.status).toBe(400);
  });

  it('performs case-insensitive email lookup', async () => {
    const mockUser = createMockUser({ email: 'Test@Example.com' });
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
    (resend!.emails.send as jest.Mock).mockResolvedValue({ id: 'email-id' });

    await postHandler(createRequest({ email: 'TEST@EXAMPLE.COM' }));

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        email: {
          equals: 'TEST@EXAMPLE.COM',
          mode: 'insensitive',
        },
      },
    });
  });
});
