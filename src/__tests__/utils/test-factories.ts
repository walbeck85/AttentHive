import type {
  User,
  Recipient,
  CareLog,
  Hive,
  ActivityType,
  HiveRole,
  Gender,
  PetType,
} from '@prisma/client';

let idCounter = 0;

function generateId(): string {
  idCounter += 1;
  return `test-id-${idCounter}`;
}

export function createMockUser(overrides?: Partial<User>): User {
  const now = new Date();
  return {
    id: generateId(),
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    passwordHash: 'hashed-password',
    createdAt: now,
    updatedAt: now,
    address: null,
    phone: null,
    resetToken: null,
    resetTokenExpiry: null,
    ...overrides,
  };
}

export function createMockRecipient(overrides?: Partial<Recipient>): Recipient {
  const now = new Date();
  return {
    id: generateId(),
    name: 'Test Pet',
    type: 'DOG' as PetType,
    breed: 'Labrador',
    birthDate: new Date('2020-01-01'),
    weight: 25.5,
    specialNeeds: null,
    description: null,
    specialNotes: null,
    characteristics: [],
    ownerId: generateId(),
    createdAt: now,
    updatedAt: now,
    gender: 'MALE' as Gender,
    imageUrl: null,
    ...overrides,
  };
}

export function createMockCareLog(overrides?: Partial<CareLog>): CareLog {
  const now = new Date();
  return {
    id: generateId(),
    recipientId: generateId(),
    userId: generateId(),
    activityType: 'FEED' as ActivityType,
    notes: null,
    metadata: null,
    createdAt: now,
    ...overrides,
  };
}

export function createMockHive(overrides?: Partial<Hive>): Hive {
  const now = new Date();
  return {
    id: generateId(),
    recipientId: generateId(),
    userId: generateId(),
    role: 'CAREGIVER' as HiveRole,
    grantedAt: now,
    ...overrides,
  };
}

export function resetFactoryIds(): void {
  idCounter = 0;
}
