'use client';

import { ActivityType } from '@prisma/client';
import {
  getActivityLabel as getActivityLabelFromConfig,
  type AccidentSubtype,
  type BathroomSubtype,
} from '@/config/activityTypes';

// Re-export ActivityType from Prisma for consumers that need it
export type { ActivityType } from '@prisma/client';

// Metadata type for WALK activities
export type WalkMetadata = {
  durationSeconds: number;
  bathroomEvents: Array<{
    type: 'URINATION' | 'DEFECATION';
    occurredAt: string;
    minutesIntoWalk: number;
  }>;
};

// Metadata type for BATHROOM activities
export type BathroomMetadata = {
  subtype: BathroomSubtype;
};

// Metadata type for ACCIDENT activities
export type AccidentMetadata = {
  subtype: AccidentSubtype;
};

// Union type for all possible activity metadata
export type ActivityMetadata = WalkMetadata | BathroomMetadata | AccidentMetadata | null;

// Format duration from seconds to human-readable string
export function formatWalkDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
  }
  return `${minutes} min`;
}

// Format walk details including duration and bathroom events
export function formatWalkDetails(metadata: WalkMetadata | null | undefined): string {
  if (!metadata) {
    return 'Walk';
  }

  const parts: string[] = ['Walk'];

  // Add duration
  if (typeof metadata.durationSeconds === 'number') {
    parts.push(formatWalkDuration(metadata.durationSeconds));
  }

  // Count bathroom events
  const peeCount = metadata.bathroomEvents?.filter((e) => e.type === 'URINATION').length ?? 0;
  const poopCount = metadata.bathroomEvents?.filter((e) => e.type === 'DEFECATION').length ?? 0;

  const bathroomParts: string[] = [];
  if (peeCount > 0) {
    bathroomParts.push(`💧×${peeCount}`);
  }
  if (poopCount > 0) {
    bathroomParts.push(`💩×${poopCount}`);
  }

  if (bathroomParts.length > 0) {
    parts.push(bathroomParts.join(' '));
  }

  return parts.join(' · ');
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
}

// Delegate to centralized config for activity labels
export function getActivityLabel(type: ActivityType): string {
  return getActivityLabelFromConfig(type);
}

// Capitalize first letter of a string
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Format subtype for display (pee -> Pee, poo -> Poo, vomit -> Vomit)
function formatSubtype(subtype: string): string {
  return capitalize(subtype);
}

// Check if metadata has a subtype property
function hasSubtype(
  metadata: unknown
): metadata is BathroomMetadata | AccidentMetadata {
  return (
    typeof metadata === 'object' &&
    metadata !== null &&
    'subtype' in metadata &&
    typeof (metadata as { subtype: unknown }).subtype === 'string'
  );
}

// Format activity display with metadata support
// Returns appropriate label based on activity type and any associated metadata
export function formatActivityDisplay(
  activityType: ActivityType,
  metadata?: ActivityMetadata | Record<string, unknown> | null
): string {
  // Handle WALK with duration and bathroom events
  if (activityType === 'WALK') {
    return formatWalkDetails(metadata as WalkMetadata | null);
  }

  // Handle BATHROOM with subtype
  if (activityType === 'BATHROOM' && hasSubtype(metadata)) {
    return `Bathroom (${formatSubtype(metadata.subtype)})`;
  }

  // Handle ACCIDENT with subtype
  if (activityType === 'ACCIDENT' && hasSubtype(metadata)) {
    return `Accident (${formatSubtype(metadata.subtype)})`;
  }

  // Default: return the base label
  return getActivityLabel(activityType);
}
