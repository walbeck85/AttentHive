// src/__tests__/api/care-recipients-id-route.test.ts

import { PATCH } from '../../app/api/care-recipients/[id]/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// Typed spy so we keep strong typing around our console interception.
type ConsoleLogSpy = jest.SpyInstance<void, [message?: unknown, ...optionalParams: unknown[]]>

let consoleLogSpy: ConsoleLogSpy

beforeAll(() => {
  // Mute console.log in this suite so the negative-weight validation test
  // doesn't spam the Jest output. The route code still logs in real usage;
  // we are only silencing it for this spec file.
  consoleLogSpy = jest
    .spyOn(console, 'log')
    .mockImplementation(() => {
      // Intentionally empty: swallowing logs keeps test output readable.
    })
})

afterAll(() => {
  // Restore the original console.log implementation once this suite finishes
  // so other tests can continue to use logging normally.
  consoleLogSpy.mockRestore()
})

// Narrowed handler type for testing so we don't have to satisfy Next's
// full NextRequest/RouteHandlerConfig types here. The real handler only
// uses `request.json()` and `context.params.id`, so a standard Request
// and a simple context object are enough for our purposes.
type PatchHandler = (
  request: Request,
  context: { params: { id: string } }
) => Promise<Response>

// Cast the imported PATCH handler into the simpler testing-friendly type.
// This keeps tests readable while still exercising the real implementation.
const patchHandler = PATCH as unknown as PatchHandler

// Provide a manual mock for next-auth so Jest never tries to load the real ESM stack.
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Minimal authOptions mock – the route just needs a value to pass into getServerSession.
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

// Prisma client mock so no real DB calls are made in tests.
// Note: the route uses `user.upsert` (not `findUnique`) via the shared helper,
// so we expose that here.
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      upsert: jest.fn(),
    },
    careRecipient: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

type JsonBody = Record<string, unknown>

// Helper to create a Request-like object with a json() method.
// The handler only calls `await request.json()`, so we can keep this lightweight.
const createRequest = (body: JsonBody): Request =>
  ({
    json: async () => body,
  } as unknown as Request)

beforeEach(() => {
  // Clear mocks between tests so each case starts from a clean slate.
  jest.clearAllMocks()
})

