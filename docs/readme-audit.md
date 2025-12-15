# README.md Audit Report

**Generated:** 2025-12-14
**Auditor:** Claude Code
**Scope:** Compare README.md documentation against actual project state

---

## 1. CRITICAL: Stale Mimamori References

| Line | Content | Issue |
|------|---------|-------|
| 7 | `Earlier iterations of this project used the working title **Mimamori**...` | ✅ OK - Historical context note |
| 92 | `mimamori/` | ❌ **Project tree header uses old name** |
| 303 | `git clone https://github.com/walbeck85/mimamori.git` | ❌ **Wrong repo URL** |
| 304 | `cd mimamori` | ❌ **Wrong directory name** |
| 342 | `git clone <https://github.com/walbeck85/mimamori>` | ❌ **Wrong repo URL** |
| 343 | `cd mimamori` | ❌ **Wrong directory name** |
| 364 | `CREATE DATABASE mimamori_db;` | ⚠️ **Database name uses old branding** |

**Actual Repository URL:** `git@github.com:walbeck85/AttentHive.git`

### Recommended Fixes:
- Line 92: Change `mimamori/` → `AttentHive/`
- Lines 303-304: Change to `https://github.com/walbeck85/AttentHive.git` and `cd AttentHive`
- Lines 342-343: Same as above
- Line 364: Change to `CREATE DATABASE attenthive_db;` (or keep for backward compatibility with note)

---

## 2. VERSION UPDATES

| Item | README Claims | Actual Value | Status |
|------|---------------|--------------|--------|
| Next.js | `Next.js 16` (line 46) | `"next": "^16.0.7"` | ✅ Correct |
| Node.js | `Node.js 18+` (line 329) | Not specified in package.json | ⚠️ Should verify engines field |

---

## 3. MISSING FEATURES: Not Documented

### 3.1 Pet Profile Enhancements (New in migration `20251211053515`)

The Prisma schema now includes fields **not mentioned** in README:

| Field | Type | Purpose |
|-------|------|---------|
| `description` | `String?` | General pet description |
| `specialNotes` | `String?` | Additional notes for caregivers |

**README Features section (lines 66-84) should document:**
- Pet description field for general information
- Special notes field for caregiver instructions

### 3.2 Pet Characteristics (Expanded)

README mentions "badges" but doesn't list the full characteristic set:

**Current characteristics in schema (`PetCharacteristic` enum):**
- AGGRESSIVE
- ALLERGIES
- BLIND
- DEAF
- MEDICATIONS
- MOBILITY_ISSUES
- REACTIVE
- SEPARATION_ANXIETY
- SHY

**README mentions characteristics at lines 115-116, 213-214 but doesn't document the full list.**

### 3.3 API Endpoints Not Documented

| Actual Endpoint | Purpose | In README? |
|-----------------|---------|------------|
| `POST /api/pets/[id]/photo` | Upload pet photo | ❌ No |
| `GET/PATCH /api/user/profile` | User profile management | ❌ No |
| `POST /api/hives/invite` | Invite to hive | ❌ No |
| `GET/POST /api/hives/members` | Manage members | ❌ No |
| `GET /api/hives/shared-pets` | List shared pets | ❌ No |

### 3.4 Testing Infrastructure

README briefly mentions testing (lines 280-282) but doesn't document:

| Item | Status | Details |
|------|--------|---------|
| Coverage directory | ✅ Exists | `coverage/` with lcov reports |
| Jest config | ✅ Exists | `jest.config.cjs` |
| Test utilities | ✅ Exists | `src/__tests__/utils/` directory |
| Prisma mocks | ✅ Exists | `prisma-mock.ts`, `test-factories.ts` |

**Missing from Development Commands section:**
```bash
# Run tests with coverage
npm test -- --coverage

# View coverage report
open coverage/lcov-report/index.html
```

### 3.5 ActivityType Enum (Incomplete)

README lists (lines 459-465):
- Feeding, Walking, Medication, Bathroom, Accidents

**Actual enum includes:**
- FEED, WALK, MEDICATE, BATHROOM, ACCIDENT, **VOMIT**

`VOMIT` activity type is not documented.

---

## 4. STRUCTURE DRIFT: Project Tree Discrepancies

### 4.1 Missing Migration

README lists 6 migrations (lines 105-117), but there are **7 actual migrations**:

**Missing from README:**
```
20251211053515_add_description_notes_and_new_characteristics
```

### 4.2 Missing Test Directories

README shows test structure (lines 132-143) but is **outdated**:

