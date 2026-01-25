import { POST } from '../route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { createMockUser, createMockCareRecipient } from '@/__tests__/utils/test-factories';

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
    },
    careRecipient: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock Supabase - we don't need actual uploads for security tests
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => ({ data: { path: 'test/path.jpg' }, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/test.jpg' } })),
      })),
    },
  })),
}));

// Handler type for testing
type PostHandler = (
  request: Request,
  context: { params: Promise<{ id: string }> }
) => Promise<Response>;

const postHandler = POST as unknown as PostHandler;

// Valid JPEG magic bytes
const VALID_JPEG_BYTES = new Uint8Array([
  0xFF, 0xD8, 0xFF, 0xE0, // JPEG SOI + APP0
  0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, // JFIF header
]);

// Valid PNG magic bytes
const VALID_PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
]);

// Valid WebP magic bytes
const VALID_WEBP_BYTES = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, // RIFF
  0x00, 0x00, 0x00, 0x00, // file size (placeholder)
  0x57, 0x45, 0x42, 0x50, // WEBP
]);

// Create a mock File-like object for testing
// Note: We use Object.create(File.prototype) to pass instanceof checks
function createMockFile(
  content: Uint8Array | string,
  filename: string,
  mimeType: string
): File {
  const bytes = typeof content === 'string'
    ? new TextEncoder().encode(content)
    : content;

  // Create an object that passes instanceof File
  const mockFile = Object.create(File.prototype);

  // Define properties that match File interface
  Object.defineProperties(mockFile, {
    name: { value: filename, writable: false },
    type: { value: mimeType, writable: false },
    size: { value: bytes.length, writable: false },
    arrayBuffer: {
      value: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      writable: false,
    },
  });

  return mockFile as File;
}

// Create a mock request with formData that returns the mock file
function createMockRequest(
  file: File | null,
  petId: string = 'pet-1'
): { request: Request; context: { params: Promise<{ id: string }> } } {
  const mockFormData = {
    get: (key: string) => (key === 'file' ? file : null),
  };

  const request = {
    formData: async () => mockFormData,
    url: `http://localhost/api/pets/${petId}/photo`,
  } as unknown as Request;

  return {
    request,
    context: { params: Promise.resolve({ id: petId }) },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Set env vars for Supabase
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
});

