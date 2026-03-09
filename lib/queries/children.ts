import prisma from '@/lib/prisma';

export type ChildListItem = {
  id: string;
  name: string;
};

export function getChildrenForUser(userId: string): Promise<ChildListItem[]> {
  return prisma.child.findMany({
    where: {
      parentId: userId,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
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
