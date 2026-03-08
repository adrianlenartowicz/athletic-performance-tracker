'use server';

import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { TEST_DEFINITIONS } from '@/lib/domain/tests';
import { parseSaveTestResultInput, type SaveTestResultInput } from '@/lib/validation/test-result';

export async function saveTestResult(input: SaveTestResultInput) {
  const session = await requireAuth();

  if (session.user.role !== 'TRAINER') {
    redirect('/');
  }

  const parsed = parseSaveTestResultInput(input);
  if (!parsed.success) {
    throw new Error('Invalid test result input');
  }

  const { childId, testType, value } = parsed.data;
  const testDefinition = TEST_DEFINITIONS[testType];

  const child = await prisma.child.findFirst({
    where: {
      id: childId,
      group: {
        trainers: {
          some: {
            trainerId: session.user.id,
          },
        },
      },
    },
  });

  if (!child) {
    redirect('/trainer/test-session');
  }

  await prisma.testResult.create({
    data: {
      childId,
      testType,
      value,
      unit: testDefinition.unit,
      testedAt: new Date(),
    },
  });
}
