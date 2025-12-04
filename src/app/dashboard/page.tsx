import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSharedPetsForUser } from "@/lib/carecircle";
import PetList from "@/components/pets/PetList";
import AddPetForm from "@/components/pets/AddPetForm";

// Server-rendered dashboard. This page always runs on the server, so it can
// talk directly to Prisma and NextAuth without shipping any of that to the client.
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // If someone lands here without a valid session, push them through the auth flow.
  if (!session || !session.user || !session.user.id) {
    redirect("/api/auth/signin");
  }

  const sessionUser = session.user;

  // For consistency with the /api/pets route, we resolve a *database* user
  // based on email. This avoids the "session.id !== prisma.id" mismatch that
  // you’re currently seeing with pets being created but not showing up.
  if (!sessionUser.email) {
    // If this ever fires, something is badly wrong with auth config and we
    // want it to crash loudly instead of silently hiding pets.
    throw new Error(
      "Authenticated user is missing an email; cannot resolve DB user."
    );
  }

  const dbUser = await prisma.user.upsert({
    where: { email: sessionUser.email },
    update: {},
    create: {
      email: sessionUser.email,
      name: sessionUser.name ?? "",
      // This placeholder value is never used for login; it just satisfies the
      // non-null constraint on passwordHash for OAuth users.
      passwordHash: "google-oauth",
    },
  });

  // Now we query pets by the *database* user id, which is the same id that
  // /api/pets uses as ownerId when creating new recipients.
  const ownedPets = await prisma.recipient.findMany({
    where: {
      ownerId: dbUser.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Fetch pets shared with this user via CareCircle
  const sharedMemberships = await getSharedPetsForUser(dbUser.id);

  const ownedPetsWithFlag = ownedPets.map((pet) => ({
    ...pet,
    _accessType: "owner" as const,
  }));

  const sharedPetsWithFlag = sharedMemberships.map((membership) => ({
    ...membership.recipient,
    _accessType: "shared" as const,
  }));

  return (
    <main className="bg-mm-bg text-mm-ink">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
        {/* Overview card */}
        <section className="rounded-xl border border-mm-border bg-mm-surface px-5 py-6 shadow-sm">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-mm-muted">
            Dashboard
          </p>
          <h1 className="mb-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Manage your home
          </h1>
          <p className="mb-3 text-sm text-mm-muted">
            Keep track of pets, plants, family, and housemates you&apos;re caring for in one place.
          </p>
          <p className="text-sm text-mm-muted">
            {/* Prefer the user&apos;s name, but fall back to email so this never looks broken
                if their profile is half-filled. */}
            Welcome, {sessionUser.name ?? sessionUser.email ?? "friend"}
          </p>
        </section>

        {/* Add pet card */}
        <section className="rounded-xl border border-mm-border bg-mm-surface px-5 py-6 shadow-sm">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-mm-muted">
            Add new pet
          </h2>
          <p className="mb-4 text-sm text-mm-muted">
            Create a profile for another member of your household.
          </p>
          <AddPetForm />
        </section>

        {/* Owned pets */}
        <section className="rounded-xl border border-mm-border bg-mm-surface px-5 py-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold tracking-tight sm:text-xl">
            Pets you own
            <span className="ml-2 align-middle text-xs font-medium text-mm-muted">
              ({ownedPetsWithFlag.length})
            </span>
          </h2>
          <p className="mb-4 text-sm text-mm-muted">
            Pets you created and fully manage.
          </p>
          <PetList pets={ownedPetsWithFlag} />
        </section>

        {/* Shared pets */}
        <section className="mb-8 rounded-xl border border-mm-border bg-mm-surface px-5 py-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold tracking-tight sm:text-xl">
            Pets you care for
            <span className="ml-2 align-middle text-xs font-medium text-mm-muted">
              ({sharedPetsWithFlag.length})
            </span>
          </h2>
          <p className="mb-4 text-sm text-mm-muted">
            Pets shared with you as a caregiver.
          </p>
          <PetList pets={sharedPetsWithFlag} />
        </section>
      </div>
    </main>
  );
}