**Actual structure:**
```
src/__tests__/
├── api/
│   ├── care-logs/          # ❌ NOT in README
│   │   └── ...
│   ├── pets/               # ❌ NOT in README (nested differently)
│   │   └── ...
│   ├── pets-id-route.test.ts  # Listed but location changed
│   └── pets-route.test.ts     # ❌ NOT at this path
├── auth/
├── hive/
├── Components/
├── utils/                  # ❌ NOT in README
│   ├── prisma-mock.test.ts
│   ├── prisma-mock.ts
│   └── test-factories.ts
└── smoke.test.ts
```

---

## 5. API ROUTE CHANGES

### Documented vs Actual Routes

| README Documents | Actual Route | Match? |
|------------------|--------------|--------|
| `POST /api/auth/signup` | `src/app/api/auth/signup/route.ts` | ✅ |
| `POST /api/auth/signin` | Via NextAuth `[...nextauth]` | ✅ |
| `POST /api/auth/signout` | Via NextAuth `[...nextauth]` | ✅ |
| `GET /api/auth/session` | Via NextAuth `[...nextauth]` | ✅ |
| `GET /api/pets` | `src/app/api/pets/route.ts` | ✅ |
| `POST /api/pets` | `src/app/api/pets/route.ts` | ✅ |
| `GET /api/pets/[id]` | `src/app/api/pets/[id]/route.ts` | ✅ |
| `PATCH /api/pets/[id]` | `src/app/api/pets/[id]/route.ts` | ✅ |
| `DELETE /api/pets/[id]` | `src/app/api/pets/[id]/route.ts` | ✅ |
| `GET /api/carelogs` | `src/app/api/care-logs/route.ts` | ⚠️ Path uses hyphen |
| `POST /api/carelogs` | `src/app/api/care-logs/route.ts` | ⚠️ Path uses hyphen |
| `DELETE /api/carelogs/[id]` | ❌ Does not exist | ❌ |

### Undocumented Routes (Actually Exist)

| Route | Purpose |
|-------|---------|
| `POST /api/pets/[id]/photo` | Pet photo upload |
| `GET /api/pets/[id]/care-logs` | Care logs for specific pet |
| `GET /api/user/profile` | Get user profile |
| `PATCH /api/user/profile` | Update user profile |
| `POST /api/hives/invite` | Send hive invite |
| `GET /api/hives/members` | List hive members |
| `POST /api/hives/members` | Add hive member |
| `GET /api/hives/shared-pets` | List pets shared with user |

### Hive Routes (README says "Stretch" but implemented)

README line 549-555 says these are "planned" and "may not be fully implemented":
- ❌ The actual routes exist under `/api/hives/` with different structure
- The documented endpoints (`/api/hives`) use wrong path naming

---

## Summary: Priority Actions

### High Priority
1. **Fix repository URLs** (lines 303, 342) - Users cannot clone
2. **Fix directory name** (lines 92, 304, 343) - Confuses new developers
3. **Update Hive routes** - Section is misleading (says "stretch" but implemented)
4. **Document photo upload endpoint** - Feature exists but undiscoverable

### Medium Priority
5. **Add VOMIT to activity types** - Incomplete feature documentation
6. **Document description/specialNotes fields** - New pet profile features
7. **Fix care-logs path** - README uses `carelogs`, actual is `care-logs`
8. **Update test directory structure** - Significantly changed

### Low Priority
9. **Add testing commands with coverage** - Enhance developer experience
10. **Update migration list** - Add newest migration
11. **List all pet characteristics** - Complete the badges documentation
12. **Document user profile endpoint** - Feature exists

---

## Appendix: Raw Data

### Actual API Routes (from filesystem)
```
src/app/api/auth/[...nextauth]/route.ts
src/app/api/auth/signup/route.ts
src/app/api/hives/invite/route.ts
src/app/api/hives/members/route.ts
src/app/api/hives/shared-pets/route.ts
src/app/api/care-logs/route.ts
src/app/api/pets/[id]/care-logs/route.ts
src/app/api/pets/[id]/photo/route.ts
src/app/api/pets/[id]/route.ts
src/app/api/pets/route.ts
src/app/api/user/profile/route.ts
```

### Actual Migrations (from filesystem)
```
20251119083320_init
20251119211856_remove_timestamp_field
20251120115220_add_gender_to_pets
20251129194214_add_user_contact_fields
20251202204455_add_image_url_to_recipient
20251204221553_add_pet_characteristics
20251211053515_add_description_notes_and_new_characteristics  # ← MISSING FROM README
migration_lock.toml
```
