import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { getChildDashboardForUser } from '@/lib/queries/dashboard';
import { DashboardLayout } from '@/app/components/dashboard/dashboard';
import { TestProgressWidgetServer } from '@/app/components/widgets/TestProgressWidget.server';
import { PhysiotherapistReportWidget } from '@/app/components/widgets/PhysiotherapistReportWidget';

type Props = {
  params: Promise<{
    childId: string;
  }>;
};

export default async function ChildDashboardPage({ params }: Props) {
  const { childId } = await params;

  const session = await requireAuth();

  const dashboard = await getChildDashboardForUser(session.user.id, childId);

  if (!dashboard) {
    redirect('/children');
  }

  const physiotherapistReports = dashboard.physiotherapistReports.map((report) => ({
    id: report.id,
    title: report.title,
    observations: report.observations,
    recommendations: report.recommendations,
    comparisonToPrevious: report.comparisonToPrevious,
    reportDateLabel: report.reportDate.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
  }));

  const latestTestDateLabel = dashboard.latestTestDate?.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const latestReportDateLabel = dashboard.latestPhysiotherapistReportDate?.toLocaleDateString(
    'pl-PL',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }
  );

  return (
    <DashboardLayout>
      <div className="md:col-span-2 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Postępy dziecka - {dashboard.child.name}
        </h1>

        <p className="text-sm text-muted-foreground">Podsumowanie wyników i rozwoju sprawności</p>
        {(latestTestDateLabel || latestReportDateLabel) && (
          <p className="text-sm text-muted-foreground">
            {latestTestDateLabel ? `Ostatni pomiar: ${latestTestDateLabel}` : null}
            {latestTestDateLabel && latestReportDateLabel ? ' · ' : null}
            {latestReportDateLabel ? `Najnowszy raport fizjo: ${latestReportDateLabel}` : null}
          </p>
        )}
      </div>

      {dashboard.widgets.map((widget) => (
        <TestProgressWidgetServer
          key={widget.testType}
          testType={widget.testType}
          results={widget.results}
        />
      ))}

      {physiotherapistReports.length > 0 ? (
        <PhysiotherapistReportWidget reports={physiotherapistReports} />
      ) : null}
    </DashboardLayout>
  );
}
