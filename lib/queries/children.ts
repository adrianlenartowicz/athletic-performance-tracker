import prisma from '@/lib/prisma';

export function getChildrenForUser(userId: string) {
  return prisma.child.findMany({
    where: {
      parentId: userId,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export async function getAllChildrenForTrainer() {
  return prisma.child.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function getChildrenByIds(childIds: string[]) {
  if (childIds.length === 0) return [];

  return prisma.child.findMany({
    where: {
      id: { in: childIds },
    },
    orderBy: { name: 'asc' },
  });
}
