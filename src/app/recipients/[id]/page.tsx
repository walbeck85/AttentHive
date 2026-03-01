// src/app/recipients/[id]/page.tsx
//
// Universal detail page for any CareRecipient (pet, plant, or person).
// Follows the same server-loader pattern as the original /pets/[id] page
// but includes category-specific fields so one route handles all types.

import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import PetDetailPage from "@/components/pets/PetDetailPage";
import { authOptions } from "@/lib/auth";
import { getHiveMembersForPet } from "@/lib/hive";
import { prisma } from "@/lib/prisma";
import type {
  HiveMember,
  CareLog,
  PetData,
} from "@/components/pets/petDetailTypes";

export const dynamic = "force-dynamic";

type Params =
  | { params: { id: string } }
  | { params: Promise<{ id: string }> };

export default async function RecipientDetailPage({ params }: Params) {
  const resolvedParams = "then" in params ? await params : params;
  const recipientId = resolvedParams.id;

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
      passwordHash: "google-oauth",
    },
  });

  const dbRecipient = await prisma.careRecipient.findFirst({
    where: { id: recipientId },
    include: {
      careLogs: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!dbRecipient) {
    notFound();
  }

  // -- Authorization: owner or hive member --------------------------------
  const hiveMemberships = await getHiveMembersForPet(recipientId);

  const isOwner = dbRecipient.ownerId === dbUser.id;
  const currentUserMembership = hiveMemberships.find(
    (m) => m.userId === dbUser.id,
  );

  if (!isOwner && !currentUserMembership) {
    notFound();
  }

  const currentUserRole: "OWNER" | "CAREGIVER" | "VIEWER" = isOwner
    ? "OWNER"
    : (currentUserMembership?.role as "CAREGIVER" | "VIEWER") ?? "VIEWER";

  // -- Normalize care logs into view models --------------------------------
  const careLogs: CareLog[] = dbRecipient.careLogs.map((log) => ({
    id: log.id,
    activityType: log.activityType as CareLog["activityType"],
    createdAt: log.createdAt.toISOString(),
    notes: log.notes,
    metadata:
      (log as unknown as { metadata?: CareLog["metadata"] }).metadata ?? null,
    user: { id: log.userId, name: log.user?.name ?? null },
    photoUrl: log.photoUrl ?? null,
    editedAt: log.editedAt?.toISOString() ?? null,
  }));

  // -- Normalize recipient into the PetData view model ---------------------
  const birthDateValue =
    dbRecipient.birthDate instanceof Date
      ? dbRecipient.birthDate.toISOString().slice(0, 10)
      : "";

  const recipientForView: PetData = {
    id: dbRecipient.id,
    name: dbRecipient.name,
    category: dbRecipient.category as PetData["category"],
    type: dbRecipient.type,
    subtype: dbRecipient.subtype,
    breed: dbRecipient.breed ?? "",
    gender: dbRecipient.gender ?? "",
    birthDate: birthDateValue,
    weight: Number(dbRecipient.weight ?? 0),
    careLogs,
    ownerId: dbRecipient.ownerId,
    imageUrl: dbRecipient.imageUrl ?? null,
    characteristics: Array.isArray(dbRecipient.characteristics)
      ? (dbRecipient.characteristics as PetData["characteristics"])
      : undefined,
    description: dbRecipient.description ?? undefined,
    specialNotes: dbRecipient.specialNotes ?? undefined,
    // Plant-specific
    plantSpecies: dbRecipient.plantSpecies ?? null,
    sunlight: dbRecipient.sunlight ?? null,
    waterFrequency: dbRecipient.waterFrequency ?? null,
    // Person-specific
    relationship: dbRecipient.relationship ?? null,
  };

  const hiveMembers: HiveMember[] = hiveMemberships.map((m) => ({
    id: m.id,
    userName: m.user?.name ?? null,
    userEmail: m.user?.email ?? "",
    role: m.role,
  }));

  return (
    <PetDetailPage
      pet={recipientForView}
      hiveMembers={hiveMembers}
      isOwner={isOwner}
      currentUserRole={currentUserRole}
      currentUserId={dbUser.id}
    />
  );
}
