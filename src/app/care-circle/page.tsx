import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CareCirclePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect("/login?callbackUrl=/care-circle");
  }

  const { email, name } = session.user;

  // Mirror the dashboard logic so we always have a DB user record
  const dbUser = await prisma.user.upsert({
    where: { email: email! },
    update: {},
    create: {
      email: email!,
      name: name ?? "",
      // Satisfies schema; not used for OAuth logins
      passwordHash: "google-oauth",
    },
  });

  // 1) Pets you own – used both for grouping and for the footer
  const ownedPets = await prisma.recipient.findMany({
    where: { ownerId: dbUser.id },
    orderBy: { createdAt: "asc" },
  });

  // 2) People caring for your pets (you are the owner)
  const caregiverMemberships = await prisma.careCircle.findMany({
    where: {
      recipient: { ownerId: dbUser.id },
      role: { in: ["CAREGIVER", "VIEWER"] },
    },
    include: {
      user: true,
      recipient: {
        include: {
          owner: true,
        },
      },
    },
    orderBy: { grantedAt: "asc" },
  });

  type CaregiverGroup = {
    caregiverId: string;
    caregiverName: string | null;
    caregiverEmail: string;
    pets: { id: string; name: string; type: string }[];
  };

  const caregiversMap = new Map<string, CaregiverGroup>();

  caregiverMemberships.forEach((membership) => {
    const key = membership.userId;

    let group = caregiversMap.get(key);
    if (!group) {
      group = {
        caregiverId: membership.userId,
        caregiverName: membership.user.name ?? null,
        caregiverEmail: membership.user.email,
        pets: [],
      };
      caregiversMap.set(key, group);
    }

    group.pets.push({
      id: membership.recipient.id,
      name: membership.recipient.name,
      type: membership.recipient.type,
    });
  });

  const caregivers = Array.from(caregiversMap.values());

  // 3) Pets you care for (someone else is the owner)
  const petsYouCareForMemberships = await prisma.careCircle.findMany({
    where: {
      userId: dbUser.id,
      role: { in: ["CAREGIVER", "VIEWER"] },
    },
    include: {
      recipient: {
        include: {
          owner: true,
        },
      },
    },
    orderBy: { grantedAt: "asc" },
  });

  const petsYouCareFor = petsYouCareForMemberships.map((membership) => ({
    id: membership.recipient.id,
    name: membership.recipient.name,
    type: membership.recipient.type,
    ownerName:
      membership.recipient.owner.name ??
      membership.recipient.owner.email ??
      "Pet owner",
  }));

  return (
    <main className="mx-auto max-w-5xl py-10 px-4">
      {/* Hero */}
      <section className="mb-8 rounded-lg border border-neutral-200 bg-amber-50 p-6">
        <p className="mb-2 text-xs tracking-[0.2em] text-neutral-500">
          CARE CIRCLE
        </p>
        <h1 className="mb-3 text-3xl font-semibold">Care Circle</h1>
        <p className="mb-2 text-sm text-neutral-700">
          See the people in your care circle and which pets they help with.
          Removing someone from a pet&apos;s Care Circle immediately revokes
          their access.
        </p>
        <p className="text-sm text-neutral-700">
          Signed in as {name ?? email}
        </p>
      </section>

      {/* 1. People caring for your pets */}
      <section className="mb-10">
        <h2 className="mb-2 text-xl font-semibold">
          People caring for your pets ({caregivers.length})
        </h2>
        <p className="mb-4 text-sm text-neutral-600">
          These people can view and log care for pets you own.
        </p>

        {caregivers.length === 0 ? (
          <p className="text-sm text-neutral-500">
            You haven&apos;t shared any pets yet. Open a pet, scroll to
            &quot;Shared with&quot;, and invite a caregiver by email.
          </p>
        ) : (
          <ul className="space-y-3">
            {caregivers.map((person) => (
              <li
                key={person.caregiverId}
                className="flex flex-col gap-3 rounded border border-neutral-200 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-medium text-neutral-900">
                    {person.caregiverName || person.caregiverEmail}
                  </div>
                  <div className="text-xs text-neutral-600">
                    {person.caregiverEmail}
                  </div>
                  <div className="mt-2 text-xs text-neutral-600">
                    Helps with{" "}
                    {person.pets.map((pet, index) => (
                      <span key={pet.id}>
                        {index > 0 && ", "}
                        {pet.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {person.pets.map((pet) => (
                    <Link
                      key={pet.id}
                      href={`/pets/${pet.id}`}
                      className="nav-pill text-xs"
                    >
                      View {pet.name}
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 2. Pets you care for */}
      <section className="mb-10">
        <h2 className="mb-2 text-xl font-semibold">
          Pets you care for ({petsYouCareFor.length})
        </h2>
        <p className="mb-4 text-sm text-neutral-600">
          Pets shared with you by friends, family, or housemates.
        </p>

        {petsYouCareFor.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No one has shared a pet with you yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {petsYouCareFor.map((pet) => (
              <li
                key={pet.id}
                className="flex items-center justify-between rounded border border-neutral-200 bg-white px-4 py-3 text-sm"
              >
                <div>
                  <div className="font-medium text-neutral-900">{pet.name}</div>
                  <div className="text-xs text-neutral-600">
                    Owner: {pet.ownerName}
                  </div>
                </div>
                <Link href={`/pets/${pet.id}`} className="nav-pill text-xs">
                  View pet
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3. Pets you own (lightweight) */}
      <section className="mb-4">
        <h2 className="mb-2 text-lg font-semibold">
          Pets you own ({ownedPets.length})
        </h2>
        <p className="mb-4 text-xs text-neutral-600">
          To change sharing for a specific pet, open its details and use the
          &quot;Shared with&quot; panel.
        </p>

        {ownedPets.length === 0 ? (
          <p className="text-sm text-neutral-500">
            You haven&apos;t added any pets yet. Use the dashboard to create
            your first pet.
          </p>
        ) : (
          <ul className="space-y-2">
            {ownedPets.map((pet) => (
              <li
                key={pet.id}
                className="flex items-center justify-between rounded border border-neutral-200 bg-white px-4 py-2 text-sm"
              >
                <div className="font-medium text-neutral-900">{pet.name}</div>
                <Link href={`/pets/${pet.id}`} className="nav-pill text-xs">
                  Manage sharing
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}