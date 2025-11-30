// Server-side imports - this is a Server Component (no 'use client')
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UserProfileForm from "@/components/UserProfileForm";

// Custom type decouples page from Prisma's generated types
// Prevents breaking changes if Prisma schema differs between dev/CI/prod environments
type AccountUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null; // Optional fields use union with null for database compatibility
  address?: string | null;
};

// Server Component: runs on server only, can directly access database and session
// Benefits: no client JS bundle, instant data fetch, SEO-friendly
export default async function AccountPage() {
  // Fetch session server-side - more secure than client-side session access
  const session = await getServerSession(authOptions);

  // Auth guard: redirect unauthorized users before rendering anything
  // Using redirect() instead of returning null ensures proper HTTP status codes (307)
  // Checking all three values (!session, !user, !id) handles edge cases safely
  if (!session || !session.user || !session.user.id) {
    redirect("/api/auth/signin");
  }

  // Extract user from session for cleaner reference below
  const sessionUser = session.user;

  // Query database for full user details - session only contains minimal info (id, name, email)
  // Session tokens are kept small for performance, so we fetch full profile from DB
  // findUnique is more efficient than findFirst when querying by unique field (id)
  const dbUserRaw = await prisma.user.findUnique({
    where: { id: sessionUser.id },
  });

  // Fail fast if session exists but user doesn't - indicates data inconsistency
  // This should never happen in production, but throwing an error surfaces bugs early
  // Better to crash and fix the root cause than silently fail
  if (!dbUserRaw) {
    throw new Error("Authenticated user record not found in database.");
  }

  // Type assertion through custom AccountUser type provides stability across environments
  // Without this, minor Prisma schema changes (e.g., adding a field) could break TypeScript compilation
  // The 'as unknown as' pattern is a safe escape hatch when you control both types
  const dbUser = dbUserRaw as unknown as AccountUser;

  return (
    <main className="mx-auto max-w-2xl py-8 px-4">
      <h1 className="mb-4 text-3xl font-semibold">My profile</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {/* User-centric copy emphasizes control and transparency */}
        Review and update your contact details so this account stays current and actually usable.
      </p>
      {/*
        Client Component for interactivity (form handling)
        Pass server-fetched data as props - avoids client-side loading state
        Nullish coalescing (??) provides fallback for null/undefined database values
      */}
      <UserProfileForm
        initialName={dbUser.name ?? ""}
        initialEmail={dbUser.email ?? ""}
        initialPhone={dbUser.phone ?? ""}
        initialAddress={dbUser.address ?? ""}
      />
    </main>
  );
}