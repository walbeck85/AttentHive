# Testing Infrastructure Punch List

## Context
Setting up proper Prisma mocking and coverage reporting to unblock API route testing and provide confidence in the codebase.

## Current State
- Jest v30.2.0 with Next.js integration ✅
- React Testing Library ✅
- 25 tests passing ✅
- API route tests: placeholder only (blocked by Prisma mocking)
- Coverage reporting: not configured
- Prisma mocks: not set up

---

## PHASE 1: Coverage Reporting Setup

### 1.1 Add coverage scripts to package.json
- [x] Add `"test:coverage": "jest --coverage"`
- [x] Add `"test:watch": "jest --watch"`
- [x] Verify `npm run check` includes test command

### 1.2 Configure Jest coverage settings
- [x] Add coverage configuration to jest.config
- [x] Set collectCoverageFrom to include:
  - `src/app/api/**/*.ts`
  - `src/components/**/*.tsx`
  - `src/lib/**/*.ts`
- [x] Set coverage thresholds (start low, increase over time)

### 1.3 Run baseline coverage
- [x] Run `npm run test:coverage`
- [x] Document current coverage percentages
- [x] Identify files with 0% coverage

**Baseline Coverage (2025-12-12):**
| Metric     | Coverage |
|------------|----------|
| Statements | 13.73%   |
| Branches   | 12.51%   |
| Functions  | 12.27%   |
| Lines      | 13.70%   |

**Files with 0% coverage (API routes):**
- `src/app/api/auth/signup/route.ts`
- `src/app/api/care-circles/invite/route.ts`
- `src/app/api/care-circles/members/route.ts`
- `src/app/api/care-circles/shared-pets/route.ts`
- `src/app/api/care-logs/route.ts`
- `src/app/api/pets/route.ts`
- `src/app/api/pets/[id]/care-logs/route.ts`
- `src/app/api/pets/[id]/photo/route.ts`
- `src/app/api/user/profile/route.ts`

**Claude Code Prompt for Phase 1:**
```
Set up test coverage reporting for AttentHive:

1. Add these scripts to package.json:
   - "test:coverage": "jest --coverage"
   - "test:watch": "jest --watch"

2. Update jest.config.ts (or .js) to add coverage configuration:
   - collectCoverageFrom should include src/app/api/**/*.ts, src/components/**/*.tsx, src/lib/**/*.ts
   - Exclude test files, node_modules, .next, and type declaration files
   - Add coverageReporters: ["text", "lcov", "html"]

3. Run npm run test:coverage and show me the baseline coverage report

Do not modify any existing tests - just add the coverage configuration.
```

---

## PHASE 2: Prisma Mock Setup

### 2.1 Install dependencies
- [x] Install `jest-mock-extended` (or similar)

### 2.2 Create mock infrastructure
- [x] Create `__tests__/utils/prisma-mock.ts`
- [x] Export typed mock Prisma client
- [x] Create reset function for between tests

### 2.3 Create test data factories
- [x] Create `__tests__/utils/test-factories.ts`
- [x] Add `createMockUser()` function
- [x] Add `createMockRecipient()` function
- [x] Add `createMockCareLog()` function

### 2.4 Verify mock works
- [x] Create simple test proving mock intercepts Prisma calls
- [x] Ensure real database is never touched during tests

**Claude Code Prompt for Phase 2:**
```
Set up Prisma mocking for AttentHive tests using jest-mock-extended:

1. Install jest-mock-extended as a dev dependency

2. Create __tests__/utils/prisma-mock.ts that:
   - Imports PrismaClient type from @prisma/client
   - Creates a properly typed mock using mockDeep
   - Exports the mock and a reset function
   - Sets up jest.mock for @/lib/prisma

3. Create __tests__/utils/test-factories.ts with factory functions:
   - createMockUser(overrides?) - returns User object with sensible defaults
   - createMockRecipient(overrides?) - returns Recipient object  
   - createMockCareLog(overrides?) - returns CareLog object
   Use the actual Prisma types so factories stay in sync with schema.

4. Create a simple verification test at __tests__/utils/prisma-mock.test.ts that:
   - Proves the mock intercepts prisma.user.findUnique()
   - Returns mocked data instead of hitting the real DB

Show me all files created and run the verification test.
```

---

## PHASE 3: API Route Test - care-logs

### 3.1 Create care-logs route test file
- [x] Create `__tests__/api/care-logs/route.test.ts`
- [x] Import POST from the actual route
- [x] Set up Prisma mock and session mock

### 3.2 Test success cases
- [x] Test: authenticated user creates care log for owned pet
- [x] Test: authenticated user creates care log via care circle access
- [x] Verify response shape and status codes

### 3.3 Test error cases
- [x] Test: 401 when not authenticated
- [x] Test: 400 when missing required fields (recipientId, activityType)
- [x] Test: 404 when pet doesn't exist (route doesn't check ownership/care circle)

### 3.4 Run and verify
- [x] All tests pass (12 tests)
- [x] Coverage increased for care-logs route

**Coverage Results (care-logs route):**
| Metric     | Coverage |
|------------|----------|
| Statements | 90%      |
| Branches   | 90%      |
| Functions  | 100%     |
| Lines      | 90%      |

