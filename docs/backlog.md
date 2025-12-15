# AttentHive Backlog

Last updated: 2025-12-15

---

## Tier 1: Quick Wins
*Low complexity, high polish value. Do in next session.*

| | Item | Complexity | Status | Notes |
|---|------|------------|--------|-------|
| [ ] | Reduce image upload to 10MB | 🟢 Easy | Not started | Single validation change |
| [ ] | Pet photos appear universally | 🟢 Easy | Not started | Audit where PetAvatar is/isn't used |
| [ ] | Care actions on pet detail page | 🟢 Easy | Not started | QuickActions component already exists |
| [ ] | About Page | 🟢 Easy | Not started | Static content page for legitimacy |
| [ ] | Terms of Service page | 🟢 Easy | Not started | Static content page. Required before launch. |
| [ ] | Privacy Policy page | 🟢 Easy | Not started | Static content page. Required with user data. |
| [ ] | Contact/feedback form | 🟢 Easy | Not started | Simple way for users to reach out. |
| [ ] | Error tracking (Sentry) | 🟢 Easy | Not started | Free tier. Know when things break. |

---

## Tier 2: Valuable MVP Enhancements
*Medium complexity, good demo value.*

| | Item | Complexity | Status | Notes |
|---|------|------------|--------|-------|
| [ ] | User profile photos | 🟡 Medium | Not started | Schema + upload UI + display in Hive/NavBar |
| [ ] | Comments/photos on care activities | 🟡 Medium | Not started | Notes field exists, add photos |
| [ ] | Adding medications data model | 🟡 Medium | Not started | Foundation for reminders |
| [ ] | "Time Since" display | 🟡 Medium | Not started | Calculated from care logs. Shows time since last walk/pee/poop/meal |
| [ ] | New user onboarding flow | 🟡 Medium | Not started | Multi-step setup, "who are you caring for" |
| [ ] | Password reset flow | 🟡 Medium | Not started | Check if NextAuth handles this or needs custom build. |
| [ ] | Weekly care summary | 🟡 Medium | Not started | "Murphy was walked 12 times this week" - email or in-app. |

---

## Tier 3: Feature Expansion
*Higher complexity, strategic value.*

| | Item | Complexity | Status | Notes |
|---|------|------------|--------|-------|
| [ ] | Additional pet types | 🟡 Medium | Not started | Bird, Fish, Small Animal, Reptile, Other |
| [ ] | Pet-type specific actions | 🟡 Medium | Not started | Depends on additional pet types. Filter actions by type |
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
| [ ] | Security audit | 🟡 Medium | Not started | Do before launch. Consider Snyk, OWASP ZAP |
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
| Pet profile enhancements | Dec 2024 | Description, specialNotes, characteristics |
| Testing infrastructure | Dec 2024 | 84 tests, Prisma mocks, coverage reporting |
| README rebrand | Dec 2024 | Full documentation update |
| Walk Timer feature | Dec 2024 | Duration tracking, bathroom events |
| CareCircle → Hive rebrand | Dec 2024 | Full codebase rename |
| Git branch cleanup | Dec 2024 | 60+ branches → main only |

---

## Notes

### Pet Types to Support (Future)
- Dog, Cat (current)
- Bird
- Fish
- Small Animal (rodents, rabbits, guinea pigs)
- Reptile
- Other

### Pet-Type Specific Actions (Future)
- **Dogs:** Walk, Potty Break
- **Cats:** Clean Litter Box, Indoor Play
- **Fish:** Tank Cleaning, Water Change
- **Birds:** Cage Cleaning
- **All:** Feed, Medicate, Accident/Incident

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
