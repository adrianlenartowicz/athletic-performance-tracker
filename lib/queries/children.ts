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
