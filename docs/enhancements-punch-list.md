# Pet Profile Enhancements Punch List

## Context
Adding two new characteristics (ALLERGIES, MEDICATIONS) and two new text fields 
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
- [ ] Add `description String?` field (optional, free text about the pet)
- [ ] Add `specialNotes String?` field (optional, owner notes for caregivers)

### 1.2 Add new characteristics to enum
- [ ] Add ALLERGIES to PetCharacteristic enum
- [ ] Add MEDICATIONS to PetCharacteristic enum
- [ ] Ensure enum values are in ALPHABETICAL order:
      AGGRESSIVE, ALLERGIES, BLIND, DEAF, MEDICATIONS, MOBILITY_ISSUES, REACTIVE, SHY

### 1.3 Generate migration
```bash
npx prisma migrate dev --name add_description_notes_characteristics
npx prisma generate
```

### 1.4 Verify
```bash
npx prisma studio
# Check Recipient model has new fields
```

---

## PHASE 2: TypeScript Types & Utilities
Location: src/lib/petCharacteristics.ts, src/components/pets/petDetailTypes.ts

### 2.1 Update petCharacteristics.ts
- [ ] Add ALLERGIES to characteristic definitions with appropriate label/display
- [ ] Add MEDICATIONS to characteristic definitions with appropriate label/display
- [ ] Ensure the list is sorted ALPHABETICALLY for display

### 2.2 Update petDetailTypes.ts (if needed)
- [ ] Add `description?: string` to pet type interfaces
- [ ] Add `specialNotes?: string` to pet type interfaces

---

## PHASE 3: API Updates

### 3.1 Create endpoint: src/app/api/pets/route.ts
- [ ] Accept `description` in POST body
- [ ] Accept `specialNotes` in POST body
- [ ] Accept new characteristics (ALLERGIES, MEDICATIONS) in characteristics array

### 3.2 Update endpoint: src/app/api/pets/[id]/route.ts
- [ ] Accept `description` in PATCH body
- [ ] Accept `specialNotes` in PATCH body
- [ ] Handle new characteristics in PATCH

---

## PHASE 4: Pet Creation Form
Location: src/components/pets/AddPetForm.tsx

### 4.1 Add new text fields
- [ ] Add "Description" textarea field (optional)
- [ ] Add "Special Notes" textarea field (optional)
- [ ] Position appropriately in form flow (after basic info, before characteristics)

### 4.2 Add new characteristic toggles
- [ ] Add ALLERGIES toggle
- [ ] Add MEDICATIONS toggle
- [ ] Ensure toggles display in ALPHABETICAL order

---

## PHASE 5: Pet Edit Profile
Location: src/components/pets/PetDetailProfileSection.tsx

### 5.1 Display new fields
- [ ] Show description in view mode (if present)
- [ ] Show specialNotes in view mode (if present)

### 5.2 Edit mode for new fields
- [ ] Add editable "Description" textarea in edit mode
- [ ] Add editable "Special Notes" textarea in edit mode

### 5.3 Characteristics in edit mode
- [ ] Add ALLERGIES toggle to characteristics section
- [ ] Add MEDICATIONS toggle to characteristics section
- [ ] Maintain alphabetical sort order

---

## PHASE 6: Testing & Commit

### 6.1 Manual testing
- [ ] Create new pet with description, specialNotes, and new characteristics
- [ ] Edit existing pet to add description and specialNotes
- [ ] Verify characteristics display alphabetically
- [ ] Test on mobile viewport

### 6.2 Run checks
```bash
npm run lint
npm test
```

### 6.3 Commit
```bash
git add .
git status
git commit -m "feat: Add description, specialNotes fields and ALLERGIES/MEDICATIONS characteristics

- Add description and specialNotes optional text fields to Recipient model
- Add ALLERGIES and MEDICATIONS to PetCharacteristic enum
- Update AddPetForm with new fields and characteristic toggles
- Update PetDetailProfileSection for view/edit of new fields
- Characteristics now display in alphabetical order"
```

### 6.4 Push and PR
```bash
git push -u origin feature/pet-profile-enhancements
```