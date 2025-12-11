# AttentHive / Mimamori – LLM Context File

## 1. Product & Mission
**Product name (current):** AttentHive  
**Legacy codename:** Mimamori  

**High-level concept:**  
AttentHive is a multi-tenant care coordination platform. It helps a “hive” of caregivers track and coordinate care for **recipients** (currently pets; future: people, plants, others).

Core outcomes:
- Everyone in a hive can see **who did what, and when** (feeds, walks, meds, etc.).
- Care is logged as structured activities tied to a recipient and a user.
- Provides a **timeline of care** to reduce uncertainty.

**Brand positioning:**
- Name: **AttentHive**
- CareCircle → **Hive**
- Tagline: **“Your Hive for the Ones You Care For.”**

---

## 2. Tech Stack & Environment
- Next.js (App Router), TypeScript  
- Tailwind CSS + custom theme tokens  
- Prisma (Postgres), Supabase  
- NextAuth (credentials + Google)  
- Jest + RTL  
- Deployed on Vercel  

Conventions:
- Use design tokens; avoid hard-coded colors.
- Database name still references mimamori, but not user-facing.

---

## 3. Domain Model & Key Concepts
### Entities
- **User**
- **Recipient** (pets → generalizable)
- **CareCircle/Hive** (role-based sharing)
- **CareLog** (activity events)

### ActivityType
Enum contains future values (e.g. VOMIT). Do not remove.

---

## 4. Major Feature Areas
1. Initial setup (Next.js, TS, Tailwind, Prisma, Auth)  
2. Auth (signup/login/logout) with friendly and secure error handling  
3. Pets/Recipients CRUD with validation  
4. Care Logging + Timeline + Filters  
5. User Profile Page  
6. UI polish & theming refinements  

---

## 5. Frontend Architecture & Styling
- Mobile-first responsive layout  
- Components:
  - **PetCard:** Rounded card, footer actions, consistent borders  
  - **AddPetForm:** Detailed validation, consistent layout  
  - **Timeline:** Fetch logs by recipientId, filters, error handling  

Theming:
- Tokens in Tailwind + theme.ts  
- Dark mode supported  
- Legacy mm-* tokens being gradually migrated  

---

## 6. Backend & API Patterns
- Prisma schema is source of truth  
- Next.js App Router API routes  
- Auth checks at top of mutating routes  
- **Critical pattern:** CareLog routes use flat structure:  
  `/api/care-logs?recipientId=...`  
- Avoid nested `/api/pets/[id]/care-logs`

---

## 7. Testing & Quality Gates
- `npm run check` runs lint + typecheck + test  
- Tests cover auth, PetCard, API routes  
- Update tests when modifying behavior—don’t weaken them  

---

## 8. Git Workflow & Branching
Branches:
- `main`
- `feature/*`
- `chore/*`
- `fix/*`

Rules:
- Changes must be scoped and reversible  
- Avoid sweeping unrequested refactors  

---

## 9. UX & Copy Principles
- Tone: clear, calm, not cutesy  
- Copy examples:
  - “Log Feed for Murphy”
  - “Profile updated successfully.”
  - “Invalid email or password.”
- Use confirmation modals for impactful actions  

---

## 10. User’s Coding Style & Constraints
**Hard rules:**
- No emojis in code  
- No smart quotes  
- Comments must explain *why*, not just what  
- Prefer clarity over clever solutions  
- Avoid introducing new libraries without permission  

React/TS preferences:
- One component at a time  
- Start with props + useState  
- Introduce Context sparingly  
- Avoid unnecessary abstraction  

Database:
- Avoid renaming enums/models/fields casually  
- Keep schema changes small and reversible  

---

## 11. Known Landmines
- CareLog routing: must remain flat  
- Token migration: must be incremental  
- Schema fields that are forward-looking should not be removed  

Global theming:
- theme.ts, ThemeModeProvider, and Tailwind config are sensitive; changes must preserve global look.

---

## 12. How an LLM Should Assist
- Summarize impact before changing code  
- Respect patterns already in place  
- Maintain all existing behavior  
- Keep diffs small  
- Call out risks  
- Always align changes with the caregiving purpose of the app  

---

## 13. Preflight Checklist Before Suggesting Code
- Am I preserving `/api/care-logs` pattern?  
- Am I using tokens instead of hard-coded colors?  
- Am I avoiding silent removal of features?  
- Is the change small, scoped, reversible?  
- Are comments written in the user’s voice (no emojis)?  

---