**Note:** The route does not check ownership/care circle access - it only validates the pet exists. Tests verify status codes and mock call assertions rather than response body parsing due to jsdom/whatwg-fetch limitations with NextResponse.json().

**Claude Code Prompt for Phase 3:**
```
Create API route tests for POST /api/care-logs using the Prisma mock we set up:

File: __tests__/api/care-logs/route.test.ts

The route (at src/app/api/care-logs/route.ts):
- Requires authentication via getServerSession
- Validates input with Zod (recipientId, activityType required)
- Checks user has access (owner or in care circle)
- Creates a CareLog record
- Returns the created log with user info

Create tests for:
1. SUCCESS: authenticated user, valid data, owns the pet → 201
2. SUCCESS: authenticated user, valid data, in care circle → 201  
3. ERROR: no authentication → 401
4. ERROR: missing recipientId → 400
5. ERROR: missing activityType → 400
6. ERROR: user doesn't have access to pet → 403

Use:
- The prisma mock from __tests__/utils/prisma-mock.ts
- The factories from __tests__/utils/test-factories.ts
- Mock getServerSession from next-auth

Run the tests and show me the results.
```

---

## PHASE 4: API Route Test - pets

### 4.1 Create pets route test file
- [x] Create `__tests__/api/pets/route.test.ts`
- [x] Test GET (list pets) and POST (create pet)

### 4.2 Test GET /api/pets
- [x] Test: returns user's pets
- [x] Test: 401 when not authenticated

### 4.3 Test POST /api/pets
- [x] Test: creates pet with valid data
- [x] Test: validates required fields
- [x] Test: validates description/specialNotes length limits

**Coverage Results (pets route):**
| Metric     | Coverage |
|------------|----------|
| Statements | 91.83%   |
| Branches   | 100%     |
| Functions  | 100%     |
| Lines      | 91.83%   |

**Tests added (14 total):**
- GET: returns user's pets, returns 401, returns empty array
- POST success: required fields, optional fields, characteristics
- POST errors: 401, missing name, missing type, description too long, specialNotes too long, negative weight, future birthDate, invalid type

**Claude Code Prompt for Phase 4:**
```
Create API route tests for /api/pets (GET and POST):

File: __tests__/api/pets/route.test.ts

Test GET /api/pets:
1. SUCCESS: returns authenticated user's pets → 200
2. ERROR: not authenticated → 401

Test POST /api/pets:
1. SUCCESS: creates pet with all required fields → 201
2. SUCCESS: creates pet with optional description and specialNotes → 201
3. ERROR: not authenticated → 401
4. ERROR: missing required field (name) → 400
5. ERROR: description exceeds 500 chars → 400

Use the same mock setup as care-logs tests.
Run tests and show coverage improvement.
```

---

## PHASE 5: Verification & Summary ✅ COMPLETE

### Final Test Results (2025-12-12)
- **Total Test Suites:** 9 passed
- **Total Tests:** 54 passed
- **All Checks Pass:** ✅ lint, typecheck, test

### Final Coverage Report
| Metric     | Coverage |
|------------|----------|
| Statements | 20.75%   |
| Branches   | 18.83%   |
| Functions  | 16.81%   |
| Lines      | 21.04%   |

### Coverage by API Route
| Route                    | Statements | Branches | Functions |
|--------------------------|------------|----------|-----------|
| /api/care-logs           | 90%        | 90%      | 100%      |
| /api/pets                | 91.83%     | 100%     | 100%      |
| /api/pets/[id]           | 47.05%     | 54.71%   | 36.36%    |
| /api/auth/signup         | 0%         | 0%       | 0%        |
| /api/care-circles/*      | 0%         | 0%       | 0%        |
| /api/pets/[id]/care-logs | 0%         | 0%       | 0%        |
| /api/pets/[id]/photo     | 0%         | 0%       | 0%        |
| /api/user/profile        | 0%         | 0%       | 0%        |

### Files Created/Modified
**New Files:**
- `src/__tests__/utils/prisma-mock.ts` - Prisma mock utility
- `src/__tests__/utils/test-factories.ts` - Mock data factories
- `src/__tests__/utils/prisma-mock.test.ts` - Verification tests (4 tests)
- `src/__tests__/api/care-logs/route.test.ts` - Care logs API tests (12 tests)
- `src/__tests__/api/pets/route.test.ts` - Pets API tests (14 tests)

**Modified Files:**
- `package.json` - Added test:coverage script, jest-mock-extended dependency
- `jest.config.cjs` - Added testMatch, coverage configuration, thresholds
- `jest.setup.ts` - Added Response.json polyfill for NextResponse compatibility
- `eslint.config.mjs` - Added coverage/** to globalIgnores

### Known Limitations
- Response body parsing not tested due to jsdom/whatwg-fetch incompatibility with NextResponse.json()
- Tests verify status codes and Prisma mock calls instead
- Coverage thresholds set to 10% (will increase as more tests are added)

---

## Future Work (Not in Scope)
- Add tests for remaining 0% coverage API routes
- Increase coverage thresholds as baseline improves
- Add integration tests with real database (separate test suite)
- Add E2E tests with Playwright or Cypress