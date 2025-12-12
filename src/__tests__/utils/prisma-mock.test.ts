import { prismaMock, resetPrismaMock } from './prisma-mock';
import { createMockUser, resetFactoryIds } from './test-factories';

describe('Prisma Mock', () => {
  beforeEach(() => {
    resetPrismaMock();
    resetFactoryIds();
  });

  it('intercepts prisma.user.findUnique and returns mocked data', async () => {
    const mockUser = createMockUser({
      id: 'user-123',
      email: 'mock@example.com',
      name: 'Mock User',
    });

    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const result = await prismaMock.user.findUnique({
      where: { id: 'user-123' },
    });

    expect(result).toEqual(mockUser);
    expect(result?.email).toBe('mock@example.com');
    expect(result?.name).toBe('Mock User');
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-123' },
    });
  });

  it('returns null when no mock is set up', async () => {
    const result = await prismaMock.user.findUnique({
      where: { id: 'nonexistent' },
    });

    expect(result).toBeUndefined();
  });

  it('can mock multiple models', async () => {
    const mockUser = createMockUser({ id: 'user-1' });

    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.recipient.findMany.mockResolvedValue([]);

    const user = await prismaMock.user.findUnique({ where: { id: 'user-1' } });
    const recipients = await prismaMock.recipient.findMany({
      where: { ownerId: 'user-1' },
    });

    expect(user).toEqual(mockUser);
    expect(recipients).toEqual([]);
  });

  it('resets mocks between tests', async () => {
    prismaMock.user.findUnique.mockResolvedValue(createMockUser());

    resetPrismaMock();

    const result = await prismaMock.user.findUnique({ where: { id: 'any' } });
    expect(result).toBeUndefined();
  });
});
