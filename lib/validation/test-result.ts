import { z } from 'zod';
import { TEST_DEFINITIONS, TestType } from '@/lib/domain/tests';

const TEST_TYPES = Object.keys(TEST_DEFINITIONS) as TestType[];
const TEST_TYPES_TUPLE = TEST_TYPES as [TestType, ...TestType[]];

export const saveTestResultSchema = z
  .object({
    childId: z.string().cuid(),
    testType: z.enum(TEST_TYPES_TUPLE),
    value: z.coerce.number().nonnegative().max(1000),
  })
  .superRefine((data, ctx) => {
    const definition = TEST_DEFINITIONS[data.testType];
    if (!definition) return;

    if (data.value < definition.minValue || data.value > definition.maxValue) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: `Value must be between ${definition.minValue} and ${definition.maxValue} ${definition.unit}`,
      });
    }
  });

export type SaveTestResultInput = z.infer<typeof saveTestResultSchema>;

export function parseSaveTestResultInput(input: unknown) {
  return saveTestResultSchema.safeParse(input);
}
