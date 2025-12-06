'use client';

export type ActionType = 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    // Explicitly pin the timezone so SSR and client renders match.
    timeZone: 'UTC',
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
