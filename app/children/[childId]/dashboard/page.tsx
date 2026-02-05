import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getChildDashboardForUser } from '@/lib/queries/dashboard';
import { DashboardLayout } from '@/app/components/dashboard/dashboard';
import { TestProgressWidget } from '@/app/components/widgets/TestProgressWidget';

type Props = {
  params: Promise<{
    childId: string;
  }>;
};

export default async function ChildDashboardPage({ params }: Props) {
  const { childId } = await params;

  const session = await auth();

  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  const dashboard = await getChildDashboardForUser(session.user.id, childId);

  if (!dashboard) {
    redirect('/children');
  }

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
