import { ActivityType, PetType } from '@prisma/client';

export type AccidentSubtype = 'pee' | 'poo' | 'vomit';
export type BathroomSubtype = 'pee' | 'poo';

export interface ActivityConfig {
  type: ActivityType;
  label: string;
  icon: string;
  allowedPetTypes: PetType[] | 'all';
  modalType: 'confirm' | 'timer' | 'bathroom' | 'accident';
}

export const ACTIVITY_CONFIGS: ActivityConfig[] = [
  { type: 'WALK', label: 'Walk', icon: 'Footprints', allowedPetTypes: ['DOG'], modalType: 'timer' },
  { type: 'BATHROOM', label: 'Bathroom', icon: 'Bath', allowedPetTypes: 'all', modalType: 'bathroom' },
  { type: 'FEED', label: 'Feed', icon: 'Utensils', allowedPetTypes: 'all', modalType: 'confirm' },
  { type: 'MEDICATE', label: 'Medicate', icon: 'Pill', allowedPetTypes: 'all', modalType: 'confirm' },
  { type: 'ACCIDENT', label: 'Accident', icon: 'AlertTriangle', allowedPetTypes: 'all', modalType: 'accident' },
  { type: 'LITTER_BOX', label: 'Litter Box', icon: 'Box', allowedPetTypes: ['CAT'], modalType: 'confirm' },
  { type: 'WELLNESS_CHECK', label: 'Wellness Check', icon: 'Heart', allowedPetTypes: 'all', modalType: 'confirm' },
];

export function getActivitiesForPetType(petType: PetType): ActivityConfig[] {
  return ACTIVITY_CONFIGS.filter(
    (config) => config.allowedPetTypes === 'all' || config.allowedPetTypes.includes(petType)
  );
}

export function getActivityConfig(type: ActivityType): ActivityConfig | undefined {
  return ACTIVITY_CONFIGS.find((c) => c.type === type);
}

export function getActivityLabel(type: ActivityType): string {
  return getActivityConfig(type)?.label ?? type;
}
