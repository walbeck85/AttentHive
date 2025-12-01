// src/app/account/page.tsx

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
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
};

// Server Component: runs on server only, can directly access database and session
// Benefits: no client JS bundle, instant data fetch, SEO-friendly
export default async function AccountPage() {
  // Fetch session server-side - more secure than client-side session access
  const session = await getServerSession(authOptions);

  // If there is no authenticated user, send them to login and return to /account afterwards
  if (!session || !session.user?.email) {
    redirect("/login?callbackUrl=/account");
  }

  const { email, name } = session.user;

  // Use email as the source of truth for matching users.
  // This keeps us aligned with other routes (like /api/care-logs) which
  // also "get or create" the user by email for both credentials and Google logins.
  const dbUserRaw = await prisma.user.upsert({
    where: { email: email! },
    update: {},
    create: {
      email: email!,
      name: name ?? "",
      // Satisfies Prisma schema; not actually used for OAuth logins
      passwordHash: "google-oauth",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
    },
  });

  // Normalize into a stable shape for the form component
  const dbUser: AccountUser = {
    id: dbUserRaw.id,
    name: dbUserRaw.name,
    email: dbUserRaw.email,
    phone: dbUserRaw.phone,
    address: dbUserRaw.address,
  };

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