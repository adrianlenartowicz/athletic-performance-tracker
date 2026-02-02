export type TestType = 'sprint_20m' | 'broad_jump' | 'vertical_jump';

export type TestDefinition = {
  type: TestType;
  label: string;
  unit: 's' | 'cm';
  betterDirection: 'lower' | 'higher';
};

export const TEST_DEFINITIONS: Record<TestType, TestDefinition> = {
  sprint_20m: {
    type: 'sprint_20m',
    label: 'Sprint 20 m',
    unit: 's',
    betterDirection: 'lower',
  },

  broad_jump: {
    type: 'broad_jump',
    label: 'Skok w dal',
    unit: 'cm',
    betterDirection: 'higher',
  },

  vertical_jump: {
    type: 'vertical_jump',
    label: 'Skok wzwyż',
    unit: 'cm',
    betterDirection: 'higher',
  },
};

export function getTestDefinition(type: TestType): TestDefinition {
  return TEST_DEFINITIONS[type];
}
