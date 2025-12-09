# AttentHive – Pet Care Coordination Platform

**AttentHive** is a shared hub for coordinating pet care. It helps families, roommates, and pet‑sitting networks coordinate pet care without the anxious text-message loop, “Did anyone feed the dog?”

AttentHive gives you a shared source of truth for **who did what, when, and for which pet**.

Earlier iterations of this project used the working title **Mimamori** (見守り, “watching over” in Japanese); you may still see that name referenced in commit history or older documentation.

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

---

## Tech Stack

**Framework & Language**  
- [Next.js 16](https://nextjs.org/) (App Router)  
- TypeScript

**Data & Auth**  
- PostgreSQL, managed via [Prisma ORM](https://www.prisma.io/)  
- [NextAuth.js](https://next-auth.js.org/) using credentials provider + Google OAuth

**UI & Styling**  
- [MUI (Material UI)](https://mui.com/) + [Emotion](https://emotion.sh/docs/introduction)  
- Custom light/dark theme via `ThemeModeProvider`, `RootShell`, and MUI theme tokens  
- [Tailwind CSS](https://tailwindcss.com/) for legacy utilities and global styles

**Deployment & Infra**  
- [Vercel](https://vercel.com/) for hosting  
- [Supabase](https://supabase.com/) for hosted PostgreSQL

---

## Features

### Core (MVP)

- **User authentication**
  - Sign up, login, logout, session handling
- **Pet profiles (full CRUD)**  
  - Create, view, update, and delete pets with ownership validation
- **Care activity logging**  
  - Track feeding, walking, medication, bathroom, and accident events
- **Activity timeline**  
  - See who did what, when, for each pet
- **Mobile‑responsive UI**  
  - Designed to work cleanly on phones, tablets, and desktops
- **Shared pet access via CareCircle**  
  - Many‑to‑many relationship between users and pets for shared households
- **Role‑based permissions**  
  - Owner, caregiver, viewer roles with different capabilities
- **Activity filtering**  
  - Filter by type (feed, walk, medicate, etc.) and by date range

> Note: An initial version of CareCircle sharing, shared pet access, and activity filtering is now implemented and used throughout the dashboard and pet detail flows. 

---

## Project Structure

```bash
mimamori/
.
├── eslint.config.mjs              # ESLint configuration for code quality rules
├── jest.config.cjs                # Jest configuration for unit/integration tests
├── jest.setup.ts                  # Global Jest setup (RTL helpers, polyfills, mocks)
├── next-auth.d.ts                 # Type augmentation for NextAuth session and user objects
├── next-env.d.ts                  # Next.js environment type declarations
├── next.config.ts                 # Next.js runtime and build configuration
├── package-lock.json              # Locked dependency tree for reproducible installs
├── package.json                   # Project metadata, scripts, and dependencies
├── postcss.config.mjs             # PostCSS config (used by Tailwind and CSS pipeline)
├── prisma                         # Database schema, migrations, and seed scripts
│   ├── migrations                 # Auto-generated Prisma migrations
│   │   ├── 20251119083320_init
│   │   │   └── migration.sql      # Initial schema (users, pets, care logs, care circles)
│   │   ├── 20251119211856_remove_timestamp_field
│   │   │   └── migration.sql      # Cleanup/adjustment to timestamp fields
│   │   ├── 20251120115220_add_gender_to_pets
│   │   │   └── migration.sql      # Adds gender to Pet model
│   │   ├── 20251129194214_add_user_contact_fields
│   │   │   └── migration.sql      # Adds user contact fields for CareCircle invites
│   │   ├── 20251202204455_add_image_url_to_recipient
│   │   │   └── migration.sql      # Adds imageUrl for recipient/pet-like entities
│   │   ├── 20251204221553_add_pet_characteristics
│   │   │   └── migration.sql      # Adds structured pet characteristics (badges)
│   │   └── migration_lock.toml    # Prevents concurrent migration generation
│   ├── schema.prisma              # Main Prisma schema defining models and relations
│   └── seed.ts                    # Optional seed script for local/test data
├── public                         # Static assets served directly by Next.js
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── README.md                      # Project documentation (you are here)
├── scripts                        # Utility scripts for local development/health checks
│   ├── prisma-healthcheck.cjs     # Node script wrapper for Prisma healthcheck
│   ├── prisma-healthcheck.ts      # TypeScript version of DB healthcheck logic
│   └── run-healthcheck.mjs        # Orchestrator script to run healthcheck in CI/dev
├── src
│   ├── __tests__                  # Jest + React Testing Library test suites
│   │   ├── api                    # API route tests (server-side logic)
│   │   │   ├── pets-id-route.test.ts   # Tests for /api/pets/[id] endpoint
│   │   │   └── pets-route.test.ts      # Tests for /api/pets CRUD list/create endpoint
│   │   ├── auth                   # Auth screen tests
│   │   │   ├── LoginPage.test.tsx      # Login page rendering and validation tests
│   │   │   └── SignupPage.test.tsx     # Signup page rendering and validation tests
│   │   ├── care-circle            # Care Circle tests
│   │   │   └── CareCircleLinks.test.tsx   # Ensures Care Circle links navigate to pets
│   │   ├── Components             # Component-level unit tests
│   │   │   └── PetCard.test.tsx   # PetCard behavior, quick actions, and links
│   │   └── smoke.test.ts          # Basic smoke test to verify Jest wiring
│   ├── app                        # Next.js App Router entrypoints and route handlers
│   │   ├── (auth)                 # Auth route group (isolated layout for auth flows)
│   │   │   ├── login
│   │   │   │   ├── LoginPageClient.tsx   # Client component for login form + logic
│   │   │   │   └── page.tsx             # Server entrypoint for /login
│   │   │   └── signup
│   │   │       ├── page.tsx             # Server entrypoint for /signup
│   │   │       └── SignupPageClient.tsx # Client component for signup form + logic
│   │   ├── account
│   │   │   ├── loader.ts                # Server-side loader for account/user data
│   │   │   └── page.tsx                 # Account settings and profile UI
│   │   ├── api                          # Route handlers for server-side API endpoints
│   │   │   ├── auth
│   │   │   │   ├── [...nextauth]
│   │   │   │   │   └── route.ts         # NextAuth core handler (credentials + Google)
│   │   │   │   └── signup
│   │   │   │       └── route.ts         # Custom signup API (creates user + CareCircle)
│   │   │   ├── care-circles
│   │   │   │   ├── invite
│   │   │   │   │   └── route.ts         # Invite members to a CareCircle
│   │   │   │   ├── members
│   │   │   │   │   └── route.ts         # List/add/remove CareCircle members
│   │   │   │   └── shared-pets
│   │   │   │       └── route.ts         # Shared pet lookup for current user
│   │   │   ├── care-logs
│   │   │   │   └── route.ts             # Create/list care logs for pets
│   │   │   ├── pets
│   │   │   │   ├── [id]
│   │   │   │   │   ├── care-logs
│   │   │   │   │   │   └── route.ts     # Legacy nested care log route per pet
│   │   │   │   │   ├── photo
│   │   │   │   │   │   └── route.ts     # Upload/update pet photo URL
│   │   │   │   │   └── route.ts         # Get/update/delete a single pet
│   │   │   │   └── route.ts             # Create/list pets for the current user
│   │   │   └── user
│   │   │       └── profile
│   │   │           └── route.ts         # Update and fetch user profile fields
│   │   ├── care-circle
│   │   │   ├── loader.ts                # Server-side loader for CareCircle dashboard
│   │   │   └── page.tsx                 # CareCircle page shell and hero layout
│   │   ├── dashboard
│   │   │   └── page.tsx                 # Pet dashboard (grid of PetCards + quick actions)
│   │   ├── dev
│   │   │   └── mui-theme-check
│   │   │       └── page.tsx             # Internal dev page for verifying MUI theme tokens
│   │   ├── globals.css                  # Global CSS, Tailwind layers, CSS variables
│   │   ├── layout.tsx                   # Root layout; wires Providers, RootShell, NavBar
│   │   ├── page.tsx                     # Landing page (marketing/redirect into app)
│   │   ├── pets
│   │   │   └── [id]
│   │   │       ├── activity
│   │   │       │   └── page.tsx         # Full activity timeline for a single pet
│   │   │       └── page.tsx             # Pet detail page built on PetDetailShell
│   │   └── providers.tsx                # Global providers (SessionProvider, ThemeMode, etc.)
│   ├── components                       # Reusable UI components and app shell pieces
│   │   ├── auth
│   │   │   └── AuthShell.tsx            # Shared layout shell for login/signup screens
│   │   ├── MuiCacheProvider.tsx         # Emotion/MUI cache provider to stabilize SSR hydration
│   │   ├── NavBar.tsx                   # Global AppBar + Drawer navigation component
│   │   ├── pets
│   │   │   ├── AddPetForm.tsx           # Controlled form for creating new pets
│   │   │   ├── BreedSelect.tsx          # Reusable select component for pet breeds
│   │   │   ├── CareCirclePanel.tsx      # "Shared with" card for CareCircle members
│   │   │   ├── ConfirmActionModal.tsx   # Confirm dialog for destructive pet/care actions
│   │   │   ├── PetActivityList.tsx      # Small recent-activity list component
│   │   │   ├── petActivityUtils.ts      # Formatting/helpers for care log display
│   │   │   ├── PetAvatar.tsx            # Avatar renderer for pets (photo or initials)
│   │   │   ├── PetCard.tsx              # Summary card with quick actions for each pet
│   │   │   ├── PetDetailActivitySection.tsx # Activity section on pet detail page
│   │   │   ├── PetDetailCareCircleSection.tsx # CareCircle section on pet detail page
│   │   │   ├── PetDetailHeaderSection.tsx # Hero header card (avatar + identity + badges)
│   │   │   ├── PetDetailPage.tsx        # Top-level composition for pet detail UI
│   │   │   ├── PetDetailProfileSection.tsx # Editable profile fields for a pet
│   │   │   ├── PetDetailShell.tsx       # Layout shell used by /pets/[id] route
│   │   │   ├── petDetailTypes.ts        # Shared TypeScript types for pet detail views
│   │   │   ├── PetHeaderCard.tsx        # Reusable header card for pet identity summary
│   │   │   ├── PetList.tsx              # Responsive grid list of PetCards
│   │   │   ├── PetPhotoProfileCard.tsx  # Card showing pet profile photo + metadata
│   │   │   ├── PetPhotoUpload.tsx       # Controlled uploader for pet photos
│   │   │   ├── QuickActions.tsx         # Grid of thumb-friendly care quick actions
│   │   │   └── RemoveCaregiverButton.tsx # Button to remove a caregiver from CareCircle
│   │   ├── RootShell.tsx                # App shell that shifts content with the Drawer
│   │   ├── SessionProvider.tsx          # Wrapper around NextAuth SessionProvider
│   │   ├── ThemeModeProvider.tsx        # Light/dark mode state and MUI theme wiring
│   │   ├── ui
│   │   │   └── Button.tsx               # Shared button component matching brand styles
│   │   └── UserProfileForm.tsx          # Form for editing user profile/contact info
│   ├── lib
│   │   ├── auth-client.ts               # Client-side helpers for NextAuth sign-in/out
│   │   ├── auth.ts                      # NextAuth server configuration and adapters
│   │   ├── authRedirect.ts              # Safe callback URL handling to prevent open redirects
│   │   ├── breeds.ts                    # Static breed list and helpers for BreedSelect
│   │   ├── carecircle.ts                # CareCircle utility functions and role helpers
│   │   ├── petCharacteristics.ts        # Characteristic definitions and mapping utilities
│   │   ├── prisma.ts                    # Prisma client singleton (avoids hot-reload issues)
│   │   └── supabase-server.ts           # Helper for connecting to Supabase-hosted Postgres
│   ├── test-utils.tsx                   # Custom RTL render helpers and providers for tests
│   └── theme.ts                         # Central MUI theme definition (colors, typography, cards)
├── tailwind.config.ts                   # Tailwind configuration (legacy/global utility usage)
├── tsconfig.json                        # TypeScript compiler options
└── tsconfig.tsbuildinfo                 # Incremental TS build cache (generated)
```

---

## Architecture & UI Overview

Over the course of the capstone, AttentHive’s internals evolved from a simple “pages + components” layout into a more opinionated app shell with consistent patterns for data loading, navigation, and visual design.

At a high level, the app now follows these core ideas:

- **App shell & theming**
  - `RootShell` wraps all authenticated pages, handling the global MUI layout, a sticky `AppBar`, and a responsive slide-out drawer.
  - `ThemeModeProvider` owns light/dark mode state and wires it into the MUI theme so cards, typography, and surfaces stay readable in both themes.
  - Hydration issues between Emotion/MUI on the server and client were resolved by fixing timezone-sensitive formatting (using UTC), stabilizing `useMediaQuery` usage, and applying `suppressHydrationWarning` only at the top shell where Emotion injects styles.

- **Auth flows**
  - Login and signup live under the `(auth)` route group and are implemented as server wrappers with client components (`LoginPageClient`, `SignupPageClient`) to satisfy Next.js 16 `useSearchParams` + `Suspense` requirements.
  - Both screens share a dedicated `AuthShell` for consistent spacing, copy, and layout.
  - Credentials auth and Google OAuth both normalize `callbackUrl` via a shared `getSafeCallbackUrl` helper to prevent open redirects and ensure deep-linking (e.g. `/pets/[id]`, `/care-circle`) remains stable.

- **Navigation & layout**
  - The global `NavBar` is now a MUI `AppBar` + `Drawer` combo that behaves the same on mobile and desktop.
  - The drawer pushes the page content horizontally (managed by `RootShell`) so users keep context while navigating.
  - Auth actions are available directly in the drawer: logged-out users see “Log in” / “Sign up”; logged-in users see “Log out.”

- **Domain pages**
  - **Dashboard** shows a grid of `PetCard` components using a responsive CSS grid (`PetList`). Cards are now rectangular, with unified border radius, overflow rules, and thumb-friendly quick actions.
  - **Pet detail** (`/pets/[id]`) uses `PetDetailShell` and is visually aligned with the Care Circle hero pattern: a single hero card with avatar, identity metadata, badges, and recent activity, followed by standard MUI cards for activity and sharing.
  - **Care Circle** has its own loader and page shell, mirroring the same hero + detail card layout used for pets.

- **Design system & cards**
  - MUI `Card` is the canonical card primitive across the app, with geometry (border radius, overflow, borders) defined in the theme instead of per-component overrides.
  - Legacy Tailwind-based “stadium” cards were removed in favor of rectangular cards with predictable behavior on all breakpoints.
  - Shared patterns for chips, buttons, and typography ensure dark-mode safety and consistent spacing.

- **Testing**
  - Jest/RTL tests cover core flows: smoke tests, auth screens, pet API routes, Care Circle links, and `PetCard` behavior.
  - All refactors keep `npm run check` (lint, typecheck, test) green as a precondition for merging.

This architecture makes it easier to introduce new “care entities” (people, plants, places) while reusing the same hero card, detail shell, and CareCircle patterns that now power the pet experience.

---

## Visuals

Loom Video Recording: https://www.loom.com/share/2f9e712bbaa04bffa2f44a4734fd0198 

---


## Getting Started

### Local Setup (TL;DR)

If you already have Node and a PostgreSQL database (or Supabase) ready, this is the fastest way to get AttentHive running locally:

```bash
# 1. Clone the repo and install dependencies
git clone https://github.com/walbeck85/mimamori.git
cd mimamori
npm install

# 2. Copy env template and fill in values
cp .env.example .env
# Edit .env and set DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, and any Supabase creds

# 3. Run Prisma migrations (creates tables in your database)
npx prisma generate
npx prisma migrate dev --name init

# 4. (Optional) Seed with test data
npx prisma db seed

# 5. Start the dev server
npm run dev
# App will be available at http://localhost:3000
```

If you are new to any of the tools in this stack (Next.js, Prisma, Supabase, etc.), the sections below expand on each step in more detail.

### Requirements

Before you run AttentHive locally, you will need:

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

You can run AttentHive with either a local PostgreSQL instance or a hosted Supabase database.

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

Formal support channels (email, chat, etc.) are still to be determined for early versions of AttentHive.

---

## Roadmap

Planned enhancements include:

- CareCircle sharing with role-based permissions
- Richer filtering and reporting on activity history
- Reminders/notifications for overdue care tasks
- Dashboard metrics for households with multiple pets
- Improved onboarding for shared households and pet-sitters

If you have ideas that would make AttentHive more useful for your household or care network, please open an issue or submit a PR.

---
