import prisma from '@/lib/prisma';
import { DashboardLayout } from './components/dashboard/dashboard';
import { TestProgressWidget } from './components/widgets/TestProgressWidget';
import { getChildDashboard } from '@/lib/queries/dashboard';

export default async function Home() {
  const dashboard = await getChildDashboard('cml3q4dps0001t4tikp6kt1ps');

  return (
    <DashboardLayout>
      {dashboard.widgets.map((widget) => (
        <TestProgressWidget
          key={widget.testType}
          testType={widget.testType}
          results={widget.results}
        />
      ))}
    </DashboardLayout>
  );
}
