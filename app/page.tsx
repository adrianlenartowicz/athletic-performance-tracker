import prisma from '@/lib/prisma';
import { DashboardLayout } from './components/dashboard/dashboard';
import { TestProgressWidget } from './components/widgets/TestProgressWidget';
import { getChildDashboard } from '@/lib/queries/dashboard';

export default async function Home() {
  // Hardcoded child ID for demo
  const dashboard = await getChildDashboard('cml5o5mfr0001ggti9bmo9v1o');

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