describe('PATCH /api/care-recipients/[id]', () => {
  it('returns 200 and the updated pet for a successful update', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'user@example.com' },
    })
    ;(prisma.user.upsert as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
      id: 'pet-1',
      ownerId: 'user-1',
    })
    ;(prisma.careRecipient.update as jest.Mock).mockResolvedValue({
      id: 'pet-1',
      name: 'Updated Name',
      careLogs: [],
    })

    const req = createRequest({ name: 'Updated Name' })
    const context = { params: { id: 'pet-1' } }
    const res = await patchHandler(req, context)

    expect(res.status).toBe(200)
    const json = (await res.json()) as { pet: { name: string } }
    expect(json.pet.name).toBe('Updated Name')
  })

  it('returns 401 when the user is unauthenticated', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const req = createRequest({ name: 'Updated Name' })
    const context = { params: { id: 'pet-1' } }
    const res = await patchHandler(req, context)

    expect(res.status).toBe(401)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('Not authenticated')
  })

  it('returns 403 when a non-owner attempts to update the pet', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'user2@example.com' },
    })
    ;(prisma.user.upsert as jest.Mock).mockResolvedValue({ id: 'user-2' })
    ;(prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
      id: 'pet-1',
      ownerId: 'user-1',
    })

    const req = createRequest({ name: 'Updated Name' })
    const context = { params: { id: 'pet-1' } }
    const res = await patchHandler(req, context)

    expect(res.status).toBe(403)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('You do not have permission to update this pet')
  })

  it('returns 400 when weight is negative', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'user@example.com' },
    })
    ;(prisma.user.upsert as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
      id: 'pet-1',
      ownerId: 'user-1',
    })

    const req = createRequest({ weight: -5 })
    const context = { params: { id: 'pet-1' } }
    const res = await patchHandler(req, context)

    expect(res.status).toBe(400)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('Weight must be a positive number')
  })

  it('returns 400 when no fields are provided', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'user@example.com' },
    })
    ;(prisma.user.upsert as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
      id: 'pet-1',
      ownerId: 'user-1',
    })

    const req = createRequest({})
    const context = { params: { id: 'pet-1' } }
    const res = await patchHandler(req, context)

    expect(res.status).toBe(400)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('No fields provided to update')
  })

  it('returns 404 when the pet is not found', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'user@example.com' },
    })
    ;(prisma.user.upsert as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue(null)

    const req = createRequest({ name: 'Updated Name' })
    const context = { params: { id: 'pet-1' } }
    const res = await patchHandler(req, context)

    expect(res.status).toBe(404)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('Pet not found')
  })

  // -- Hive role authorization ------------------------------------------------

  it('returns 403 when a CAREGIVER hive member attempts to update', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'caregiver@example.com' },
    })
    ;(prisma.user.upsert as jest.Mock).mockResolvedValue({ id: 'user-caregiver' })
    ;(prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
      id: 'pet-1',
      ownerId: 'user-owner',
      hives: [{ userId: 'user-caregiver', role: 'CAREGIVER' }],
    })

    const req = createRequest({ name: 'Caregiver Update' })
    const context = { params: { id: 'pet-1' } }
    const res = await patchHandler(req, context)

    expect(res.status).toBe(403)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('You do not have permission to update this pet')
  })

  it('returns 403 when a VIEWER hive member attempts to update', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'viewer@example.com' },
    })
    ;(prisma.user.upsert as jest.Mock).mockResolvedValue({ id: 'user-viewer' })
    ;(prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
      id: 'pet-1',
      ownerId: 'user-owner',
      hives: [{ userId: 'user-viewer', role: 'VIEWER' }],
    })

    const req = createRequest({ name: 'Viewer Update' })
    const context = { params: { id: 'pet-1' } }
    const res = await patchHandler(req, context)

    expect(res.status).toBe(403)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('You do not have permission to update this pet')
  })

  it('returns 200 when a co-owner (OWNER role in hive) updates', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'coowner@example.com' },
    })
    ;(prisma.user.upsert as jest.Mock).mockResolvedValue({ id: 'user-coowner' })
    ;(prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
      id: 'pet-1',
      ownerId: 'user-primary-owner',
      hives: [{ userId: 'user-coowner', role: 'OWNER' }],
    })
    ;(prisma.careRecipient.update as jest.Mock).mockResolvedValue({
      id: 'pet-1',
      name: 'Co-owner Update',
      careLogs: [],
    })

    const req = createRequest({ name: 'Co-owner Update' })
    const context = { params: { id: 'pet-1' } }
    const res = await patchHandler(req, context)

    expect(res.status).toBe(200)
    const json = (await res.json()) as { pet: { name: string } }
    expect(json.pet.name).toBe('Co-owner Update')
  })

  // -- Plant/Person PATCH tests -----------------------------------------------

  it('updates name on a PLANT recipient', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'user@example.com' },
    })
    ;(prisma.user.upsert as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
      id: 'plant-1',
      ownerId: 'user-1',
      category: 'PLANT',
    })
    ;(prisma.careRecipient.update as jest.Mock).mockResolvedValue({
      id: 'plant-1',
      name: 'My Fern',
      category: 'PLANT',
      careLogs: [],
    })

    const req = createRequest({ name: 'My Fern' })
    const context = { params: { id: 'plant-1' } }
    const res = await patchHandler(req, context)

    expect(res.status).toBe(200)
    const json = (await res.json()) as { pet: { name: string } }
    expect(json.pet.name).toBe('My Fern')
  })

  it('updates name on a PERSON recipient', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'user@example.com' },
    })
    ;(prisma.user.upsert as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(prisma.careRecipient.findUnique as jest.Mock).mockResolvedValue({
      id: 'person-1',
      ownerId: 'user-1',
      category: 'PERSON',
    })
    ;(prisma.careRecipient.update as jest.Mock).mockResolvedValue({
      id: 'person-1',
      name: 'Grandma Rose',
      category: 'PERSON',
      careLogs: [],
    })

    const req = createRequest({ name: 'Grandma Rose' })
    const context = { params: { id: 'person-1' } }
    const res = await patchHandler(req, context)

    expect(res.status).toBe(200)
    const json = (await res.json()) as { pet: { name: string } }
    expect(json.pet.name).toBe('Grandma Rose')
  })
})