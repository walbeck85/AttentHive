import { ActivityType, PetType } from '@prisma/client';
import { getActionsForSubtype } from '@/lib/action-config';

export type AccidentSubtype = 'pee' | 'poo' | 'vomit';
export type BathroomSubtype = 'pee' | 'poo';

export interface ActivityConfig {
  type: ActivityType;
  label: string;
  icon: string;
  modalType: 'confirm' | 'timer' | 'bathroom' | 'accident';
  /** Actions that should be visually highlighted as warnings (e.g., accidents) */
  isDanger?: boolean;
}

// Complete mapping of all ActivityTypes to their display config
export const ACTIVITY_CONFIGS: Record<ActivityType, ActivityConfig> = {
  // Pet actions - existing
  FEED: { type: 'FEED', label: 'Feed', icon: 'Utensils', modalType: 'confirm' },
  WALK: { type: 'WALK', label: 'Walk', icon: 'Footprints', modalType: 'timer' },
  MEDICATE: { type: 'MEDICATE', label: 'Medicate', icon: 'Pill', modalType: 'confirm' },
  BATHROOM: { type: 'BATHROOM', label: 'Bathroom', icon: 'Bath', modalType: 'bathroom' },
  ACCIDENT: { type: 'ACCIDENT', label: 'Accident', icon: 'AlertTriangle', modalType: 'accident', isDanger: true },
  LITTER_BOX: { type: 'LITTER_BOX', label: 'Litter Box', icon: 'Box', modalType: 'confirm' },
  WELLNESS_CHECK: { type: 'WELLNESS_CHECK', label: 'Wellness Check', icon: 'Heart', modalType: 'confirm' },

  // Pet actions - new
  GROOMING: { type: 'GROOMING', label: 'Grooming', icon: 'Scissors', modalType: 'confirm' },
  VET_VISIT: { type: 'VET_VISIT', label: 'Vet Visit', icon: 'Stethoscope', modalType: 'confirm' },
  CAGE_CLEAN: { type: 'CAGE_CLEAN', label: 'Cage Clean', icon: 'Sparkles', modalType: 'confirm' },
  TANK_CLEAN: { type: 'TANK_CLEAN', label: 'Tank Clean', icon: 'Waves', modalType: 'confirm' },
  WATER_TEST: { type: 'WATER_TEST', label: 'Water Test', icon: 'TestTube', modalType: 'confirm' },
  HABITAT_CLEAN: { type: 'HABITAT_CLEAN', label: 'Habitat Clean', icon: 'Home', modalType: 'confirm' },
  EXERCISE: { type: 'EXERCISE', label: 'Exercise', icon: 'Dumbbell', modalType: 'confirm' },
  TEMPERATURE_CHECK: { type: 'TEMPERATURE_CHECK', label: 'Temp Check', icon: 'Thermometer', modalType: 'confirm' },

  // Plant actions
  WATER: { type: 'WATER', label: 'Water', icon: 'Droplets', modalType: 'confirm' },
  FERTILIZE: { type: 'FERTILIZE', label: 'Fertilize', icon: 'Leaf', modalType: 'confirm' },
  PRUNE: { type: 'PRUNE', label: 'Prune', icon: 'Scissors', modalType: 'confirm' },
  REPOT: { type: 'REPOT', label: 'Repot', icon: 'FlowerPot', modalType: 'confirm' },
  SUNLIGHT_ADJUST: { type: 'SUNLIGHT_ADJUST', label: 'Adjust Light', icon: 'Sun', modalType: 'confirm' },

  // People actions
  MEAL: { type: 'MEAL', label: 'Meal', icon: 'Utensils', modalType: 'confirm' },
  DOCTOR_VISIT: { type: 'DOCTOR_VISIT', label: 'Doctor', icon: 'Stethoscope', modalType: 'confirm' },
  APPOINTMENT: { type: 'APPOINTMENT', label: 'Appointment', icon: 'Calendar', modalType: 'confirm' },
  ACTIVITY: { type: 'ACTIVITY', label: 'Activity', icon: 'Activity', modalType: 'confirm' },

  // Shared
  NOTE: { type: 'NOTE', label: 'Note', icon: 'StickyNote', modalType: 'confirm' },
};

/**
 * Get activity configs for a given subtype using action-config mapping
 */
export function getActivitiesForSubtype(subtype: string): ActivityConfig[] {
  const validActions = getActionsForSubtype(subtype);
  return validActions.map((action) => ACTIVITY_CONFIGS[action]);
}

/**
 * @deprecated Use getActivitiesForSubtype instead
 * Get activities for legacy PetType (DOG/CAT only)
 */
export function getActivitiesForPetType(petType: PetType): ActivityConfig[] {
  // Map legacy PetType to subtype
  return getActivitiesForSubtype(petType);
}

export function getActivityConfig(type: ActivityType): ActivityConfig | undefined {
  return ACTIVITY_CONFIGS[type];
}

export function getActivityLabel(type: ActivityType): string {
  return ACTIVITY_CONFIGS[type]?.label ?? 'Log';
}
