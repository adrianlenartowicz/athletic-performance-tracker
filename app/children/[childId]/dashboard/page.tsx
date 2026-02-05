import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getChildDashboardForUser } from '@/lib/queries/dashboard';
import { DashboardLayout } from '@/app/components/dashboard/dashboard';
import { TestProgressWidget } from '@/app/components/widgets/TestProgressWidget';
import Link from 'next/link';

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
    <DashboardLayout
      headerSlot={
        <Link
          href="/children"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Wróć do listy dzieci
        </Link>
      }
    >
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
