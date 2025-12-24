// src/app/api/hives/invite/__tests__/roles.test.ts
import { POST } from '../route';
import { getServerSession } from 'next-auth';
import { inviteMemberToPet } from '@/lib/hive';

// Suppress console.error for cleaner test output
let consoleErrorSpy: jest.SpyInstance;

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

type PostHandler = (request: Request) => Promise<Response>;
const postHandler = POST as unknown as PostHandler;

const createInviteRequest = (body: {
  recipientId: string;
  email: string;
  role?: 'OWNER' | 'CAREGIVER';
}): Request =>
  ({
    json: async () => body,
  }) as unknown as Request;

describe('POST /api/hives/invite - Role-based Invites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful invites', () => {
    it('invites with OWNER role successfully', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (inviteMemberToPet as jest.Mock).mockResolvedValue({
        id: 'membership-1',
        recipientId: 'pet-1',
        userId: 'invitee',
        role: 'OWNER',
      });

      const req = createInviteRequest({
        recipientId: 'pet-1',
        email: 'invitee@example.com',
        role: 'OWNER',
      });
      const res = await postHandler(req);

      expect(res.status).toBe(201);
      expect(inviteMemberToPet).toHaveBeenCalledWith('pet-1', 'invitee@example.com', 'OWNER');
    });

    it('invites with CAREGIVER role successfully', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (inviteMemberToPet as jest.Mock).mockResolvedValue({
        id: 'membership-1',
        recipientId: 'pet-1',
        userId: 'invitee',
        role: 'CAREGIVER',
      });

      const req = createInviteRequest({
        recipientId: 'pet-1',
        email: 'invitee@example.com',
        role: 'CAREGIVER',
      });
      const res = await postHandler(req);

      expect(res.status).toBe(201);
      expect(inviteMemberToPet).toHaveBeenCalledWith('pet-1', 'invitee@example.com', 'CAREGIVER');
    });

    it('defaults to CAREGIVER role when role is not specified', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (inviteMemberToPet as jest.Mock).mockResolvedValue({
        id: 'membership-1',
        recipientId: 'pet-1',
        userId: 'invitee',
        role: 'CAREGIVER',
      });

      const req = createInviteRequest({
        recipientId: 'pet-1',
        email: 'invitee@example.com',
        // No role specified
      });
      const res = await postHandler(req);

      expect(res.status).toBe(201);
      expect(inviteMemberToPet).toHaveBeenCalledWith('pet-1', 'invitee@example.com', 'CAREGIVER');
    });
  });

  describe('Permission errors from hive lib', () => {
    it('returns 500 when co-owner tries to invite OWNER role', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'coowner@example.com' },
      });
      (inviteMemberToPet as jest.Mock).mockRejectedValue(
        new Error('Only the primary owner can invite co-owners')
      );

      const req = createInviteRequest({
        recipientId: 'pet-1',
        email: 'invitee@example.com',
        role: 'OWNER',
      });
      const res = await postHandler(req);

      expect(res.status).toBe(500);
      expect(inviteMemberToPet).toHaveBeenCalledWith('pet-1', 'invitee@example.com', 'OWNER');
    });

    it('returns 500 when caregiver tries to invite', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'caregiver@example.com' },
      });
      (inviteMemberToPet as jest.Mock).mockRejectedValue(
        new Error('Not authorized to share this pet')
      );

      const req = createInviteRequest({
        recipientId: 'pet-1',
        email: 'invitee@example.com',
        role: 'CAREGIVER',
      });
      const res = await postHandler(req);

      expect(res.status).toBe(500);
    });

    it('returns 500 when trying to invite yourself', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (inviteMemberToPet as jest.Mock).mockRejectedValue(
        new Error('You cannot invite yourself')
      );

      const req = createInviteRequest({
        recipientId: 'pet-1',
        email: 'owner@example.com',
        role: 'CAREGIVER',
      });
      const res = await postHandler(req);

      expect(res.status).toBe(500);
    });

    it('returns 500 when trying to invite the primary owner', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'coowner@example.com' },
      });
      (inviteMemberToPet as jest.Mock).mockRejectedValue(
        new Error('This user is already the primary owner')
      );

      const req = createInviteRequest({
        recipientId: 'pet-1',
        email: 'primaryowner@example.com',
        role: 'CAREGIVER',
      });
      const res = await postHandler(req);

      expect(res.status).toBe(500);
    });
  });

  describe('Authentication and validation', () => {
    it('returns 401 when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const req = createInviteRequest({
        recipientId: 'pet-1',
        email: 'invitee@example.com',
      });
      const res = await postHandler(req);

      expect(res.status).toBe(401);
    });

    it('returns 400 for missing recipientId', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });

      const req = {
        json: async () => ({ recipientId: '', email: 'invitee@example.com' }),
      } as unknown as Request;
      const res = await postHandler(req);

      expect(res.status).toBe(400);
      expect(inviteMemberToPet).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid email format', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });

      const req = {
        json: async () => ({ recipientId: 'pet-1', email: 'not-an-email' }),
      } as unknown as Request;
      const res = await postHandler(req);

      expect(res.status).toBe(400);
      expect(inviteMemberToPet).not.toHaveBeenCalled();
    });
  });
});
