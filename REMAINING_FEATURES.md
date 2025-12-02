# Mimamori Feature Roadmap

## Progress Snapshot

- Completed: #5 Pet Gender UI, #21 Testing Coverage
- In progress: #1 CareCircle
- Remaining items: 20

## Status Legend

- [ ] Not started
- [x] Completed

### Update Rules (to keep diffs small and history readable)

- Do not renumber items. If new items are added in the future, append them as new numbers at the end.
- Do not move items between sections. Their original section shows how we were thinking about priority at the time.
- Do not delete completed items. Mark them as `[x]` and optionally add a short "Status note" line if needed.
- When updating an item, prefer changing only:
  - The checkbox (`[ ]` → `[x]`), and/or
  - A short status note line, rather than rewriting the whole description.

⸻

## Mimamori: Complete List of Remaining Features

Below is the definitive list, grouped by Core, High Priority, Polish, Future Enhancements, and Technical Improvements.

⸻

### Core Remaining Features (Required for a polished MVP)

These complete the core product vision.

- [ ] 1. CareCircle (Shared Pet Access) — Not Implemented

  Database table exists, but no UI or API to support:
  - Invite a user to a CareCircle
  - Accept/decline invitation
  - List members of a CareCircle
  - Remove a user from a CareCircle
  - Permissions model (owner, caregiver)

  UI in:
  - Pet page → “Shared with…”
  - Account → “Shared Pets”
  - Dashboard → mix owned + shared pets

### CareCircle invitations (respondToInvitation)

- [ ] Add `CareCircleStatus` enum to Prisma:
  - INVITED, ACTIVE, DECLINED, REMOVED
- [ ] Extend `CareCircle` model with `status` field
- [ ] Implement `respondToInvitation(careCircleId, action)` in `src/lib/carecircle.ts`
- [ ] Add Account page UI for pending invitations (accept/decline)
- [ ] Add tests for invitation accept/decline flows

- [ ] 2. Role-Based Permissions (Owner / Caregiver / Viewer)

  Define what each role can do:
  - Owner: full access
  - Caregiver: log care, cannot delete pet
  - Viewer: view timeline, nothing else

  Integrate permissions into:
  - Pet CRUD API
  - CareLog API
  - UI conditional rendering

- [ ] 3. Activity Type Expansion & Consistency

  Your Prisma schema includes VOMIT but the UI does not support it.

  Fix by:
  - Adding matching icons
  - Updating QuickActions
  - Adding filter buttons
  - Updating activity timeline display

- [ ] 4. Editable Recipient Profile Badges 

  - Each owner user should be able to edit characteristics of their pet (care recipient).
  - These should correspond with things like “Leash aggression”, “mobility issues”, “avoid dog parks”, “Blind”, “Deaf”, etc.
  - Each selected attribute should display as a unique badge on the pet (care recipient’s card) and there should be hover text when the mouse hovers over it to explain what it is.
  - Each badge should be unique and distinguishable from each other.

⸻

### High Priority Features (Strongly Recommended)

- [x] 5. Pet Gender UI (Backed by Migration but Not Exposed)

  Status note: Gender is now wired end-to-end (create/edit forms, card display, pet detail), so this item is considered completed.

  Migration exists (`add_gender_to_pets`), and the UI includes:
  - Gender dropdown in AddPetForm
  - Gender display in PetCard
  - Gender field shown on pet detail

- [ ] 6. Pet Photos / Avatars

  You have no image upload yet.

  Options:
  - Local upload → S3 bucket → store URL in DB
  - Default avatars

  Display on:
  - Pet Card
  - Pet Detail
  - Timeline

- [ ] 7. Improved Pet Detail Page

  Current page is functional but basic.

  Needs:
  - Edit button
  - Better layout (sections: info, quick actions, recent logs)
  - Collapsible sections on mobile

- [ ] 8. Empty States

  Add friendly designs for when:
  - User has 0 pets
  - Pet has 0 activity logs
  - User has no CareCircle invitations
  - Search returns no logs

⸻

### Quality & Polish Features

