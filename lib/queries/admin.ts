import prisma from '@/lib/prisma';

export type AdminGroup = { id: string; name: string; location: string | null };

export type AdminChild = {
  id: string;
  name: string;
  birthYear: number;
  group: { name: string; location: string | null };
};

export async function getAdminGroups(): Promise<AdminGroup[]> {
  return prisma.group.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, location: true },
  });
}

export async function getAdminChildren(): Promise<AdminChild[]> {
  return prisma.child.findMany({
    orderBy: [{ name: 'asc' }, { birthYear: 'asc' }],
    select: {
      id: true,
      name: true,
      birthYear: true,
      group: { select: { name: true, location: true } },
    },
  });
}
