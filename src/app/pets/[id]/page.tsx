// src/app/pets/[id]/page.tsx

import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import PetDetailPage from "@/components/pets/PetDetailPage";
import { authOptions } from "@/lib/auth";
import { getHiveMembersForPet } from "@/lib/hive";
import { prisma } from "@/lib/prisma";
import type {
  CareCircleMember,
  CareLog,
  PetData,
} from "@/components/pets/petDetailTypes"; // Route shapes Prisma data into these view models so the client can stay dumb and predictable.

// Force this page to always be dynamically rendered and never cached,
// so pet updates (including characteristics) are immediately visible.
export const dynamic = 'force-dynamic';

type Params =
  | {
      params: { id: string };
    }
  | {
      params: Promise<{ id: string }>;
    };

export default async function PetDetailsPage({ params }: Params) {
  const resolvedParams = "then" in params ? await params : params;
  const petId = resolvedParams.id;

  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect("/api/auth/signin");
  }

  const dbUser = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {},
    create: {
      email: session.user.email,
      name: session.user.name ?? "",
      // This placeholder value is never used for login; it just satisfies the
      // non-null constraint on passwordHash for OAuth users.
      passwordHash: "google-oauth",
    },
  });

  // I pull back the full recipient record with care logs here so we can
  // reshape it once at the server boundary instead of inside the React tree.
  const dbPet = await prisma.recipient.findFirst({
    where: {
      id: petId,
    },
    include: {
      careLogs: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!dbPet) {
    notFound();
  }

  // Normalize care logs into the CareLog view model so the UI never has to
  // worry about Date objects or nullable user shapes.
  const careLogs: CareLog[] = dbPet.careLogs.map((log) => ({
    id: log.id,
    activityType: log.activityType as CareLog["activityType"],
    createdAt: log.createdAt.toISOString(),
    notes: log.notes,
    metadata: (log as unknown as { metadata?: CareLog["metadata"] }).metadata ?? null,
    user: { name: log.user?.name ?? null },
  }));

  // Normalize the pet record into PetData so the client gets a stable, string-
  // friendly shape regardless of how the Prisma schema evolves.
  const birthDateValue =
    dbPet.birthDate instanceof Date
      ? dbPet.birthDate.toISOString().slice(0, 10)
      : "";

  const petForView: PetData = {
    id: dbPet.id,
    name: dbPet.name,
    type: dbPet.type,
    // These fields are optional in practice, so I defensively default empty strings rather than
    // forcing the UI to branch on null every time it wants to render basic profile data.
    breed: dbPet.breed ?? "",
    gender: dbPet.gender ?? "",
    birthDate: birthDateValue,
    // Weight is stored as a number in the DB, but I coerce defensively in case legacy data is weird.
    weight: Number(dbPet.weight ?? 0),
    careLogs,
    ownerId: dbPet.ownerId,
    // Image URL and characteristics are optional, so we normalize them to the shapes the UI expects.
    imageUrl: dbPet.imageUrl ?? null,
    characteristics: Array.isArray(dbPet.characteristics)
      ? (dbPet.characteristics as PetData["characteristics"])
      : undefined,
    // Optional text fields for pet personality and caregiver notes
    description: dbPet.description ?? undefined,
    specialNotes: dbPet.specialNotes ?? undefined,
  };

  const careCircleMemberships = await getHiveMembersForPet(petId);

  // Determine whether the current user is allowed to see this pet.
  // Owners always have access. Non-owners must appear in the Care Circle
  // membership list (e.g. as CAREGIVER or VIEWER) for this specific pet.
  const isOwner = dbPet.ownerId === dbUser.id;

  const hasCareCircleAccess =
    isOwner ||
    careCircleMemberships.some((membership) => membership.userId === dbUser.id);

  if (!hasCareCircleAccess) {
    // If the user is neither the owner nor a member of the pet's Care Circle,
    // we fail with a 404 so we do not leak the existence of the pet ID.
    notFound();
  }

  const careCircleMembers: CareCircleMember[] = careCircleMemberships.map(
    (membership) => ({
      id: membership.id,
      userName: membership.user?.name ?? null,
      userEmail: membership.user?.email ?? "",
      role: membership.role,
    }),
  );

  return (
    <PetDetailPage
      pet={petForView}
      careCircleMembers={careCircleMembers}
      isOwner={isOwner}
    />
  );
}