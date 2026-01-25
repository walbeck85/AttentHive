# AttentHive Backlog

Last updated: 2025-12-24

---

## Tier 1: Quick Wins
*Low complexity, high polish value. Do in next session.*

| | Item | Complexity | Status | Notes |
|---|------|------------|--------|-------|
| [x] | Reduce image upload to 10MB | 🟢 Easy | ✅ Done | Single validation change |
| [ ] | Pet photos appear universally | 🟢 Easy | Not started | Audit where PetAvatar is/isn't used |
| [x] | Care actions on pet detail page | 🟢 Easy | ✅ Done | QuickActions + modals on detail page, role-gated |
| [x] | About Page | 🟢 Easy | ✅ Done | Static content page for legitimacy |
| [ ] | Terms of Service page | ⏸️ Blocked | Awaiting legal content | Static content page. Required before launch. |
| [ ] | Privacy Policy page | 🟢 Easy | ⏸️ Blocked | Awaiting legal content | Static content page. Required with user data. |
| [ ] | Contact/feedback form | 🟢 Easy | Not started | Simple way for users to reach out. |
| [ ] | Error tracking (Sentry) | 🟢 Easy | Not started | Free tier. Know when things break. |

---

## 🚀 Pilot Release Blockers
*Must complete before pilot testing.*

| | Item | Complexity | Status | Notes |
|---|------|------------|--------|-------|
| [x] | Pet-type specific actions | 🟡 Medium | ✅ Complete | PRs #98, #99. Dogs: Walk, Bathroom, Feed, Medicate, Accident, Wellness. Cats: Litter Box, Feed, Medicate, Accident, Wellness. |
| [x] | Password reset flow | 🟡 Medium | ✅ Complete | PR #100. Resend integration, token-based reset, noreply@attenthive.app |
| [x] | Photo on activity logs | 🟡 Medium | ✅ Complete | PR #101. Optional photo per CareLog, editedAt tracking, 5MB limit |
| [x] | Multiple owners per pet | 🔴 High | ✅ Complete | PR #102. Primary owner + co-owners via Hive OWNER role |

---

## Tier 2: Valuable MVP Enhancements
*Medium complexity, good demo value.*

| | Item | Complexity | Status | Notes |
|---|------|------------|--------|-------|
| [ ] | User profile photos | 🟡 Medium | Not started | Schema + upload UI + display in Hive/NavBar |
| [x] | Comments/photos on care activities | 🟡 Medium | Moved to Pilot Blockers | See Pilot Release Blockers section |
| [ ] | Adding medications data model | 🟡 Medium | Not started | Foundation for reminders |
| [ ] | "Time Since" display | 🟡 Medium | Not started | Calculated from care logs. Shows time since last walk/pee/poop/meal |
| [ ] | New user onboarding flow | 🟡 Medium | Not started | Multi-step setup, "who are you caring for" |
| [x] | Password reset flow | 🟡 Medium | Moved to Pilot Blockers | See Pilot Release Blockers section |
| [ ] | Weekly care summary | 🟡 Medium | Not started | "Murphy was walked 12 times this week" - email or in-app. |

---

## Tier 3: Feature Expansion
*Higher complexity, strategic value.*

| | Item | Complexity | Status | Notes |
|---|------|------------|--------|-------|
| [ ] | Additional pet types | 🟡 Medium | Not started | Bird, Fish, Small Animal, Reptile, Other |
| [x] | Pet-type specific actions | 🟡 Medium | Moved to Pilot Blockers | See Pilot Release Blockers section |
| [ ] | Pet → Care Recipient rebrand | 🔴 High | Not started | Only when ready to add non-pet recipients |
| [ ] | User as care recipient | 🔴 High | Not started | Depends on Recipient rebrand. Wellness checks, meal trains |

---

## Tier 4: Infrastructure/Platform
*High complexity, production-critical.*

| | Item | Complexity | Status | Notes |
|---|------|------------|--------|-------|
| [ ] | System notifications | 🔴 High | Not started | Push, email, in-app. Micro-project |
| [ ] | Scheduled tasks + completion workflow | 🔴 High | Not started | Depends on notifications. Background jobs |
| [ ] | Pet notification schedule settings | 🟡 Medium | Not started | "My dog needs out every 8 hours" - pairs with notifications |
| [x] | Security audit | 🟡 Medium | ✅ Done | Auth & Authorization audit. 6 vulns fixed, 34 tests added. |
| [ ] | Rate limiting | 🟡 Medium | Not started | **HIGH priority.** Upstash Redis recommended for Vercel. |
| [ ] | OAuth email change handling | 🟡 Medium | Not started | User changing Google email orphans data. |
| [ ] | Explicit JWT expiration | 🟢 Easy | Not started | Currently using NextAuth defaults. |
| [ ] | Rebrand Phases 6-9 | 🟢 Low | Not started | Vercel domains, OAuth branding |
| [ ] | Account deletion flow | 🟡 Medium | Not started | GDPR/CCPA requirement. Must-have before public launch. |
| [ ] | Data export | 🟡 Medium | Not started | "Download my data" - GDPR right to portability. |
| [ ] | Analytics integration | 🟢 Easy | Not started | Plausible or PostHog. Privacy-friendly options. |
| [ ] | Accessibility audit | 🟡 Medium | Not started | Keyboard nav, screen reader, color contrast. |
| [ ] | Uptime monitoring | 🟢 Easy | Not started | UptimeRobot or Checkly. Free tier available. |

