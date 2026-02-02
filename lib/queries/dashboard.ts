import prisma from '@/lib/prisma';
import { TestType } from '@/lib/domain/tests';

type DashboardWidgetData = {
  testType: TestType;
  results: {
    value: number;
    testedAt: Date;
  }[];
};

type ChildDashboard = {
  child: {
    id: string;
    name: string;
  };
  widgets: DashboardWidgetData[];
};

export async function getChildDashboard(childId: string): Promise<ChildDashboard> {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: {
      results: {
        orderBy: { testedAt: 'asc' },
      },
    },
  });

  if (!child) {
    throw new Error('Child not found');
  }

  const resultsByTest = new Map<TestType, DashboardWidgetData['results']>();

  for (const result of child.results) {
    const testType = result.testType as TestType;

    if (!resultsByTest.has(testType)) {
      resultsByTest.set(testType, []);
    }

    resultsByTest.get(testType)!.push({
      value: result.value,
      testedAt: result.testedAt,
    });
  }

  const widgets: DashboardWidgetData[] = Array.from(resultsByTest.entries()).map(
    ([testType, results]) => ({
      testType,
      results,
    })
  );

  return {
    child: {
      id: child.id,
      name: child.name,
    },
    widgets,
  };
}
