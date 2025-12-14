import {
  formatWalkDuration,
  formatWalkDetails,
  getActivityLabel,
  type WalkMetadata,
} from '@/components/pets/petActivityUtils';

describe('formatWalkDuration', () => {
  it('formats seconds to minutes only', () => {
    expect(formatWalkDuration(300)).toBe('5 min');
    expect(formatWalkDuration(60)).toBe('1 min');
    expect(formatWalkDuration(0)).toBe('0 min');
  });

  it('formats seconds to hours and minutes', () => {
    expect(formatWalkDuration(3600)).toBe('1 hr');
    expect(formatWalkDuration(3660)).toBe('1 hr 1 min');
    expect(formatWalkDuration(4200)).toBe('1 hr 10 min');
    expect(formatWalkDuration(7200)).toBe('2 hr');
    expect(formatWalkDuration(7800)).toBe('2 hr 10 min');
  });

  it('handles edge cases', () => {
    expect(formatWalkDuration(59)).toBe('0 min');
    expect(formatWalkDuration(90)).toBe('1 min');
    expect(formatWalkDuration(3599)).toBe('59 min');
  });
});

describe('formatWalkDetails', () => {
  it('returns "Walk" when metadata is null', () => {
    expect(formatWalkDetails(null)).toBe('Walk');
  });

  it('returns "Walk" when metadata is undefined', () => {
    expect(formatWalkDetails(undefined)).toBe('Walk');
  });

  it('formats walk with duration only', () => {
    const metadata: WalkMetadata = {
      durationSeconds: 300,
      bathroomEvents: [],
    };
    expect(formatWalkDetails(metadata)).toBe('Walk · 5 min');
  });

  it('formats walk with pee events only', () => {
    const metadata: WalkMetadata = {
      durationSeconds: 900,
      bathroomEvents: [
        { type: 'URINATION', occurredAt: '2024-01-15T10:05:00Z', minutesIntoWalk: 5 },
        { type: 'URINATION', occurredAt: '2024-01-15T10:10:00Z', minutesIntoWalk: 10 },
      ],
    };
    expect(formatWalkDetails(metadata)).toBe('Walk · 15 min · 💧×2');
  });

  it('formats walk with poop events only', () => {
    const metadata: WalkMetadata = {
      durationSeconds: 1380,
      bathroomEvents: [
        { type: 'DEFECATION', occurredAt: '2024-01-15T10:10:00Z', minutesIntoWalk: 10 },
      ],
    };
    expect(formatWalkDetails(metadata)).toBe('Walk · 23 min · 💩×1');
  });

  it('formats walk with both pee and poop events', () => {
    const metadata: WalkMetadata = {
      durationSeconds: 2700,
      bathroomEvents: [
        { type: 'URINATION', occurredAt: '2024-01-15T10:05:00Z', minutesIntoWalk: 5 },
        { type: 'URINATION', occurredAt: '2024-01-15T10:15:00Z', minutesIntoWalk: 15 },
        { type: 'URINATION', occurredAt: '2024-01-15T10:30:00Z', minutesIntoWalk: 30 },
        { type: 'DEFECATION', occurredAt: '2024-01-15T10:20:00Z', minutesIntoWalk: 20 },
      ],
    };
    expect(formatWalkDetails(metadata)).toBe('Walk · 45 min · 💧×3 💩×1');
  });

  it('formats long walks with hours', () => {
    const metadata: WalkMetadata = {
      durationSeconds: 4200,
      bathroomEvents: [
        { type: 'URINATION', occurredAt: '2024-01-15T10:30:00Z', minutesIntoWalk: 30 },
        { type: 'DEFECATION', occurredAt: '2024-01-15T11:00:00Z', minutesIntoWalk: 60 },
      ],
    };
    expect(formatWalkDetails(metadata)).toBe('Walk · 1 hr 10 min · 💧×1 💩×1');
  });

  it('handles missing bathroomEvents array gracefully', () => {
    const metadata = {
      durationSeconds: 600,
    } as WalkMetadata;
    expect(formatWalkDetails(metadata)).toBe('Walk · 10 min');
  });
});

describe('getActivityLabel', () => {
  it('returns correct labels for all activity types', () => {
    expect(getActivityLabel('FEED')).toBe('Feed');
    expect(getActivityLabel('WALK')).toBe('Walk');
    expect(getActivityLabel('MEDICATE')).toBe('Medicate');
    expect(getActivityLabel('ACCIDENT')).toBe('Accident');
  });

  it('returns "Log" for unknown activity types', () => {
    expect(getActivityLabel('UNKNOWN' as 'FEED')).toBe('Log');
  });
});