- [ ] 9. Dashboard Redesign (Currently Extremely Minimal)

  As of now, dashboard is essentially a routing wrapper.

  You could add:
  - “Recent activity across pets”
  - “Upcoming reminders”
  - “Pets you share”
  - Quick-action bar

- [ ] 10. Success + Error Toast Notifications

  Right now you rely on inline messages.

  Upgrade to:
  - Toast notifications via shadcn/ui
  - Consistent success/failed operation messaging
  - Dismiss timers

- [ ] 11. Better Loading States

  Replace text-based loading with:
  - Skeleton components
  - Shimmer animations
  - Loading cards for pet list
  - Spinner for activity timeline

- [ ] 12. Navbar Improvements

  Current NavBar exists but could include:
  - User avatar
  - Dropdown menu
  - “Add Pet” quick action
  - Active page highlight

⸻

### Future Enhancements (Next Version / v2)

- [ ] 13. Reminders & Notifications System

  Rough model:
  - User sets reminder (e.g., “Walk every 8 hours”)
  - App sends notifications:
    - Email
    - Push (if browser supports)
    - SMS (if you want to integrate Twilio)

- [ ] 14. Automated Insights / Health Logs

  Based on logs, show:
  - Average daily walks
  - Time between feedings
  - Medication adherence
  - Activity heatmaps

- [ ] 15. Multi-Household Support

  Allow user to switch:
  - “Home Pets”
  - “Partner’s Pets”
  - “Parents’ Pets”

- [ ] 16. Pet Medical Records

  Upload PDFs or add structured vet visit notes.

⸻

### Engineering / Infra Improvements

- [ ] 17. API Restructuring (Fix Nested Routes)

  You already partially corrected this by flattening care-logs routes.

  Remaining tasks:
  - Remove legacy nested routes under `/pets/[id]/care-logs`
  - Forward them to the new structure with warnings
  - Update all components to rely on the flat endpoint

- [ ] 18. Access Control Hardening

  Every API route needs:
  - Permission checks
  - Error codes
  - Proper try/catch + logging

- [ ] 19. Improve Error Handling Across API Routes

  Right now some endpoints:
  - Log errors
  - Return generic 500s
  - Do not include standardized error shapes

  Good improvement:

  ```json
  { "error": { "message": "Invalid pet ID", "code": "ERR_INVALID_PET" } }
  ```

- [ ] 20. Switch to Server Actions (Optional but modern)

  Next.js App Router supports Server Actions that can replace:
  - many API calls
  - mutation logic inside components

  Would simplify QuickActions and AddPetForm.

- [x] 21. Testing Coverage

  Status note: Baseline test coverage is now in place (smoke test, PetCard component test, pets API route test). There is still plenty of room to grow coverage, but this item tracks getting a working, green baseline rather than exhaustive test perfection.

  You initially had only:
  - `smoke.test.ts`

  Current baseline includes:
  - `smoke.test.ts`
  - `src/__tests__/Components/PetCard.test.tsx`
  - `src/__tests__/api/pets-route.test.ts`

- [ ] 22. Better Production Observability

  Add:
  - Logging via something like Pino
  - Remote error monitoring (Sentry)
  - Database slow-query alerts (via Supabase logs)

- [ ] 23. Full CareCircle Invitation Lifecycle (Nice-to-Have Enhancement)
  To support a true invitation experience:
  - Add `CareCircleStatus` enum values: INVITED, ACTIVE, DECLINED, REMOVED.
  - Update the invite endpoint to create `INVITED` records instead of immediate access.
  - Add UI for invited users:
    - “You’ve been invited to care for <pet> — Accept / Decline”
  - Update all queries to treat only `ACTIVE` memberships as valid access.

⸻

## Top 10 Priority List (Impact-First View)

This is a snapshot of what delivers the most impact the fastest. Items may be completed but are kept here to reflect original priority.

1. CareCircle full implementation (#1)
2. Role-based permissions (#2)
3. Pet gender UI (#5) — completed
4. Activity type consistency (VOMIT) (#3)
5. Activity filtering (falls under activity-related UI enhancements)
6. Dashboard redesign (#9)
7. Success/error toast notifications (#10)
8. Better loading states (#11)
9. Pet photos (#6)
10. API hardening + permission checks (#17, #18, #19)

⸻
