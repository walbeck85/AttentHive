# Mimamori - Pet Care Coordination Platform

見守り (Mimamori) means "watching over" in Japanese. This app helps families, roommates, and pet-sitting networks coordinate pet care without the anxious texting loop.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: NextAuth.js (credentials provider)
- **Styling**: TailwindCSS + shadcn/ui
- **Deployment**: Vercel + Supabase

## Features

### MVP (Core Features)
- ✅ User authentication (signup, login, logout, sessions)
- ✅ Pet profiles (full CRUD with ownership validation)
- ✅ Care activity logging (feed, walk, medicate, bathroom, accident)
- ✅ Activity timeline (who did what when)
- ✅ Mobile-responsive UI

### Stretch Goals
- 🔄 Shared pet access via CareCircle (many-to-many relationship)
- 🔄 Role-based permissions (owner, caregiver, viewer)
- 🔄 Activity filtering by type and date

## Project Structure

```
mimamori/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Test data seeder
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth.js endpoints
│   │   │   ├── pets/          # Pet CRUD
│   │   │   └── carelogs/      # Activity logging
│   │   ├── (auth)/            # Auth-related pages
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── pets/              # Pet management pages
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   └── ...                # Custom components
│   ├── lib/                   # Utility functions
│   │   ├── prisma.ts          # Prisma client singleton
│   │   └── auth.ts            # NextAuth configuration
│   └── types/                 # TypeScript types
├── public/                    # Static assets
├── .env                       # Environment variables (not committed)
├── .env.example               # Template for environment setup
└── package.json
```

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- PostgreSQL installed (or Supabase account)
- Git installed

### 1. Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd mimamori

# Install dependencies
npm install
```

### 2. Database Setup

#### Option A: Local PostgreSQL

```bash
# Start PostgreSQL
# (Installation via Homebrew: brew install postgresql)

# Create database
psql -d postgres
CREATE DATABASE mimamori_db;
\q
```

#### Option B: Supabase (Recommended for Deployment)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the connection string from Settings → Database
4. Use it in your `.env` file (format: `postgresql://postgres:[password]@[host]:5432/postgres`)

### 3. Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your values:
# - DATABASE_URL (from step 2)
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
```

### 4. Prisma Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate dev --name init

# (Optional) Seed test data
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev

# App will be available at http://localhost:3000
```

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
```

## Database Schema

See `prisma/schema.prisma` for the complete data model.

**Key Relationships:**
- User → Recipient (one-to-many, ownership)
- User → CareLog (one-to-many, who logged activities)
- Recipient → CareLog (one-to-many, activity history)
- User ↔ Recipient (many-to-many via CareCircle, shared access)

## API Routes

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Check current session

### Pets
- `GET /api/pets` - List user's pets (owned + shared)
- `POST /api/pets` - Create new pet
- `GET /api/pets/[id]` - Get pet details
- `PATCH /api/pets/[id]` - Update pet (owner only)
- `DELETE /api/pets/[id]` - Delete pet (owner only)

### Care Logs
- `GET /api/carelogs?recipientId=[id]` - Get activity logs for a pet
- `POST /api/carelogs` - Log a new activity
- `DELETE /api/carelogs/[id]` - Delete activity log

### Care Circles (Stretch)
- `GET /api/carecircles?recipientId=[id]` - Get shared users for a pet
- `POST /api/carecircles` - Share pet with another user
- `DELETE /api/carecircles/[id]` - Revoke access

## Deployment

### Vercel + Supabase

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` (from Supabase)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Vercel URL)
4. Deploy!

## Project Instructions
### Testing Authenticated API Routes

When testing routes that require authentication:
- ❌ **curl won't work** - it doesn't have login cookies
- ✅ **Browser console works** - it has the session cookies
- ✅ **Thunder Client can work** - if you configure cookies
- ✅ **UI forms work** - they automatically send cookies

For quick testing during development, use the browser console with fetch().

## Database Migration Issues

When adding required fields to models with existing data:
- Either delete test data first, OR
- Use `npx prisma migrate reset` in development to start fresh
- In production, you'd need to handle this differently (add as optional, 
  backfill data, then make required)

