# Contributing to AttentHive

## Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run all checks (lint + typecheck + tests)
npm run check

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

---

## Git Workflow

### Branch Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| New feature | `feature/[name]` | `feature/user-profile-photos` |
| Maintenance | `chore/[name]` | `chore/about-page` |
| Bug fix | `fix/[name]` | `fix/image-upload-size` |
| Documentation | `docs/[name]` | `docs/api-reference` |

### Workflow

1. **Create branch from main:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b [type]/[descriptive-name]
   ```

2. **Work in phases, commit after each:**
   ```bash
   git add .
   git commit -m "[type]: [description]"
   ```

3. **Run checks before pushing:**
   ```bash
   npm run check
   ```

4. **Push and create PR:**
   ```bash
   git push -u origin [branch-name]
   ```

5. **After merge, clean up:**
   ```bash
   git checkout main
   git pull origin main
   git branch -d [branch-name]
   ```

---

## Commit Message Conventions

Format: `[type]: [description]`

| Type | Use For |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Maintenance, refactoring, dependencies |
| `docs` | Documentation changes |
| `test` | Adding or updating tests |
| `style` | Formatting, no code change |

Examples:
- `feat: Add user profile photo upload`
- `fix: Resolve image upload size validation`
- `chore: Update dependencies`
- `docs: Add API reference to README`
- `test: Add care-logs route tests`

For scoped changes: `[type]([scope]): [description]`
- `feat(api): Add hive invite endpoint`
- `fix(ui): Correct dark mode button contrast`
- `chore(schema): Add metadata field to CareLog`

---

## Quick-Start Patterns

### Simple Page (About, Terms, Privacy)
```
Branch: chore/[page-name]-page
Phases:
1. Create page component
2. Add to navigation
3. Verify and commit
```

### Schema Change Feature
```
Branch: feature/[name]
Phases:
1. Schema + migration
2. API routes
3. Components/UI
4. Integration
5. Tests
```

### Bug Fix
```
Branch: fix/[description]
Phases:
1. Identify root cause
2. Implement fix
3. Add regression test
```

---

## Code Style

- **No emojis in code** (allowed in UI copy)
- **No smart quotes** - use straight quotes only
- **Comments explain WHY**, not what
- **Run `npm run check`** before every PR

---

## Testing

- Tests live in `src/__tests__/`
- Prisma mocks available in `src/__tests__/utils/prisma-mock.ts`
- Test factories in `src/__tests__/utils/test-factories.ts`
- Aim for tests alongside new features

---

## Project Structure

```
src/
├── __tests__/          # Test files
├── app/                # Next.js App Router pages and API routes
│   ├── api/            # API endpoints
│   └── [page]/         # Page routes
├── components/         # React components
├── lib/                # Utilities and helpers
└── config/             # App configuration
```

---

## API Conventions

- **Flat routes preferred:** `/api/care-logs?recipientId=...`
- **Avoid nesting:** Not `/api/pets/[id]/care-logs`
- **Use Zod for validation**
- **Return consistent error shapes:** `{ error: string }`

---

## Documentation

Project documentation lives in `/docs/`:
- `backlog.md` - Feature backlog and implementation templates
- `attenthive_llm_context.md` - LLM context for AI-assisted development
- Other planning and reference docs

---

## Getting Help

- Check existing code for patterns
- Reference `/docs/backlog.md` for planned work
- Run `npm run check` early and often
