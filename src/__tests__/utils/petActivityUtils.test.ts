import {
  formatWalkDuration,
  formatWalkDetails,
  getActivityLabel,
  formatActivityDisplay,
  type WalkMetadata,
  type BathroomMetadata,
  type AccidentMetadata,
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
    expect(getActivityLabel('BATHROOM')).toBe('Bathroom');
    expect(getActivityLabel('LITTER_BOX')).toBe('Litter Box');
    expect(getActivityLabel('WELLNESS_CHECK')).toBe('Wellness Check');
  });

  it('returns "Log" for unknown activity types', () => {
    expect(getActivityLabel('UNKNOWN' as 'FEED')).toBe('Log');
  });
});

describe('formatActivityDisplay', () => {
  describe('WALK activities', () => {
    it('formats walk with metadata', () => {
      const metadata: WalkMetadata = {
        durationSeconds: 1800,
        bathroomEvents: [
          { type: 'URINATION', occurredAt: '2024-01-15T10:15:00Z', minutesIntoWalk: 15 },
        ],
      };
      expect(formatActivityDisplay('WALK', metadata)).toBe('Walk · 30 min · 💧×1');
    });

    it('returns "Walk" when metadata is null', () => {
      expect(formatActivityDisplay('WALK', null)).toBe('Walk');
    });
  });

  describe('BATHROOM activities', () => {
    it('formats bathroom with pee subtype', () => {
      const metadata: BathroomMetadata = { subtype: 'pee' };
      expect(formatActivityDisplay('BATHROOM', metadata)).toBe('Bathroom (Pee)');
    });

    it('formats bathroom with poo subtype', () => {
      const metadata: BathroomMetadata = { subtype: 'poo' };
      expect(formatActivityDisplay('BATHROOM', metadata)).toBe('Bathroom (Poo)');
    });

    it('returns "Bathroom" when metadata is null', () => {
      expect(formatActivityDisplay('BATHROOM', null)).toBe('Bathroom');
    });

    it('returns "Bathroom" when metadata has no subtype', () => {
      expect(formatActivityDisplay('BATHROOM', {})).toBe('Bathroom');
    });
  });

  describe('ACCIDENT activities', () => {
    it('formats accident with pee subtype', () => {
      const metadata: AccidentMetadata = { subtype: 'pee' };
      expect(formatActivityDisplay('ACCIDENT', metadata)).toBe('Accident (Pee)');
    });

    it('formats accident with poo subtype', () => {
      const metadata: AccidentMetadata = { subtype: 'poo' };
      expect(formatActivityDisplay('ACCIDENT', metadata)).toBe('Accident (Poo)');
    });

    it('formats accident with vomit subtype', () => {
      const metadata: AccidentMetadata = { subtype: 'vomit' };
      expect(formatActivityDisplay('ACCIDENT', metadata)).toBe('Accident (Vomit)');
    });

    it('returns "Accident" when metadata is null', () => {
      expect(formatActivityDisplay('ACCIDENT', null)).toBe('Accident');
    });

    it('returns "Accident" when metadata has no subtype', () => {
      expect(formatActivityDisplay('ACCIDENT', {})).toBe('Accident');
    });
  });

  describe('Other activities', () => {
    it('returns label for FEED', () => {
      expect(formatActivityDisplay('FEED', null)).toBe('Feed');
    });

    it('returns label for MEDICATE', () => {
      expect(formatActivityDisplay('MEDICATE', null)).toBe('Medicate');
    });

    it('returns label for LITTER_BOX', () => {
      expect(formatActivityDisplay('LITTER_BOX', null)).toBe('Litter Box');
    });

    it('returns label for WELLNESS_CHECK', () => {
      expect(formatActivityDisplay('WELLNESS_CHECK', null)).toBe('Wellness Check');
    });
  });
});
