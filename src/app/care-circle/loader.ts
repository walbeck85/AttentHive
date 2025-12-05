// src/app/care-circle/loader.ts
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type CaregiverPet = {
  membershipId: string;
  id: string;
  name: string;
  type: string;
};

export type CaregiverGroup = {
  caregiverId: string;
  caregiverName: string | null;
  caregiverEmail: string;
  pets: CaregiverPet[];
};

export type PetYouCareFor = {
  id: string;
  name: string;
  type: string;
  ownerName: string;
};

export type OwnedPetSummary = {
  id: string;
  name: string;
};

export type CareCirclePageData = {
  user: {
    name: string | null;
    email: string;
  };
  ownedPets: OwnedPetSummary[];
  caregivers: CaregiverGroup[];
  petsYouCareFor: PetYouCareFor[];
};

// Central loader for the Care Circle page.
// I want this as the single source of truth so the page and any future callers
// are all reading from the same data shape instead of copy-pasting queries.
export async function loadCareCirclePageData(): Promise<CareCirclePageData | null> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return null;
  }

  const { email, name } = session.user;

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

  // 1) Pets you own – used for the lightweight footer section.
  // I keep this selection narrow so we don't haul more fields than the UI needs.
  const ownedPetsRecords = await prisma.recipient.findMany({
    where: { ownerId: dbUser.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
    },
  });

  const ownedPets: OwnedPetSummary[] = ownedPetsRecords.map((pet) => ({
    id: pet.id,
    name: pet.name,
  }));

  // 2) People caring for your pets (you are the owner).
  // This mirrors the original grouping logic so behavior stays identical.
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
      membershipId: membership.id,
      id: membership.recipient.id,
      name: membership.recipient.name,
      type: membership.recipient.type,
    });
  });

  const caregivers = Array.from(caregiversMap.values());

  // 3) Pets you care for (someone else is the owner).
  // Same semantics as the existing page so copy and counts stay in sync.
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

  const petsYouCareFor: PetYouCareFor[] = petsYouCareForMemberships.map(
    (membership) => ({
      id: membership.recipient.id,
      name: membership.recipient.name,
      type: membership.recipient.type,
      ownerName:
        membership.recipient.owner.name ??
        membership.recipient.owner.email ??
        "Pet owner",
    }),
  );

  return {
    user: {
      name: name ?? null,
      email,
    },
    ownedPets,
    caregivers,
    petsYouCareFor,
  };
}