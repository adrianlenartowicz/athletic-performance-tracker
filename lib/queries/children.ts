import prisma from '@/lib/prisma';

export function getChildrenForUser(userId: string) {
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

export async function getAllChildrenForTrainer(trainerId: string) {
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

export async function getChildrenByIds(childIds: string[], trainerId: string) {
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