---

## Tier 5: Future / Post-MVP
*Park these for now.*

| | Item | Complexity | Status | Notes |
|---|------|------------|--------|-------|
| [ ] | Alternate languages (i18n) | 🔴 High | Not started | Spanish, French, German. Only if market demands |
| [ ] | Hive terminology brainstorm | 🟢 Easy | Not started | Hive Mind, Worker Bee, Busy Bee, The Buzz, etc. |

---

## Completed

| Item | Completed Date | Notes |
|------|----------------|-------|
| Pet profile enhancements | Dec 2025 | Description, specialNotes, characteristics |
| Testing infrastructure | Dec 2025 | 319 tests, Prisma mocks, coverage reporting |
| README rebrand | Dec 2025 | Full documentation update |
| Walk Timer feature | Dec 2025 | Duration tracking, bathroom events |
| CareCircle → Hive rebrand | Dec 2025 | Full codebase rename |
| Git branch cleanup | Dec 2025 | 60+ branches → main only |
| Security audit (Auth & Authorization) | Dec 2025 | 6 critical/high vulns fixed, 34 new tests |
| Care logs authorization | Dec 2025 | Created canAccessPet/canWriteToPet helpers |
| OAuth session ID mismatch | Dec 2025 | Created getDbUserFromSession helper |
| Hive members data leakage | Dec 2025 | Field selection + auth check |
| VIEWER role enforcement | Dec 2025 | canWriteToPet excludes VIEWER |
| Login user enumeration | Dec 2025 | Unified errors + timing normalization |
| Image upload MIME validation | Dec 2025 | Magic byte validation |
| Pet detail QuickActions | Dec 2025 | Walk/Feed/Medicate/Accident on detail page, OWNER/CAREGIVER only |
| Fix Hive add caregiver bug | Dec 2025 | PetDetailShell positional child destructuring dropped HiveSection when QuickActions present |
| Pet-type specific actions | Dec 2025 | PRs #98, #99. Filter QuickActions by species, 319 tests |
| Password reset flow | Dec 2025 | PR #100. Resend integration, token-based reset |
| Photo on activity logs | Dec 2025 | PR #101. Optional photo per CareLog, editedAt tracking |
| Multiple owners per pet | Dec 2025 | PR #102. Primary owner + co-owners via Hive OWNER role, 55 new tests |

---

## Security Audit Trail

### Dec 2025 - Auth & Authorization Audit

**Conducted:** Adversarial review of authentication and authorization

**Critical Findings Fixed:**
- Care logs API had no authorization
- OAuth session ID vs DB ID mismatch

**High Findings Fixed:**
- Hive members endpoint leaked password hashes
- VIEWER role not enforced
- Login enabled user enumeration
- File upload trusted client MIME type

**New Infrastructure:**
- `src/lib/auth-helpers.ts` - Centralized auth functions
- 34 security-focused tests

**Outstanding:**
- Rate limiting (HIGH - needed before launch)
- OAuth email change handling (MEDIUM)
- JWT expiration config (LOW)

---

## Notes

### Pet Types to Support (Future)
- Dog, Cat (current)
- Bird
- Fish
- Small Animal (rodents, rabbits, guinea pigs)
- Reptile
- Other

### Pet-Type Specific Actions

| Pet Type | Actions |
|----------|---------|
| Dog | Walk, Feed, Medicate, Accident, Wellness Check |
| Cat | Litter Box, Feed, Medicate, Accident, Wellness Check |
| Both | Feed, Medicate, Accident, Wellness Check |

**Implementation approach:**
- Add `activityType` configuration per species
- Filter QuickActions buttons based on pet type
- Walk button only for dogs
- Litter Box button only for cats
- Shared actions available for all

**Database consideration:**
- ActivityType enum may need LITTER_BOX and WELLNESS_CHECK added
- Existing WALK logs remain valid (dogs only going forward)

