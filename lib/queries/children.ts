import prisma from "../prisma";

export async function getChildrenWithResults() {
  return prisma.child.findMany({
    include: {
      results: {
        orderBy: {
          testedAt: "asc",
        },
      },
    },
  });
}
