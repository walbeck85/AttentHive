"use client";

import { Recipient } from "@prisma/client";
import PetCard, { PetData } from "./PetCard";

type PetListProps = {
  // The dashboard hands us raw Prisma Recipient records; we keep this type tight so any
  // future query drift shows up here instead of randomly in the UI.
  pets?: Recipient[] | null;
  // Optional name of the current user so cards can personalize activity descriptions.
  currentUserName?: string | null;
};

export default function PetList({ pets, currentUserName }: PetListProps) {
  // Treat undefined, null, and empty arrays the same so the UI does not show a half-broken state.
  if (!pets || pets.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No pets added yet. Use the Add New Pet form above to get started.
      </p>
    );
  }

  // Map Prisma's Recipient shape into the more flexible PetData shape that the card expects.
  // Doing the mapping here keeps the rest of the UI agnostic about where pets came from.
  const mappedPets: PetData[] = pets.map((pet) => ({
    id: pet.id,
    name: pet.name,
    type: pet.type,
    breed: pet.breed,
    gender: pet.gender,
    birthDate: pet.birthDate,
    weight: pet.weight,
    specialNeeds: pet.specialNeeds ?? null,
    ownerId: pet.ownerId,
    createdAt: pet.createdAt,
    updatedAt: pet.updatedAt,
    // The dashboard query is not loading logs yet; starting with an empty array avoids null checks everywhere else.
    careLogs: [],
  }));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {mappedPets.map((pet) => (
        <PetCard
          key={pet.id}
          pet={pet}
          currentUserName={currentUserName}
        />
      ))}
    </div>
  );
}