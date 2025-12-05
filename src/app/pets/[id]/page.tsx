// src/app/pets/[id]/page.tsx

import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import PetDetailPage from "@/components/pets/PetDetailPage";
import { authOptions } from "@/lib/auth";
import { getCareCircleMembersForPet } from "@/lib/carecircle";
import { prisma } from "@/lib/prisma";
import type { CareCircleMember } from "@/components/pets/petDetailTypes";

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

  const pet = await prisma.recipient.findFirst({
    where: {
      id: petId,
      ownerId: dbUser.id,
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

  if (!pet) {
    notFound();
  }

  const careLogs = pet.careLogs;

  const careCircleMemberships = await getCareCircleMembersForPet(petId);
  const careCircleMembers: CareCircleMember[] = careCircleMemberships.map((membership) => ({
    id: membership.id,
    userName: membership.user?.name ?? null,
    userEmail: membership.user?.email ?? "",
    role: membership.role,
  }));

  const isOwner = pet.ownerId === dbUser.id;

  return (
    <PetDetailPage
      pet={pet}
      careLogs={careLogs}
      careCircleMembers={careCircleMembers}
      isOwner={isOwner}
    />
  );
}
