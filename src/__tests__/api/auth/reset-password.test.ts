import { POST } from '../../../app/api/auth/reset-password/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createMockUser } from '../../utils/test-factories';

// Typed spies for console suppression
type ConsoleSpy = jest.SpyInstance<void, [message?: unknown, ...optionalParams: unknown[]]>;

let consoleErrorSpy: ConsoleSpy;

beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
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

describe('POST /api/auth/reset-password', () => {
  const validToken = 'a'.repeat(64);

  it('rejects missing token', async () => {
    const response = await postHandler(createRequest({ password: 'newpassword123' }));

    expect(response.status).toBe(400);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('rejects missing password', async () => {
    const response = await postHandler(createRequest({ token: validToken }));

    expect(response.status).toBe(400);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('rejects password shorter than 8 characters', async () => {
    const response = await postHandler(createRequest({ token: validToken, password: 'short' }));

    expect(response.status).toBe(400);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('rejects invalid token', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    const response = await postHandler(
      createRequest({ token: 'invalid-token', password: 'newpassword123' })
    );

    expect(response.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects expired token', async () => {
    // findFirst returns null when token is expired (due to gt: new Date() condition)
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    const response = await postHandler(
      createRequest({ token: validToken, password: 'newpassword123' })
    );

    expect(response.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();

    // Verify the query includes expiry check
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        resetToken: validToken,
        resetTokenExpiry: {
          gt: expect.any(Date),
        },
      },
    });
  });

  it('successfully resets password with valid token', async () => {
    const mockUser = createMockUser({
      id: 'user-123',
      resetToken: validToken,
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    });
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password');

    const response = await postHandler(
      createRequest({ token: validToken, password: 'newpassword123' })
    );

    expect(response.status).toBe(200);
    expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('clears token after successful reset', async () => {
    const mockUser = createMockUser({
      id: 'user-123',
      resetToken: validToken,
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
    });
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password');

    await postHandler(createRequest({ token: validToken, password: 'newpassword123' }));

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: {
        passwordHash: 'hashed-new-password',
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
  });

  it('token cannot be reused after successful reset', async () => {
    const mockUser = createMockUser({
      id: 'user-123',
      resetToken: validToken,
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
    });

    // First call: token is valid
    (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

    const firstResponse = await postHandler(
      createRequest({ token: validToken, password: 'newpassword123' })
    );
    expect(firstResponse.status).toBe(200);

    // Second call: token has been cleared (simulated by returning null)
    (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null);

    const secondResponse = await postHandler(
      createRequest({ token: validToken, password: 'anotherpassword123' })
    );

    expect(secondResponse.status).toBe(400);
  });

  it('accepts exactly 8 character password', async () => {
    const mockUser = createMockUser({
      id: 'user-123',
      resetToken: validToken,
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
    });
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

    const response = await postHandler(
      createRequest({ token: validToken, password: '12345678' })
    );

    expect(response.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalled();
  });
});
