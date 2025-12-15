// src/components/pets/petDetailTypes.ts
import type { PetCharacteristicId } from '@/lib/petCharacteristics';
import type { ActionType, WalkMetadata } from '@/components/pets/petActivityUtils';

// Shared view models for the pet detail screen.
// Keeping these types here lets the server loader and UI evolve together
// without having to chase Prisma changes in multiple places.
export type HiveMember = {
  id: string;
  userName: string | null;
  userEmail: string;
  role: 'OWNER' | 'CAREGIVER' | 'VIEWER';
};

// Backwards compatibility alias during rebrand transition
export type CareCircleMember = HiveMember;

// View-friendly version of a care log used across the detail screen.
// I am normalizing timestamps and enum types here so the UI can stay simple.
export type CareLog = {
  id: string;
  activityType: ActionType;
  createdAt: string;
  notes?: string | null;
  metadata?: WalkMetadata | null;
  user: { name: string | null };
};

// Core pet data shape for this screen, decoupled from the raw Prisma model.
// This gives the client a stable contract even if the schema grows new fields.
export type PetData = {
  id: string;
  name: string;
  type: string;
  breed: string;
  gender: string;
  birthDate: string;
  weight: number;
  careLogs: CareLog[];
  ownerId?: string;
  imageUrl?: string | null;
  characteristics?: PetCharacteristicId[];
  description?: string;
  specialNotes?: string;
};