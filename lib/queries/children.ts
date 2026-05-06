import prisma from '@/lib/prisma';

export type ChildListItem = {
  id: string;
  name: string;
  testTypesCount: number;
  latestPhysiotherapistReportDate: Date | null;
};

export async function getChildrenForUser(userId: string): Promise<ChildListItem[]> {
  const children = await prisma.child.findMany({
    where: {
      parentId: userId,
    },
    select: {
      id: true,
      name: true,
      results: {
        select: {
          testType: true,
        },
      },
      physiotherapistReports: {
        orderBy: { reportDate: 'desc' },
        take: 1,
        select: {
          reportDate: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return children.map((child) => ({
    id: child.id,
    name: child.name,
    testTypesCount: new Set(child.results.map((result) => result.testType)).size,
    latestPhysiotherapistReportDate: child.physiotherapistReports[0]?.reportDate ?? null,
  }));
}

export type TrainerChildListItem = {
  id: string;
  name: string;
  birthYear: number;
};

export async function getAllChildrenForTrainer(trainerId: string): Promise<TrainerChildListItem[]> {
  return prisma.child.findMany({
    where: {
      group: {
        trainers: {
          some: {
            trainerId,
          },
        },
      },
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      birthYear: true,
    },
  });
}

export async function getChildrenByIds(
  childIds: string[],
  trainerId: string
): Promise<TrainerChildListItem[]> {
  if (childIds.length === 0) return [];

  return prisma.child.findMany({
    where: {
      id: { in: childIds },
      group: {
        trainers: {
          some: {
            trainerId,
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}
