import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getChildDashboardForUser } from '@/lib/queries/dashboard';
import { DashboardLayout } from '@/app/components/dashboard/dashboard';
import { TestProgressWidgetServer } from '@/app/components/widgets/TestProgressWidget.server';

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
      <div className="md:col-span-2 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Postępy dziecka</h1>

        <p className="text-sm text-muted-foreground">Podsumowanie wyników i rozwoju sprawności</p>
      </div>

      {dashboard.widgets.map((widget) => (
        <TestProgressWidgetServer
          key={widget.testType}
          testType={widget.testType}
          results={widget.results}
        />
      ))}
    </DashboardLayout>
  );
}
