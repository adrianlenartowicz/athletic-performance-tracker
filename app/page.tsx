import prisma from '@/lib/prisma';
import { DashboardLayout } from './components/dashboard/dashboard';
import { TestProgressWidget } from './components/widgets/TestProgressWidget';
import { getChildrenWithResults } from "@/lib/queries/children";

export default async function Home() {
  const children = await getChildrenWithResults();
  const child = children[0];
  const DEFAULT_TEST_TYPE = "sprint_20m";
  const sprintResults = child.results.filter(result => result.testType === DEFAULT_TEST_TYPE);

  return (
    <DashboardLayout>
      <TestProgressWidget results={sprintResults} />
    </DashboardLayout>
  );
}
