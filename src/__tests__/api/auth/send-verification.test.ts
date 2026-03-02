import { POST } from '../../../app/api/auth/send-verification/route';
import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/email';
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

jest.mock('@/lib/email', () => ({
  resend: {
    emails: {
      send: jest.fn(),
    },
  },
  EMAIL_FROM: 'AttentHive <noreply@attenthive.app>',
}));

jest.mock('@/lib/verification-token', () => ({
  generateVerificationToken: jest.fn().mockReturnValue({
    token: 'test-verification-token-hex',
    expires: new Date('2099-01-01'),
  }),
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

describe('POST /api/auth/send-verification', () => {
  it('generates token and sends verification email for valid user', async () => {
    const mockUser = createMockUser({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: false,
    });
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
    (resend!.emails.send as jest.Mock).mockResolvedValue({ id: 'email-id' });

    const res = await postHandler(createRequest({ email: 'test@example.com' }));

    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        emailVerifyToken: 'test-verification-token-hex',
        emailVerifyExpires: new Date('2099-01-01'),
      },
    });
    expect(resend!.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: 'Verify your AttentHive email',
        html: expect.stringContaining('Verify Email'),
      })
    );
  });

  it('returns success for non-existent email (prevents enumeration)', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await postHandler(createRequest({ email: 'nobody@example.com' }));

    expect(res.status).toBe(200);
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(resend!.emails.send).not.toHaveBeenCalled();
  });

  it('returns success without sending email for already verified user', async () => {
    const mockUser = createMockUser({
      email: 'verified@example.com',
      emailVerified: true,
    });
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

    const res = await postHandler(createRequest({ email: 'verified@example.com' }));

    expect(res.status).toBe(200);
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(resend!.emails.send).not.toHaveBeenCalled();
  });

  it('returns 400 when email is missing', async () => {
    const res = await postHandler(createRequest({}));

    expect(res.status).toBe(400);
  });

  it('returns 400 when email is not a string', async () => {
    const res = await postHandler(createRequest({ email: 123 }));

    expect(res.status).toBe(400);
  });
});
