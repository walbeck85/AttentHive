// src/app/account/loader.ts

import { getServerSession } from "next-auth";
import type { CareRecipient } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSharedPetsForUser } from "@/lib/hive";

// Keeping this type local to the account surface so we don't leak Prisma's
// entire User shape into the UI layer. This gives us a stable contract even
// if the schema grows more fields later.
export type AccountUser = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
};

// Shared pets are still just Recipients, but I add a lightweight access flag
// so the UI can style or filter them differently from owned pets without
// having to re-derive that state on the client.
export type SharedPet = CareRecipient & { _accessType: "shared" };

export type AccountPageData = {
  user: AccountUser;
  sharedPets: SharedPet[];
};

// Central data loader for the account page.
// I want this as the single source of truth so future callers (tests,
// server actions, or a mobile client) can reuse the same data shape
// instead of re-copying Prisma queries all over the place.
export async function loadAccountPageData(): Promise<AccountPageData | null> {
  const session = await getServerSession(authOptions);

  // Returning null here keeps the loader focused on "can I load data?"
  // and lets the page decide how to handle redirects and auth UX.
  if (!session || !session.user?.email) {
    return null;
  }

  const { email, name } = session.user;

  // Upsert keeps us aligned with the rest of the app: any authenticated
  // user that lands here gets a backing DB record, regardless of login
  // provider. That saves us from defensive null checks everywhere else.
  const dbUserRaw = await prisma.user.upsert({
    where: { email: email! },
    update: {},
    create: {
      email: email!,
      name: name ?? "",
      // This value is never used for auth; it just satisfies the schema
      // for OAuth users so we don't special-case them in queries.
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

  const user: AccountUser = {
    id: dbUserRaw.id,
    name: dbUserRaw.name,
    email: dbUserRaw.email,
    phone: dbUserRaw.phone,
    address: dbUserRaw.address,
  };

  // Reuse the shared-pets helper so the Account page stays in sync with
  // the dashboard and Care Circle semantics.
  const sharedMemberships = await getSharedPetsForUser(dbUserRaw.id);

  const sharedPets: SharedPet[] = sharedMemberships.map((membership) => ({
    ...membership.recipient,
    _accessType: "shared" as const,
  }));

  return {
    user,
    sharedPets,
  };
}