import { getActionsForSubtype, isValidActionForSubtype, ACTIONS_BY_SUBTYPE } from '../action-config';
import { ActivityType } from '@prisma/client';

describe('action-config', () => {
  describe('getActionsForSubtype', () => {
    it('returns correct actions for DOG', () => {
      const actions = getActionsForSubtype('DOG');
      expect(actions).toContain(ActivityType.WALK);
      expect(actions).toContain(ActivityType.FEED);
      expect(actions).toContain(ActivityType.BATHROOM);
      expect(actions).not.toContain(ActivityType.LITTER_BOX);
    });

    it('returns correct actions for CAT', () => {
      const actions = getActionsForSubtype('CAT');
      expect(actions).toContain(ActivityType.LITTER_BOX);
      expect(actions).toContain(ActivityType.FEED);
      expect(actions).not.toContain(ActivityType.WALK);
      expect(actions).not.toContain(ActivityType.BATHROOM);
    });

    it('returns correct actions for INDOOR plant', () => {
      const actions = getActionsForSubtype('INDOOR');
      expect(actions).toContain(ActivityType.WATER);
      expect(actions).toContain(ActivityType.FERTILIZE);
      expect(actions).not.toContain(ActivityType.FEED);
    });

    it('returns correct actions for ELDER person', () => {
      const actions = getActionsForSubtype('ELDER');
      expect(actions).toContain(ActivityType.MEAL);
      expect(actions).toContain(ActivityType.DOCTOR_VISIT);
      expect(actions).not.toContain(ActivityType.WALK);
    });

    it('returns NOTE only for unknown subtype', () => {
      const actions = getActionsForSubtype('UNKNOWN_TYPE');
      expect(actions).toEqual([ActivityType.NOTE]);
    });
  });

  describe('isValidActionForSubtype', () => {
    it('returns true for valid dog action', () => {
      expect(isValidActionForSubtype(ActivityType.WALK, 'DOG')).toBe(true);
    });

    it('returns false for invalid dog action', () => {
      expect(isValidActionForSubtype(ActivityType.LITTER_BOX, 'DOG')).toBe(false);
    });

    it('returns true for valid cat action', () => {
      expect(isValidActionForSubtype(ActivityType.LITTER_BOX, 'CAT')).toBe(true);
    });

    it('returns false for invalid cat action', () => {
      expect(isValidActionForSubtype(ActivityType.WALK, 'CAT')).toBe(false);
    });

    it('returns true for NOTE on any subtype', () => {
      expect(isValidActionForSubtype(ActivityType.NOTE, 'DOG')).toBe(true);
      expect(isValidActionForSubtype(ActivityType.NOTE, 'CAT')).toBe(true);
      expect(isValidActionForSubtype(ActivityType.NOTE, 'INDOOR')).toBe(true);
    });
  });

  describe('ACTIONS_BY_SUBTYPE coverage', () => {
    it('has actions defined for all expected subtypes', () => {
      const expectedSubtypes = [
        'DOG', 'CAT', 'BIRD', 'FISH', 'SMALL_MAMMAL', 'REPTILE', 'EXOTIC',
        'INDOOR', 'OUTDOOR', 'SUCCULENT',
        'ELDER', 'CHILD', 'OTHER'
      ];
      expectedSubtypes.forEach(subtype => {
        expect(ACTIONS_BY_SUBTYPE[subtype]).toBeDefined();
        expect(ACTIONS_BY_SUBTYPE[subtype].length).toBeGreaterThan(0);
      });
    });
  });
});
