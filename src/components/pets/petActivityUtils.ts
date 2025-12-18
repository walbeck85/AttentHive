'use client';

export type ActionType = 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';

// Metadata type for WALK activities
export type WalkMetadata = {
  durationSeconds: number;
  bathroomEvents: Array<{
    type: 'URINATION' | 'DEFECATION';
    occurredAt: string;
    minutesIntoWalk: number;
  }>;
};

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

export function getActivityLabel(type: ActionType): string {
  switch (type) {
    case 'FEED':
      return 'Feed';
    case 'WALK':
      return 'Walk';
    case 'MEDICATE':
      return 'Medicate';
    case 'ACCIDENT':
      return 'Accident';
    default:
      return 'Log';
  }
}
