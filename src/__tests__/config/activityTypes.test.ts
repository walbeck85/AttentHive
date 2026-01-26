import {
  ACTIVITY_CONFIGS,
  getActivitiesForSubtype,
  getActivitiesForPetType,
  getActivityConfig,
  getActivityLabel,
} from '@/config/activityTypes';

describe('ACTIVITY_CONFIGS', () => {
  it('contains all expected activity types', () => {
    const types = Object.keys(ACTIVITY_CONFIGS);
    expect(types).toContain('FEED');
    expect(types).toContain('WALK');
    expect(types).toContain('MEDICATE');
    expect(types).toContain('BATHROOM');
    expect(types).toContain('ACCIDENT');
    expect(types).toContain('LITTER_BOX');
    expect(types).toContain('WELLNESS_CHECK');
    // New activity types
    expect(types).toContain('WATER');
    expect(types).toContain('FERTILIZE');
    expect(types).toContain('MEAL');
    expect(types).toContain('NOTE');
  });

  it('has correct modal types for each activity', () => {
    expect(ACTIVITY_CONFIGS.WALK?.modalType).toBe('timer');
    expect(ACTIVITY_CONFIGS.BATHROOM?.modalType).toBe('bathroom');
    expect(ACTIVITY_CONFIGS.ACCIDENT?.modalType).toBe('accident');
    expect(ACTIVITY_CONFIGS.FEED?.modalType).toBe('confirm');
  });
});

describe('getActivitiesForSubtype', () => {
  describe('DOG activities', () => {
    const dogActivities = getActivitiesForSubtype('DOG');
    const dogTypes = dogActivities.map((c) => c.type);

    it('includes WALK for dogs', () => {
      expect(dogTypes).toContain('WALK');
    });

    it('excludes LITTER_BOX for dogs', () => {
      expect(dogTypes).not.toContain('LITTER_BOX');
    });

    it('includes expected activities', () => {
      expect(dogTypes).toContain('FEED');
      expect(dogTypes).toContain('MEDICATE');
      expect(dogTypes).toContain('BATHROOM');
      expect(dogTypes).toContain('ACCIDENT');
      expect(dogTypes).toContain('WELLNESS_CHECK');
    });
  });

  describe('CAT activities', () => {
    const catActivities = getActivitiesForSubtype('CAT');
    const catTypes = catActivities.map((c) => c.type);

    it('includes LITTER_BOX for cats', () => {
      expect(catTypes).toContain('LITTER_BOX');
    });

    it('excludes WALK for cats', () => {
      expect(catTypes).not.toContain('WALK');
    });

    it('includes expected activities', () => {
      expect(catTypes).toContain('FEED');
      expect(catTypes).toContain('MEDICATE');
      expect(catTypes).toContain('ACCIDENT');
      expect(catTypes).toContain('WELLNESS_CHECK');
    });
  });

  describe('INDOOR plant activities', () => {
    const plantActivities = getActivitiesForSubtype('INDOOR');
    const plantTypes = plantActivities.map((c) => c.type);

    it('includes plant-specific actions', () => {
      expect(plantTypes).toContain('WATER');
      expect(plantTypes).toContain('FERTILIZE');
      expect(plantTypes).toContain('PRUNE');
      expect(plantTypes).toContain('REPOT');
      expect(plantTypes).toContain('SUNLIGHT_ADJUST');
    });

    it('excludes pet actions', () => {
      expect(plantTypes).not.toContain('WALK');
      expect(plantTypes).not.toContain('FEED');
      expect(plantTypes).not.toContain('MEDICATE');
    });
  });

  describe('ELDER person activities', () => {
    const elderActivities = getActivitiesForSubtype('ELDER');
    const elderTypes = elderActivities.map((c) => c.type);

    it('includes person-specific actions', () => {
      expect(elderTypes).toContain('MEAL');
      expect(elderTypes).toContain('DOCTOR_VISIT');
      expect(elderTypes).toContain('APPOINTMENT');
      expect(elderTypes).toContain('ACTIVITY');
    });

    it('includes shared actions', () => {
      expect(elderTypes).toContain('MEDICATE');
      expect(elderTypes).toContain('WELLNESS_CHECK');
      expect(elderTypes).toContain('NOTE');
    });

    it('excludes pet-only actions', () => {
      expect(elderTypes).not.toContain('WALK');
      expect(elderTypes).not.toContain('FEED');
      expect(elderTypes).not.toContain('LITTER_BOX');
    });
  });
});

describe('getActivitiesForPetType (legacy)', () => {
  it('returns activities for DOG', () => {
    const dogActivities = getActivitiesForPetType('DOG');
    const dogTypes = dogActivities.map((c) => c.type);
    expect(dogTypes).toContain('WALK');
    expect(dogTypes).toContain('FEED');
  });

  it('returns activities for CAT', () => {
    const catActivities = getActivitiesForPetType('CAT');
    const catTypes = catActivities.map((c) => c.type);
    expect(catTypes).toContain('LITTER_BOX');
    expect(catTypes).toContain('FEED');
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

    const waterConfig = getActivityConfig('WATER');
    expect(waterConfig).toBeDefined();
    expect(waterConfig?.label).toBe('Water');
    expect(waterConfig?.icon).toBe('Droplets');
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
    expect(getActivityLabel('WATER')).toBe('Water');
    expect(getActivityLabel('MEAL')).toBe('Meal');
  });

  it('returns "Log" for unknown activity type', () => {
    expect(getActivityLabel('UNKNOWN' as 'FEED')).toBe('Log');
  });
});
