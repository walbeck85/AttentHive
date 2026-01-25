import { ActivityType } from '@prisma/client';

// Maps each subtype to its valid activity types
export const ACTIONS_BY_SUBTYPE: Record<string, ActivityType[]> = {
  // Pets - Dogs
  DOG: [
    ActivityType.WALK,
    ActivityType.FEED,
    ActivityType.MEDICATE,
    ActivityType.BATHROOM,
    ActivityType.ACCIDENT,
    ActivityType.GROOMING,
    ActivityType.VET_VISIT,
    ActivityType.WELLNESS_CHECK,
    ActivityType.NOTE,
  ],

  // Pets - Cats
  CAT: [
    ActivityType.FEED,
    ActivityType.MEDICATE,
    ActivityType.LITTER_BOX,
    ActivityType.ACCIDENT,
    ActivityType.GROOMING,
    ActivityType.VET_VISIT,
    ActivityType.WELLNESS_CHECK,
    ActivityType.NOTE,
  ],

  // Pets - Other animals
  BIRD: [
    ActivityType.FEED,
    ActivityType.MEDICATE,
    ActivityType.CAGE_CLEAN,
    ActivityType.VET_VISIT,
    ActivityType.NOTE,
  ],
  FISH: [
    ActivityType.FEED,
    ActivityType.TANK_CLEAN,
    ActivityType.WATER_TEST,
    ActivityType.NOTE,
  ],
  SMALL_MAMMAL: [
    ActivityType.FEED,
    ActivityType.MEDICATE,
    ActivityType.CAGE_CLEAN,
    ActivityType.EXERCISE,
    ActivityType.VET_VISIT,
    ActivityType.NOTE,
  ],
  REPTILE: [
    ActivityType.FEED,
    ActivityType.MEDICATE,
    ActivityType.HABITAT_CLEAN,
    ActivityType.TEMPERATURE_CHECK,
    ActivityType.VET_VISIT,
    ActivityType.NOTE,
  ],
  EXOTIC: [
    ActivityType.FEED,
    ActivityType.MEDICATE,
    ActivityType.VET_VISIT,
    ActivityType.NOTE,
  ],

  // Plants
  INDOOR: [
    ActivityType.WATER,
    ActivityType.FERTILIZE,
    ActivityType.PRUNE,
    ActivityType.REPOT,
    ActivityType.SUNLIGHT_ADJUST,
    ActivityType.NOTE,
  ],
  OUTDOOR: [
    ActivityType.WATER,
    ActivityType.FERTILIZE,
    ActivityType.PRUNE,
    ActivityType.NOTE,
  ],
  SUCCULENT: [
    ActivityType.WATER,
    ActivityType.FERTILIZE,
    ActivityType.REPOT,
    ActivityType.NOTE,
  ],

  // People
  ELDER: [
    ActivityType.MEDICATE,
    ActivityType.MEAL,
    ActivityType.DOCTOR_VISIT,
    ActivityType.WELLNESS_CHECK,
    ActivityType.APPOINTMENT,
    ActivityType.ACTIVITY,
    ActivityType.NOTE,
  ],
  CHILD: [
    ActivityType.MEAL,
    ActivityType.MEDICATE,
    ActivityType.DOCTOR_VISIT,
    ActivityType.ACTIVITY,
    ActivityType.NOTE,
  ],
  OTHER: [
    ActivityType.MEDICATE,
    ActivityType.MEAL,
    ActivityType.DOCTOR_VISIT,
    ActivityType.APPOINTMENT,
    ActivityType.NOTE,
  ],
};

/**
 * Get valid activity types for a given subtype
 * Falls back to NOTE only for unknown subtypes
 */
export function getActionsForSubtype(subtype: string): ActivityType[] {
  return ACTIONS_BY_SUBTYPE[subtype] || [ActivityType.NOTE];
}

/**
 * Check if an action is valid for a given subtype
 */
export function isValidActionForSubtype(action: ActivityType, subtype: string): boolean {
  return getActionsForSubtype(subtype).includes(action);
}
