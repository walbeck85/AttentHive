// src/lib/petCharacteristics.ts
// Centralized list of flags that surface on the recipient/pet card as badges.
// Keeping this here means:
// - The UI and server share a single source of truth.
// - We can evolve the list in one place without touching the DB schema.

export const PET_CHARACTERISTICS = [
  // Sorted alphabetically for consistent display across the app.
  { id: "AGGRESSIVE", label: "Aggressive" },
  { id: "ALLERGIES", label: "Allergies" },
  { id: "BLIND", label: "Blind" },
  { id: "DEAF", label: "Deaf" },
  { id: "MEDICATIONS", label: "Medications" },
  { id: "MOBILITY_ISSUES", label: "Mobility Issues" },
  { id: "REACTIVE", label: "Reactive" },
  { id: "SEPARATION_ANXIETY", label: "Separation Anxiety" },
  { id: "SHY", label: "Shy" },
] as const;

// Strongly typed ID union so the rest of the app can rely on these values
// instead of open-ended strings.
export type PetCharacteristicId =
  (typeof PET_CHARACTERISTICS)[number]["id"];

// Flat list of IDs for quick validation in API routes and forms.
export const PET_CHARACTERISTIC_IDS: PetCharacteristicId[] =
  PET_CHARACTERISTICS.map((c) => c.id);
