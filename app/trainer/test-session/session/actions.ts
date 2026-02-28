'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { TestType } from '@/lib/domain/tests';

type SaveResultInput = {
  childId: string;
  testType: TestType;
  value: number;
  unit: string;
};

export async function saveTestResult(input: SaveResultInput) {
  const session = await auth();

  if (!session || session.user.role !== 'TRAINER') {
    redirect('/');
  }

  const child = await prisma.child.findFirst({
    where: {
      id: input.childId,
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
      childId: input.childId,
      testType: input.testType,
      value: input.value,
      unit: input.unit,
      testedAt: new Date(),
    },
  });
}
