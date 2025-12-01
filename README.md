# Mimamori – Pet Care Coordination Platform

**Mimamori** (見守り) loosely means “watching over” in Japanese. This app helps families, roommates, and pet‑sitting networks coordinate pet care without the anxious text-message loop, “Did anyone feed the dog?”

Mimamori gives you a shared source of truth for **who did what, when, and for which pet**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Visuals](#visuals)
- [Getting Started](#getting-started)
  - [Requirements](#requirements)
  - [Clone & Install](#clone--install)
  - [Database Setup](#database-setup)
  - [Environment Variables](#environment-variables)
  - [Prisma & Database Migrations](#prisma--database-migrations)
  - [Run the App](#run-the-app)
- [Usage](#usage)
  - [Authentication](#authentication)
  - [Managing Pets](#managing-pets)
  - [Logging Care Activities](#logging-care-activities)
  - [Viewing Activity Timelines](#viewing-activity-timelines)
- [Development Commands](#development-commands)
- [API Reference](#api-reference)
  - [Authentication Routes](#authentication-routes)
  - [Pet Routes](#pet-routes)
  - [Care Log Routes](#care-log-routes)
  - [Care Circle Routes (Stretch)](#care-circle-routes-stretch)
- [Development Notes](#development-notes)
  - [Testing Authenticated API Routes](#testing-authenticated-api-routes)
  - [Database Migration Issues](#database-migration-issues)
- [Support](#support)
- [Roadmap](#roadmap)
- [License](#license)

---

## Tech Stack

**Framework & Language**  
- [Next.js 14](https://nextjs.org/) (App Router)  
- TypeScript

**Data & Auth**  
- PostgreSQL, managed via [Prisma ORM](https://www.prisma.io/)  
- [NextAuth.js](https://next-auth.js.org/) using credentials provider

**UI & Styling**  
- [Tailwind CSS](https://tailwindcss.com/)  
- [shadcn/ui](https://ui.shadcn.com/)

**Deployment & Infra**  
- [Vercel](https://vercel.com/) for hosting  
- [Supabase](https://supabase.com/) for hosted PostgreSQL

---

## Features

### Core (MVP)

- ✅ **User authentication**
  - Sign up, login, logout, session handling
- ✅ **Pet profiles (full CRUD)**  
  - Create, view, update, and delete pets with ownership validation
- ✅ **Care activity logging**  
  - Track feeding, walking, medication, bathroom, and accident events
- ✅ **Activity timeline**  
  - See who did what, when, for each pet
- ✅ **Mobile‑responsive UI**  
  - Designed to work cleanly on phones, tablets, and desktops

### Stretch Goals (Planned / In Progress)

- 🔄 **Shared pet access via CareCircle**  
  - Many‑to‑many relationship between users and pets for shared households
- 🔄 **Role‑based permissions**  
  - Owner, caregiver, viewer roles with different capabilities
- 🔄 **Activity filtering**  
  - Filter by type (feed, walk, medicate, etc.) and by date range
- 🔄 **Reminders & notifications**  
  - Optional reminders for overdue walks, meds, or feedings

---

## Project Structure

```bash
mimamori/
.
├── eslint.config.mjs              # ESLint configuration for code quality
├── jest.config.cjs                # Jest config for testing
├── jest.setup.ts                  # Global test setup (mocks, env, etc.)
├── next-auth.d.ts                 # Type augmentation for NextAuth session/user
├── next-env.d.ts                  # Next.js environment types
├── next.config.ts                 # Next.js build/runtime configuration
├── package-lock.json              # Locked dependency tree
├── package.json                   # Project dependencies and scripts
├── postcss.config.mjs             # PostCSS configuration (used by Tailwind)
├── prisma                         # Database schema, migrations, and seed scripts
│   ├── migrations                 # Auto‑generated Prisma migrations
│   │   ├── 20251119083320_init
│   │   │   └── migration.sql      # Initial schema (users, pets, care logs)
│   │   ├── 20251119211856_remove_timestamp_field
│   │   │   └── migration.sql
│   │   ├── 20251120115220_add_gender_to_pets
│   │   │   └── migration.sql
│   │   ├── 20251129194214_add_user_contact_fields
│   │   │   └── migration.sql
│   │   └── migration_lock.toml    # Prevents concurrent generation of migrations
│   ├── schema.prisma              # Main database schema defining models
│   └── seed.ts                    # Optional seed script for test data
├── public                         # Static files served as-is   
├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── README.md                      # Project documentation
├── src
│   ├── __tests__                  # Jest test suite
│   │   └── smoke.test.ts
│   ├── app                        # Next.js App Router pages and routing logic
│   │   ├── (auth)                 # Auth routes grouped as a segment
│   │   │   ├── login
│   │   │   │   └── page.tsx       # Login screen
│   │   │   └── signup
│   │   │       └── page.tsx       # Signup screen
│   │   ├── account
│   │   │   └── page.tsx           # User profile / account settings
│   │   ├── api                    # Server-side API route handlers
│   │   │   ├── auth
│   │   │   │   ├── [...nextauth]
│   │   │   │   │   └── route.ts   # NextAuth core handler
│   │   │   │   └── signup
│   │   │   │       └── route.ts   # Custom signup endpoint
│   │   │   ├── care-logs
│   │   │   │   └── route.ts       # Care log creation and retrieval
│   │   │   ├── pets
│   │   │   │   ├── [id]
│   │   │   │   │   ├── care-logs
│   │   │   │   │   │   └── route.ts   # Nested care-log endpoint (legacy path)
│   │   │   │   │   └── route.ts       # Pet detail / update / delete
│   │   │   │   └── route.ts           # Create/list pets
│   │   │   └── user
│   │   │       └── profile
│   │   │           └── route.ts
│   │   ├── dashboard
│   │   │   └── page.tsx               # Dashboard landing page for logged‑in users
│   │   ├── globals.css                # Global CSS (Tailwind layers, CSS vars, resets)
│   │   ├── layout.tsx                 # Root layout shared across all pages
│   │   ├── page.tsx                   # Landing page (marketing or login redirect)
│   │   ├── pets
│   │   │   └── [id]
│   │   │       ├── activity
│   │   │       │   └── page.tsx       # Activity timeline UI for a specific pet
│   │   │       └── page.tsx           # Pet detail page
│   │   └── providers.tsx              # Global providers (auth, theme, etc.)
│   ├── components                     # Reusable UI components
│   │   ├── NavBar.tsx                 # Navigation bar shown on authenticated pages
│   │   ├── pets
│   │   │   ├── AddPetForm.tsx         # Form for creating new pets
│   │   │   ├── ConfirmActionModal.tsx # Shared modal for confirming destructive actions
│   │   │   ├── PetCard.tsx            # Pet summary card (used in lists)
│   │   │   ├── PetList.tsx            # Renders the full list of a user’s pets
│   │   │   └── QuickActions.tsx       # One‑click logging for feed/walk/medication
│   │   ├── SessionProvider.tsx        # Wraps NextAuth session provider
│   │   ├── ui
│   │   │   └── Button.tsx             # Custom button component (shadcn-based)
│   │   └── UserProfileForm.tsx        # Editable user profile fields component
│   └── lib
│       ├── auth-client.ts             # Client-side NextAuth helpers
│       ├── auth.ts                    # NextAuth server-side config
│       └── prisma.ts                  # Prisma client singleton (prevents hot-reload issues)
├── tailwind.config.ts                 # Tailwind theme configuration
├── tsconfig.json                      # TypeScript compiler config
└── tsconfig.tsbuildinfo               # Incremental build cache
```

---

## Visuals

Screenshots and demo media will live here.

- `TBD` – Dashboard / pets list view  
- `TBD` – Pet detail with activity timeline  
- `TBD` – Mobile view of logging a care activity

Once captured, you can add something like:

```md
![Mimamori dashboard](./public/readme/dashboard.png)
```

---

## Getting Started

### Requirements

Before you run Mimamori locally, you will need:

- **Node.js 18+**
- **npm** (bundled with Node)  
- **PostgreSQL** (local) _or_ a **Supabase** project
- **Git**

> If you are new to any of these, install them one at a time and confirm each is working before moving on.

---

### Clone & Install

```bash
# Clone the repository
git clone <https://github.com/walbeck85/mimamori>
cd mimamori

# Install dependencies
npm install
```

---

### Database Setup

You can run Mimamori with either a local PostgreSQL instance or a hosted Supabase database.

#### Option A: Local PostgreSQL

```bash
# Start PostgreSQL
# (Example: install via Homebrew)
brew install postgresql

# Create the database
psql -d postgres
CREATE DATABASE mimamori_db;
\q
```

Set `DATABASE_URL` in `.env` to point to this database.

#### Option B: Supabase (Recommended for Deployment)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the connection string from **Settings → Database**
4. Use it in your `.env` file (format similar to):

   ```bash
   postgresql://postgres:[password]@[host]:5432/postgres
   ```

---

### Environment Variables

Copy the example file and fill in the values for your environment.

```bash
cp .env.example .env
```

In `.env`, set:

- `DATABASE_URL` – from your local PostgreSQL or Supabase setup
- `NEXTAUTH_SECRET` – generate one with:

  ```bash
  openssl rand -base64 32
  ```

- `NEXTAUTH_URL` – for deployment (e.g. your Vercel URL)

> Keep `.env` out of version control. Only `.env.example` is committed to document what is required.

---

### Prisma & Database Migrations

Generate the Prisma client and apply migrations:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate dev --name init

# (Optional) Seed test data
npx prisma db seed
```

> In development, if you want to reset and re-apply migrations with a clean database, see the [Database Migration Issues](#database-migration-issues) section.

---

### Run the App

```bash
npm run dev
```

The app will be available at:  
`http://localhost:3000`

---

## Usage

### Authentication

1. Visit `http://localhost:3000`
2. Sign up for a new account (email + password)
3. Log in to access your dashboard

Sessions are handled via NextAuth; once logged in, you will see your pets and relevant navigation. Unauthenticated users are redirected away from protected pages.

### Managing Pets

From the pets section you can:

- Create a new pet profile
- View the list of your pets
- Edit an existing pet’s details
- Delete a pet you own

Ownership validation ensures that only the user who created a pet (or shared users, once CareCircle is implemented) can modify it.

### Logging Care Activities

For each pet, you can log activities such as:

- Feeding
- Walking
- Medication
- Bathroom events
- Accidents

You can use either:

- **Quick actions** (one-click logging for common activities), or  
- A **detail form** where you can add notes or adjust timestamps

Each log is associated with both the pet and the user who performed the action.

### Viewing Activity Timelines

Each pet has an activity timeline showing:

- Recent events (most recent first)
- The user who logged the event
- The type of activity and timestamp

In future iterations, you will also be able to filter by activity type and date range to quickly answer questions like “When was the last walk?”

---

## Development Commands

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run Prisma Studio (database GUI)
npx prisma studio

# Create a new migration
npx prisma migrate dev --name <migration_name>

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Format code
npm run format

# Lint code
npm run lint

# Run tests (if configured)
npm test
```

> Before opening a PR, it is a good idea to at least run:

> ```bash
> npm run lint
> npm test
> ```

---

## API Reference

### Authentication Routes

- `POST /api/auth/signup` – Create a new user account
- `POST /api/auth/signin` – Login
- `POST /api/auth/signout` – Logout
- `GET /api/auth/session` – Check current session

### Pet Routes

- `GET /api/pets` – List user’s pets (owned + shared)
- `POST /api/pets` – Create a new pet
- `GET /api/pets/[id]` – Get pet details
- `PATCH /api/pets/[id]` – Update pet (owner only)
- `DELETE /api/pets/[id]` – Delete pet (owner only)

### Care Log Routes

- `GET /api/carelogs?recipientId=[id]` – Get activity logs for a pet
- `POST /api/carelogs` – Log a new activity
- `DELETE /api/carelogs/[id]` – Delete an activity log

### Care Circle Routes (Stretch)

These routes are part of the planned **CareCircle** feature and may not be fully implemented yet:

- `GET /api/carecircles?recipientId=[id]` – Get shared users for a pet
- `POST /api/carecircles` – Share a pet with another user
- `DELETE /api/carecircles/[id]` – Revoke access

---

## Development Notes

### Testing Authenticated API Routes

When testing routes that require authentication:

- ❌ `curl` **won’t work by default** – it does not carry browser session cookies
- ✅ **Browser console works** – it uses the same cookies as your logged-in session
- ✅ **Thunder Client / Postman can work** – if you copy cookies or configure auth
- ✅ **UI forms work** – they automatically send cookies with requests

For quick testing during development, use the browser console with `fetch()` while logged in.

### Database Migration Issues

When adding required fields to models with existing data in development:

- Either delete test data first, **or**
- Use:

  ```bash
  npx prisma migrate reset
  ```

  to reset the database (this **deletes all data** and re-applies migrations).

In production, you would handle this more carefully by:

1. Adding the field as optional,
2. Backfilling data, and
3. Then making the field required in a follow-up migration.

---

## Support

If you run into issues or have feature requests:

- Open an issue in the GitHub repository
- Describe the problem, steps to reproduce, and your environment (OS, Node version, database choice)

Formal support channels (email, chat, etc.) are still to be determined for early versions of Mimamori.

---

## Roadmap

Planned enhancements include:

- CareCircle sharing with role-based permissions
- Richer filtering and reporting on activity history
- Reminders/notifications for overdue care tasks
- Dashboard metrics for households with multiple pets
- Improved onboarding for shared households and pet-sitters

If you have ideas that would make Mimamori more useful for your household or care network, please open an issue or submit a PR.

---

## License

License terms are still being finalized. Until then, treat this as a closed-source project intended for personal and educational use only.
