# AttentHive Brand Migration Plan

## 1. Decisions
- App name: **AttentHive**
- Tagline: *Your Hive for the Ones You Care For*
- Primary domain: `attenthive.com`
- Canonical capitalization: `AttentHive`
- Short name (if different): N/A

## 2. Scope

- Do **now**:
  - [x] App name in UI
  - [x] Metadata (titles, descriptions, manifest)
  - [x] README + top-level docs
  - [x] Central APP_NAME constant
  - [ ] Environment variable *values* where name appears in emails / templates
  - [ ] OAuth branding (Google app name + screen copy)
- Do **later**:
  - [ ] Visual brand changes (colors, logos, illustrations)
  - [ ] Supabase project display name (cosmetic)
  - [ ] Any deeper DB renames (only if truly needed)

## 3. External Touchpoints (Inventory)

- **Vercel**
  - Project name:
  - Custom domains:
  - Env vars that include "mimamori":

- **Supabase**
  - Project name:
  - Project ref:
  - Connection URL currently used in `DATABASE_URL`:

- **OAuth / Auth**
  - Google OAuth app name:
  - Authorized redirect URIs currently set:

- **Email / Notifications**
  - Provider(s):
  - Templates that mention "Mimamori":

- **Analytics / Monitoring**
  - Tools:
  - Project names:

## 4. Phase Checklist

- [x] Phase 0 – Pre-flight complete
- [x] Phase 1 – Repo-wide audit of "Mimamori"
- [x] Phase 2 – Introduce APP_NAME constant
- [x] Phase 3 – Core app + docs rename
- [ ] Phase 4 – Theme & Design Tokens
- [ ] Phase 5 – Env vars & config surface
- [ ] Phase 6 – Vercel project & domains
- [ ] Phase 7 – Supabase / Prisma review
- [ ] Phase 8 – OAuth & third-party branding
- [ ] Phase 9 – QA, smoke tests, rollout

## Phase 1 – Audit of "Mimamori"

### 1. User-Facing Text

- `src/app/(auth)/login/LoginPageClient.tsx` — subtitle contains “Access your Mimamori care circle.”
- `src/app/(auth)/signup/SignupPageClient.tsx` — subtitle contains “Create your Mimamori account…”
- `src/app/layout.tsx` — top-level metadata title: “Mimamori”
- `src/components/NavBar.tsx` — visible brand label “Mimamori” in two locations

### 2. Config / Metadata

- `package.json` / `package-lock.json` — project name set to “mimamori”
- `public/manifest.json` (inferred from grep absence but normally contains app name; verify manually)
- `src/app/layout.tsx` — metadata.title
- README.md — multiple references to Mimamori in documentation
- `.env.example` — database name includes `mimamori_db`

### 3. Design Tokens / Theme

- `src/theme.ts` — theme comments refer to “Mimamori app” and Option 3 palette
- `tailwind.config.ts` — comments define Mimamori semantic color tokens
- `src/app/globals.css` — CSS variables with `--mm-*` tokens (mm-bg, mm-ink, mm-surface-*)
- `src/components/RootShell.tsx` — references legacy mm-page/mm-shell classes
- `src/components/pets/PetCard.tsx` — references mm-card/mm-chip

### 4. Infrastructure / Env

- `.env.example` — DATABASE_URL references `mimamori_db`
- Seed data:
  - `prisma/seed.ts` — console logs: “Running Mimamori seed…”
  - Emails use `@mimamori.app`
- Theme mode persistence key:
  - `src/components/ThemeModeProvider.tsx` — STORAGE_KEY = "mimamori-theme-mode"

### 5. Historical / Ignorable

- README references to historical architecture evolution of Mimamori
- Old git clone instructions using the Mimamori repo name
- Directories or comments referencing Mimamori in a historical context
- The rename plan document contains placeholder references for the audit section itself