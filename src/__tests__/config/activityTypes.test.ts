import {
  ACTIVITY_CONFIGS,
  getActivitiesForPetType,
  getActivityConfig,
  getActivityLabel,
} from '@/config/activityTypes';

describe('ACTIVITY_CONFIGS', () => {
  it('contains all 7 activity types', () => {
    expect(ACTIVITY_CONFIGS).toHaveLength(7);
    const types = ACTIVITY_CONFIGS.map((c) => c.type);
    expect(types).toContain('FEED');
    expect(types).toContain('WALK');
    expect(types).toContain('MEDICATE');
    expect(types).toContain('BATHROOM');
    expect(types).toContain('ACCIDENT');
    expect(types).toContain('LITTER_BOX');
    expect(types).toContain('WELLNESS_CHECK');
  });

  it('has correct modal types for each activity', () => {
    const walkConfig = ACTIVITY_CONFIGS.find((c) => c.type === 'WALK');
    const bathroomConfig = ACTIVITY_CONFIGS.find((c) => c.type === 'BATHROOM');
    const accidentConfig = ACTIVITY_CONFIGS.find((c) => c.type === 'ACCIDENT');
    const feedConfig = ACTIVITY_CONFIGS.find((c) => c.type === 'FEED');

    expect(walkConfig?.modalType).toBe('timer');
    expect(bathroomConfig?.modalType).toBe('bathroom');
    expect(accidentConfig?.modalType).toBe('accident');
    expect(feedConfig?.modalType).toBe('confirm');
  });
});

describe('getActivitiesForPetType', () => {
  describe('DOG activities', () => {
    const dogActivities = getActivitiesForPetType('DOG');
    const dogTypes = dogActivities.map((c) => c.type);

    it('includes WALK for dogs', () => {
      expect(dogTypes).toContain('WALK');
    });

    it('excludes LITTER_BOX for dogs', () => {
      expect(dogTypes).not.toContain('LITTER_BOX');
    });

    it('includes shared activities', () => {
      expect(dogTypes).toContain('FEED');
      expect(dogTypes).toContain('MEDICATE');
      expect(dogTypes).toContain('BATHROOM');
      expect(dogTypes).toContain('ACCIDENT');
      expect(dogTypes).toContain('WELLNESS_CHECK');
    });

    it('returns 6 activities for dogs', () => {
      expect(dogActivities).toHaveLength(6);
    });
  });

  describe('CAT activities', () => {
    const catActivities = getActivitiesForPetType('CAT');
    const catTypes = catActivities.map((c) => c.type);

    it('includes LITTER_BOX for cats', () => {
      expect(catTypes).toContain('LITTER_BOX');
    });

    it('excludes WALK for cats', () => {
      expect(catTypes).not.toContain('WALK');
    });

    it('includes shared activities', () => {
      expect(catTypes).toContain('FEED');
      expect(catTypes).toContain('MEDICATE');
      expect(catTypes).toContain('BATHROOM');
      expect(catTypes).toContain('ACCIDENT');
      expect(catTypes).toContain('WELLNESS_CHECK');
    });

    it('returns 6 activities for cats', () => {
      expect(catActivities).toHaveLength(6);
    });
  });
});

describe('getActivityConfig', () => {
  it('returns config for valid activity type', () => {
    const feedConfig = getActivityConfig('FEED');
    expect(feedConfig).toBeDefined();
    expect(feedConfig?.label).toBe('Feed');
    expect(feedConfig?.icon).toBe('Utensils');
  });

  it('returns config for new activity types', () => {
    const litterBoxConfig = getActivityConfig('LITTER_BOX');
    expect(litterBoxConfig).toBeDefined();
    expect(litterBoxConfig?.label).toBe('Litter Box');
    expect(litterBoxConfig?.allowedPetTypes).toEqual(['CAT']);

    const wellnessConfig = getActivityConfig('WELLNESS_CHECK');
    expect(wellnessConfig).toBeDefined();
    expect(wellnessConfig?.label).toBe('Wellness Check');
    expect(wellnessConfig?.allowedPetTypes).toBe('all');
  });

  it('returns undefined for unknown activity type', () => {
    const unknownConfig = getActivityConfig('UNKNOWN' as 'FEED');
    expect(unknownConfig).toBeUndefined();
  });
});

describe('getActivityLabel', () => {
  it('returns labels for all activity types', () => {
    expect(getActivityLabel('FEED')).toBe('Feed');
    expect(getActivityLabel('WALK')).toBe('Walk');
    expect(getActivityLabel('MEDICATE')).toBe('Medicate');
    expect(getActivityLabel('BATHROOM')).toBe('Bathroom');
    expect(getActivityLabel('ACCIDENT')).toBe('Accident');
    expect(getActivityLabel('LITTER_BOX')).toBe('Litter Box');
    expect(getActivityLabel('WELLNESS_CHECK')).toBe('Wellness Check');
  });

  it('returns "Log" for unknown activity type', () => {
    expect(getActivityLabel('UNKNOWN' as 'FEED')).toBe('Log');
  });
});
