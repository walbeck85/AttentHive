# Pet Profile Enhancements Punch List

## Context
Adding three new characteristics (ALLERGIES, MEDICATIONS, SEPARATION_ANXIETY) and two new text fields
(description, specialNotes) to pet profiles.

## Files to Modify
- prisma/schema.prisma
- src/lib/petCharacteristics.ts
- src/components/pets/petDetailTypes.ts
- src/app/api/pets/route.ts
- src/app/api/pets/[id]/route.ts
- src/components/pets/AddPetForm.tsx
- src/components/pets/PetDetailProfileSection.tsx

---

## PHASE 1: Database Schema
Location: prisma/schema.prisma

### 1.1 Add text fields to Recipient model
- [x] Add `description String?` field (optional, free text about the pet)
- [x] Add `specialNotes String?` field (optional, owner notes for caregivers)

### 1.2 Add new characteristics to enum
- [x] Add ALLERGIES to PetCharacteristic enum
- [x] Add MEDICATIONS to PetCharacteristic enum
- [x] Add SEPARATION_ANXIETY to PetCharacteristic enum
- [x] Ensure enum values are in ALPHABETICAL order:
      AGGRESSIVE, ALLERGIES, BLIND, DEAF, MEDICATIONS, MOBILITY_ISSUES, REACTIVE, SEPARATION_ANXIETY, SHY

### 1.3 Generate migration
- [x] Migration created: `20251211053515_add_description_notes_and_new_characteristics`
- [x] Successfully applied to database
- [x] Prisma Client regenerated

### 1.4 Verify
- [x] Database schema updated successfully
- [x] No breaking changes (all fields optional)

---

## PHASE 2: TypeScript Types & Utilities
Location: src/lib/petCharacteristics.ts, src/components/pets/petDetailTypes.ts

### 2.1 Update petCharacteristics.ts
- [x] Add ALLERGIES to characteristic definitions with appropriate label/display
- [x] Add MEDICATIONS to characteristic definitions with appropriate label/display
- [x] Add SEPARATION_ANXIETY to characteristic definitions with appropriate label/display
- [x] Ensure the list is sorted ALPHABETICALLY for display
- [x] PRESERVE all existing comments

### 2.2 Update petDetailTypes.ts (if needed)
- [x] Add `description?: string` to pet type interfaces
- [x] Add `specialNotes?: string` to pet type interfaces

---

## PHASE 3: API Updates

### 3.1 Create endpoint: src/app/api/pets/route.ts
- [x] Accept `description` in POST body
- [x] Accept `specialNotes` in POST body
- [x] Accept new characteristics (ALLERGIES, MEDICATIONS, SEPARATION_ANXIETY) in characteristics array
- [x] Add Zod validation with 500 character limit for text fields
- [x] Use conditional spread operators to prevent undefined values

### 3.2 Update endpoint: src/app/api/pets/[id]/route.ts
- [x] Accept `description` in PATCH body
- [x] Accept `specialNotes` in PATCH body
- [x] Handle new characteristics (ALLERGIES, MEDICATIONS, SEPARATION_ANXIETY) in PATCH
- [x] Add Zod validation with 500 character limit for text fields
- [x] Use conditional spread operators to prevent undefined values

---

## PHASE 4: Pet Creation Form
Location: src/components/pets/AddPetForm.tsx

### 4.1 Add new text fields
- [x] Add "Description" textarea field (optional)
- [x] Add "Special Notes" textarea field (optional)
- [x] Position appropriately in form flow (after weight, before characteristics)
- [x] Add character counters (500/500) for both fields
- [x] Add helper text explaining purpose of each field
- [x] Update FormState type to include description and specialNotes
- [x] Only include fields in API payload when they contain content

### 4.2 Add new characteristic toggles
- [x] Add ALLERGIES toggle
- [x] Add MEDICATIONS toggle
- [x] Add SEPARATION_ANXIETY toggle
- [x] Ensure toggles display in ALPHABETICAL order
- [x] All characteristic toggles automatically available via PET_CHARACTERISTICS constant

---

## PHASE 5: Pet Edit Profile
Location: src/components/pets/PetDetailProfileSection.tsx, src/components/pets/PetPhotoProfileCard.tsx

### 5.1 Display new fields (PetPhotoProfileCard.tsx)
- [x] Show description in view mode (if present)
- [x] Show specialNotes in view mode (if present)
- [x] Show characteristics badges in view mode (if present)
- [x] Use white-space: pre-wrap to preserve line breaks in text fields

### 5.2 Edit mode for new fields (PetPhotoProfileCard.tsx)
- [x] Add editable "Description" textarea in edit mode
- [x] Add editable "Special Notes" textarea in edit mode
- [x] Add character counters (500/500) for both fields
- [x] Add helper text explaining purpose of each field
- [x] Add validation error display for both fields

### 5.3 State management (PetDetailProfileSection.tsx)
- [x] Update EditFormState type to include description and specialNotes
- [x] Initialize edit form with existing description/specialNotes values
- [x] Add validation for 500 character limit
- [x] Only include fields in API payload when they contain content

### 5.4 Characteristics in edit mode
- [x] Add ALLERGIES toggle to characteristics section
- [x] Add MEDICATIONS toggle to characteristics section
- [x] Add SEPARATION_ANXIETY toggle to characteristics section
- [x] Maintain alphabetical sort order
- [x] All characteristic toggles automatically available via PET_CHARACTERISTICS constant

---

## PHASE 6: Testing & Commit

### 6.1 Manual testing
- [x] Create new pet with description, specialNotes, and new characteristics
- [x] Edit existing pet to add description and specialNotes
- [x] Verify characteristics display alphabetically
- [ ] Test on mobile viewport (recommended for final verification)

### 6.2 Run checks
- [x] `npm run lint` - Passed with no errors
- [x] `npm test` - All 25 tests passed

### 6.3 Commit
- [x] Phase 1-3 committed: `feat: Add pet profile enhancements - DB schema, types, and API routes`
- [x] Phase 4-5 committed: `feat: Add description and specialNotes fields to pet profiles`

Commit details:
```bash
# First commit (Phases 1-3)
git commit -m "feat: Add pet profile enhancements - DB schema, types, and API routes

- Add description and specialNotes optional fields to Recipient model
- Add ALLERGIES, MEDICATIONS, SEPARATION_ANXIETY to PetCharacteristic enum
- Update petCharacteristics.ts with new characteristics in alphabetical order
- Update petDetailTypes.ts with description and specialNotes fields
- Update POST /api/pets and PATCH /api/pets/[id] routes with validation
- All characteristics now display alphabetically in UI"

# Second commit (Phases 4-5)
git commit -m "feat: Add description and specialNotes fields to pet profiles

- Add description and specialNotes optional text fields to AddPetForm
- Update POST /api/pets route to accept and validate new fields
- Update EditFormState to include description and specialNotes
- Add textarea fields to PetDetailProfileSection edit mode
- Display description and specialNotes in PetPhotoProfileCard read-only view
- Both fields have 500 character limit with visual counters
- Fields only sent to API when they contain content"
```

### 6.4 Push and PR
- [ ] `git push -u origin feature/pet-profile-enhancements`
- [ ] Create pull request on GitHub
- [ ] Add description summarizing all changes across phases