describe('POST /api/pets/[id]/photo - Security', () => {
  describe('MIME Spoofing Prevention', () => {
    it('rejects text file claiming to be image/jpeg', async () => {
      const owner = createMockUser({ id: 'owner-1', email: 'owner@example.com' });
      const pet = createMockCareRecipient({ id: 'pet-1', ownerId: 'owner-1' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(owner);
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({ ...pet, hives: [] });

      // Create a text file but claim it's image/jpeg
      const maliciousContent = '<script>alert("xss")</script>';
      const spoofedFile = createMockFile(maliciousContent, 'malicious.jpg', 'image/jpeg');

      const { request, context } = createMockRequest(spoofedFile);
      const res = await postHandler(request, context);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Invalid file content');
    });

    it('rejects HTML file claiming to be image/png', async () => {
      const owner = createMockUser({ id: 'owner-1', email: 'owner@example.com' });
      const pet = createMockCareRecipient({ id: 'pet-1', ownerId: 'owner-1' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(owner);
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({ ...pet, hives: [] });

      // Create HTML file but claim it's image/png
      const htmlContent = '<!DOCTYPE html><html><body>Malicious</body></html>';
      const spoofedFile = createMockFile(htmlContent, 'page.png', 'image/png');

      const { request, context } = createMockRequest(spoofedFile);
      const res = await postHandler(request, context);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Invalid file content');
    });

    it('rejects SVG file claiming to be image/webp', async () => {
      const owner = createMockUser({ id: 'owner-1', email: 'owner@example.com' });
      const pet = createMockCareRecipient({ id: 'pet-1', ownerId: 'owner-1' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(owner);
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({ ...pet, hives: [] });

      // SVG can contain JavaScript and is dangerous
      const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
      const spoofedFile = createMockFile(svgContent, 'image.webp', 'image/webp');

      const { request, context } = createMockRequest(spoofedFile);
      const res = await postHandler(request, context);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Invalid file content');
    });

    it('rejects file with too few bytes to detect type', async () => {
      const owner = createMockUser({ id: 'owner-1', email: 'owner@example.com' });
      const pet = createMockCareRecipient({ id: 'pet-1', ownerId: 'owner-1' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(owner);
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({ ...pet, hives: [] });

      // File too small to have valid magic bytes
      const tinyContent = new Uint8Array([0x00, 0x01, 0x02]);
      const tinyFile = createMockFile(tinyContent, 'tiny.jpg', 'image/jpeg');

      const { request, context } = createMockRequest(tinyFile);
      const res = await postHandler(request, context);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Invalid file content');
    });
  });

  describe('Valid Image Acceptance', () => {
    it('accepts file with valid JPEG magic bytes', async () => {
      const owner = createMockUser({ id: 'owner-1', email: 'owner@example.com' });
      const pet = createMockCareRecipient({ id: 'pet-1', ownerId: 'owner-1' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(owner);
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({ ...pet, hives: [] });
      (prisma.careRecipient.update as jest.Mock).mockResolvedValue({
        ...pet,
        imageUrl: 'https://example.com/test.jpg',
      });

      const validFile = createMockFile(VALID_JPEG_BYTES, 'photo.jpg', 'image/jpeg');

      const { request, context } = createMockRequest(validFile);
      const res = await postHandler(request, context);

      expect(res.status).toBe(200);
    });

    it('accepts file with valid PNG magic bytes', async () => {
      const owner = createMockUser({ id: 'owner-1', email: 'owner@example.com' });
      const pet = createMockCareRecipient({ id: 'pet-1', ownerId: 'owner-1' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(owner);
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({ ...pet, hives: [] });
      (prisma.careRecipient.update as jest.Mock).mockResolvedValue({
        ...pet,
        imageUrl: 'https://example.com/test.png',
      });

      const validFile = createMockFile(VALID_PNG_BYTES, 'photo.png', 'image/png');

      const { request, context } = createMockRequest(validFile);
      const res = await postHandler(request, context);

      expect(res.status).toBe(200);
    });

    it('accepts file with valid WebP magic bytes', async () => {
      const owner = createMockUser({ id: 'owner-1', email: 'owner@example.com' });
      const pet = createMockCareRecipient({ id: 'pet-1', ownerId: 'owner-1' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'owner@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(owner);
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({ ...pet, hives: [] });
      (prisma.careRecipient.update as jest.Mock).mockResolvedValue({
        ...pet,
        imageUrl: 'https://example.com/test.webp',
      });

      const validFile = createMockFile(VALID_WEBP_BYTES, 'photo.webp', 'image/webp');

      const { request, context } = createMockRequest(validFile);
      const res = await postHandler(request, context);

      expect(res.status).toBe(200);
    });
  });

  describe('Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const validFile = createMockFile(VALID_JPEG_BYTES, 'photo.jpg', 'image/jpeg');
      const { request, context } = createMockRequest(validFile);
      const res = await postHandler(request, context);

      expect(res.status).toBe(401);
    });

    it('returns 404 when user does not own the pet', async () => {
      const notOwner = createMockUser({ id: 'not-owner', email: 'other@example.com' });
      const pet = createMockCareRecipient({ id: 'pet-1', ownerId: 'owner-1' });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'other@example.com' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(notOwner);
      // findUnique returns a pet but user is not owner and has no hive membership
      (prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({ ...pet, hives: [] });

      const validFile = createMockFile(VALID_JPEG_BYTES, 'photo.jpg', 'image/jpeg');
      const { request, context } = createMockRequest(validFile);
      const res = await postHandler(request, context);

      expect(res.status).toBe(404);
    });
  });
});
