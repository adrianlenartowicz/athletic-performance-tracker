import prisma from '@/lib/prisma';
import { DashboardLayout } from './components/dashboard/dashboard';
import { TestProgressWidget } from './components/widgets/TestProgressWidget';
import { getChildrenWithResults } from "@/lib/queries/children";

export default async function Home() {
  const children = await getChildrenWithResults();
  const child = children[0];
  console.log('child', child);
  console.log('results', child.results);
  return (
    <DashboardLayout>
      <TestProgressWidget results={child.results} />
    </DashboardLayout>
  );
}
