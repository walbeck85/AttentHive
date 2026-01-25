import { NextRequest } from 'next/server';
import { PATCH, DELETE } from '../../../app/api/care-logs/[id]/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { canWriteToRecipient } from '@/lib/auth-helpers';
import { createMockUser, createMockCareLog } from '../../utils/test-factories';

// Typed spy for console suppression
type ConsoleErrorSpy = jest.SpyInstance<void, [message?: unknown, ...optionalParams: unknown[]]>;

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

jest.mock('@/lib/auth-helpers', () => ({
  canWriteToRecipient: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    careLog: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

type RouteContext = { params: Promise<{ id: string }> };

const createPatchRequest = (body: Record<string, unknown>): NextRequest =>
  ({
    json: async () => body,
  }) as unknown as NextRequest;

const createDeleteRequest = (): NextRequest =>
  ({}) as unknown as NextRequest;

const createContext = (id: string): RouteContext => ({
  params: Promise.resolve({ id }),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PATCH /api/care-logs/[id]', () => {
  describe('Success cases', () => {
    it('updates notes and sets editedAt timestamp', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'owner@example.com' });
      const mockCareLog = createMockCareLog({
        id: 'log-1',
        recipientId: 'pet-1',
        userId: 'user-1',
        notes: 'Original notes',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.careLog.findUnique as jest.Mock).mockResolvedValue(mockCareLog);
      (canWriteToRecipient as jest.Mock).mockResolvedValue(true);
      (prisma.careLog.update as jest.Mock).mockResolvedValue({
        ...mockCareLog,
        notes: 'Updated notes',
        editedAt: new Date(),
        user: { id: 'user-1', name: 'Test User' },
      });

      const req = createPatchRequest({ notes: 'Updated notes' });
      const ctx = createContext('log-1');

      const res = await PATCH(req, ctx);

      expect(res.status).toBe(200);
      expect(prisma.careLog.update).toHaveBeenCalledWith({
        where: { id: 'log-1' },
        data: expect.objectContaining({
          notes: 'Updated notes',
          editedAt: expect.any(Date),
        }),
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    it('updates photoUrl and sets editedAt timestamp', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'owner@example.com' });
      const mockCareLog = createMockCareLog({
        id: 'log-1',
        recipientId: 'pet-1',
        userId: 'user-1',
        photoUrl: null,
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.careLog.findUnique as jest.Mock).mockResolvedValue(mockCareLog);
      (canWriteToRecipient as jest.Mock).mockResolvedValue(true);
      (prisma.careLog.update as jest.Mock).mockResolvedValue({
        ...mockCareLog,
        photoUrl: 'https://example.com/photo.jpg',
        editedAt: new Date(),
        user: { id: 'user-1', name: 'Test User' },
      });

      const req = createPatchRequest({ photoUrl: 'https://example.com/photo.jpg' });
      const ctx = createContext('log-1');

      const res = await PATCH(req, ctx);

      expect(res.status).toBe(200);
      expect(prisma.careLog.update).toHaveBeenCalledWith({
        where: { id: 'log-1' },
        data: expect.objectContaining({
          photoUrl: 'https://example.com/photo.jpg',
          editedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
    });

    it('removes photoUrl by setting it to null', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'owner@example.com' });
      const mockCareLog = createMockCareLog({
        id: 'log-1',
        recipientId: 'pet-1',
        userId: 'user-1',
        photoUrl: 'https://example.com/old-photo.jpg',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.careLog.findUnique as jest.Mock).mockResolvedValue(mockCareLog);
      (canWriteToRecipient as jest.Mock).mockResolvedValue(true);
      (prisma.careLog.update as jest.Mock).mockResolvedValue({
        ...mockCareLog,
        photoUrl: null,
        editedAt: new Date(),
        user: { id: 'user-1', name: 'Test User' },
      });

      const req = createPatchRequest({ photoUrl: null });
      const ctx = createContext('log-1');

      const res = await PATCH(req, ctx);

      expect(res.status).toBe(200);
      expect(prisma.careLog.update).toHaveBeenCalledWith({
        where: { id: 'log-1' },
        data: expect.objectContaining({
          photoUrl: null,
          editedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
    });

    it('updates both notes and photoUrl together', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'owner@example.com' });
      const mockCareLog = createMockCareLog({
        id: 'log-1',
        recipientId: 'pet-1',
        userId: 'user-1',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.careLog.findUnique as jest.Mock).mockResolvedValue(mockCareLog);
      (canWriteToRecipient as jest.Mock).mockResolvedValue(true);
      (prisma.careLog.update as jest.Mock).mockResolvedValue({
        ...mockCareLog,
        notes: 'New notes',
        photoUrl: 'https://example.com/new-photo.jpg',
        editedAt: new Date(),
        user: { id: 'user-1', name: 'Test User' },
      });

      const req = createPatchRequest({
        notes: 'New notes',
        photoUrl: 'https://example.com/new-photo.jpg',
      });
      const ctx = createContext('log-1');

      const res = await PATCH(req, ctx);

      expect(res.status).toBe(200);
      expect(prisma.careLog.update).toHaveBeenCalledWith({
        where: { id: 'log-1' },
        data: expect.objectContaining({
          notes: 'New notes',
          photoUrl: 'https://example.com/new-photo.jpg',
          editedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('Error cases', () => {
    it('returns 401 when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = createPatchRequest({ notes: 'Updated notes' });
      const ctx = createContext('log-1');

      const res = await PATCH(req, ctx);

      expect(res.status).toBe(401);
      expect(prisma.careLog.update).not.toHaveBeenCalled();
    });

    it('returns 404 when care log does not exist', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'owner@example.com' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.careLog.findUnique as jest.Mock).mockResolvedValue(null);

      const req = createPatchRequest({ notes: 'Updated notes' });
      const ctx = createContext('nonexistent-log');

      const res = await PATCH(req, ctx);

      expect(res.status).toBe(404);
      expect(prisma.careLog.update).not.toHaveBeenCalled();
    });

    it('returns 404 when user does not have write access', async () => {
      const mockUser = createMockUser({ id: 'user-2', email: 'stranger@example.com' });
      const mockCareLog = createMockCareLog({
        id: 'log-1',
        recipientId: 'pet-1',
        userId: 'user-1',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'stranger@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.careLog.findUnique as jest.Mock).mockResolvedValue(mockCareLog);
      (canWriteToRecipient as jest.Mock).mockResolvedValue(false);

      const req = createPatchRequest({ notes: 'Updated notes' });
      const ctx = createContext('log-1');

      const res = await PATCH(req, ctx);

      expect(res.status).toBe(404);
      expect(prisma.careLog.update).not.toHaveBeenCalled();
    });

    it('returns 400 when no fields to update', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'owner@example.com' });
      const mockCareLog = createMockCareLog({
        id: 'log-1',
        recipientId: 'pet-1',
        userId: 'user-1',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.careLog.findUnique as jest.Mock).mockResolvedValue(mockCareLog);
      (canWriteToRecipient as jest.Mock).mockResolvedValue(true);

      const req = createPatchRequest({});
      const ctx = createContext('log-1');

      const res = await PATCH(req, ctx);

      expect(res.status).toBe(400);
      expect(prisma.careLog.update).not.toHaveBeenCalled();
    });
  });
});

describe('DELETE /api/care-logs/[id]', () => {
  describe('Success cases', () => {
    it('deletes care log when user has write access', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'owner@example.com' });
      const mockCareLog = createMockCareLog({
        id: 'log-1',
        recipientId: 'pet-1',
        userId: 'user-1',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.careLog.findUnique as jest.Mock).mockResolvedValue(mockCareLog);
      (canWriteToRecipient as jest.Mock).mockResolvedValue(true);
      (prisma.careLog.delete as jest.Mock).mockResolvedValue(mockCareLog);

      const req = createDeleteRequest();
      const ctx = createContext('log-1');

      const res = await DELETE(req, ctx);

      expect(res.status).toBe(200);
      expect(prisma.careLog.delete).toHaveBeenCalledWith({
        where: { id: 'log-1' },
      });
    });
  });

  describe('Error cases', () => {
    it('returns 401 when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = createDeleteRequest();
      const ctx = createContext('log-1');

      const res = await DELETE(req, ctx);

      expect(res.status).toBe(401);
      expect(prisma.careLog.delete).not.toHaveBeenCalled();
    });

    it('returns 404 when care log does not exist', async () => {
      const mockUser = createMockUser({ id: 'user-1', email: 'owner@example.com' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.careLog.findUnique as jest.Mock).mockResolvedValue(null);

      const req = createDeleteRequest();
      const ctx = createContext('nonexistent-log');

      const res = await DELETE(req, ctx);

      expect(res.status).toBe(404);
      expect(prisma.careLog.delete).not.toHaveBeenCalled();
    });

    it('returns 404 when user does not have write access', async () => {
      const mockUser = createMockUser({ id: 'user-2', email: 'stranger@example.com' });
      const mockCareLog = createMockCareLog({
        id: 'log-1',
        recipientId: 'pet-1',
        userId: 'user-1',
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'stranger@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.careLog.findUnique as jest.Mock).mockResolvedValue(mockCareLog);
      (canWriteToRecipient as jest.Mock).mockResolvedValue(false);

      const req = createDeleteRequest();
      const ctx = createContext('log-1');

      const res = await DELETE(req, ctx);

      expect(res.status).toBe(404);
      expect(prisma.careLog.delete).not.toHaveBeenCalled();
    });
  });
});