### Hive Terminology Ideas
- Hive Mind - AI/analytics
- Worker Bee - Loading states
- Busy Bee - Active user recognition
- The Buzz - Activity feed/notifications
- Honeycomb - Dashboard grid
- Nectar - Rewards/points
- Swarm - Multiple caregivers active
- Queen Bee - Primary owner/admin
- Drone - Scheduled/automated tasks
- Pollinate - Sharing/inviting

### Security Audit Options
- **Free:** npm audit, Dependabot, Snyk (free tier), OWASP ZAP
- **Paid:** Trail of Bits, Bishop Fox, NCC Group
- **Completed:** Manual auth & authorization audit (Dec 2025) - see Security Audit Trail above

### Email Infrastructure

**Provider:** Resend (recommended for Vercel, free tier available)

**Sender:** noreply@attenthive.app

**Required for:**
- Password reset flow
- Future: Hive invite notifications
- Future: Activity notifications
- Future: Weekly care summaries

**Setup steps:**
1. Create Resend account
2. Verify attenthive.app domain (DNS records)
3. Add RESEND_API_KEY to environment variables
4. Configure NextAuth email provider

### Multiple Owners Design (Option B)

**Approach:** Primary owner + co-owners via Hive

**Schema:**
- Keep `ownerId` on Recipient as primary owner (cannot be removed)
- Additional owners = Hive membership with `role: OWNER`
- Primary owner can remove co-owners
- Co-owners have same permissions as primary (except removing primary)

**Authorization updates needed:**
- `canAccessRecipient()` - already checks Hive, should work
- `canWriteToRecipient()` - already checks Hive OWNER role, should work
- New: `isPrimaryOwner()` helper for owner management UI
- New: Prevent primary owner from being removed

**UI updates needed:**
- Hive panel shows "Owner" vs "Co-owner" distinction
- Invite flow allows selecting OWNER role
- Only primary owner sees "remove" button for co-owners

**Migration:**
- No schema migration needed (uses existing Hive table)
- Existing pets: current owner remains primary, no co-owners

---

## Implementation Prompt Template

Use this template to start work on any backlog item. Copy, fill in the bracketed sections, and paste into a new Claude Code chat.

---

### PROMPT START
```
I need to implement [FEATURE NAME] for AttentHive.

## Context
AttentHive is a pet care coordination app built with:
- Next.js 14 (App Router), TypeScript
- Prisma with PostgreSQL (Supabase)
- MUI + Tailwind for styling
- Jest for testing (84+ tests, Prisma mocks in place)

## Feature Description
[PASTE THE ITEM DESCRIPTION AND NOTES FROM THE BACKLOG]

## Complexity
[🟢 Easy / 🟡 Medium / 🔴 High]

## Requirements
[LIST SPECIFIC REQUIREMENTS - WHAT SHOULD THIS FEATURE DO?]
-
-
-

## Files Likely Involved
[LIST ANY FILES YOU KNOW WILL BE TOUCHED, OR SAY "Identify during Phase 1"]
-
-

## Git Workflow
1. Create branch: `[feature|chore|fix]/[descriptive-name]`
2. Commit after each phase completes
3. Run `npm run check` after each phase
4. Push and create PR when complete

## Implementation Phases

Please break this work into logical phases following this pattern:

### PHASE 1: [Planning/Schema/Setup]
- [ ] Identify all files that need changes
- [ ] [Schema changes if needed]
- [ ] [Create migration if needed]
- [ ] Verify: `npm run check` passes
- [ ] Commit: `[type]: [description]`

### PHASE 2: [Backend/API]
- [ ] [API route changes]
- [ ] [Validation]
- [ ] Verify: `npm run check` passes
- [ ] Commit: `[type]: [description]`

### PHASE 3: [Frontend/Components]
- [ ] [Component changes]
- [ ] [UI implementation]
- [ ] Verify: `npm run check` passes
- [ ] Commit: `[type]: [description]`

### PHASE 4: [Integration/Polish]
- [ ] [Wire everything together]
- [ ] [Manual testing]
- [ ] Verify: `npm run check` passes
- [ ] Commit: `[type]: [description]`

### PHASE 5: [Tests] (if applicable)
- [ ] [Add/update tests]
- [ ] Verify: All tests pass
- [ ] Commit: `[type]: [description]`

## Completion Checklist
- [ ] All phases committed
- [ ] `npm run check` passes (lint + typecheck + tests)
- [ ] Manual testing complete
- [ ] No console errors

## Report Back
After completion, provide a summary including:
1. Phases completed
2. Files changed (count)
3. Test results
4. Any complications and how they were resolved
5. Screenshots (if UI changes)

Please start with Phase 1. Show me your plan and wait for confirmation before proceeding.
```
