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
  physiotherapistReports: {
    id: string;
    title: string;
    reportDate: Date;
    observations: string[];
    recommendations: string[];
    comparisonToPrevious: string | null;
  }[];
};

export async function getChildDashboardForUser(
  userId: string,
  childId: string
): Promise<ChildDashboard | null> {
  const child = await prisma.child.findFirst({
    where: {
      id: childId,
      parentId: userId,
    },
    include: {
      results: {
        orderBy: { testedAt: 'asc' },
      },
      physiotherapistReports: {
        orderBy: { reportDate: 'desc' },
        select: {
          id: true,
          title: true,
          reportDate: true,
          observations: true,
          recommendations: true,
          comparisonToPrevious: true,
        },
      },
    },
  });

  if (!child) {
    return null;
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
    physiotherapistReports: child.physiotherapistReports,
  };
}
